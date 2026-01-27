/**
 * FICHIER: resend.mail.service.ts
 *
 * DESCRIPTION:
 * Implémentation du service mail avec Resend.
 * Resend est un service moderne d'envoi d'emails avec une API simple.
 *
 * CONFIGURATION:
 * - RESEND_API_KEY: Clé API Resend (obligatoire)
 * - EMAIL_FROM: Email expéditeur (ex: noreply@secondlife-exchange.com)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IMailService, SendEmailOptions } from '../interfaces/mail.service.interface';

@Injectable()
export class ResendMailService implements IMailService {
  private readonly logger = new Logger(ResendMailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromEmail = this.configService.get<string>('EMAIL_FROM');

    if (!apiKey) {
      this.logger.error(
        '❌ RESEND_API_KEY non configuré - Service email désactivé. ' +
        'Veuillez définir RESEND_API_KEY dans les variables d\'environnement.',
      );
      return;
    }

    if (!fromEmail) {
      this.logger.error(
        '❌ EMAIL_FROM non configuré - Service email désactivé. ' +
        'Veuillez définir EMAIL_FROM dans les variables d\'environnement.',
      );
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.fromEmail = fromEmail;
      this.logger.log(`✅ Service email Resend configuré avec succès (FROM: ${fromEmail})`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur configuration Resend: ${error.message}`);
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      const errorMsg = 'Service email non configuré. Vérifiez RESEND_API_KEY et EMAIL_FROM dans les variables d\'environnement.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!this.fromEmail) {
      const errorMsg = 'EMAIL_FROM non configuré. Veuillez définir EMAIL_FROM dans les variables d\'environnement.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      this.logger.log(`Tentative d'envoi email à ${options.to} depuis ${this.fromEmail}`);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      if (result.error) {
        const errorMsg = `Resend API error: ${result.error.message}`;
        this.logger.error(errorMsg);
        this.logger.error(`Détails: ${JSON.stringify(result.error)}`);

        // Message plus explicite pour les erreurs de domaine non vérifié
        if (result.error.message?.includes('domain is not verified')) {
          const domain = this.fromEmail.split('@')[1];
          throw new Error(
            `Le domaine ${domain} n'est pas vérifié dans Resend. ` +
            `Veuillez vérifier votre domaine sur https://resend.com/domains ou ` +
            `utiliser temporairement onboarding@resend.dev comme EMAIL_FROM.`
          );
        }

        throw new Error(errorMsg);
      }

      this.logger.log(`✅ Email envoyé avec succès à ${options.to} (ID: ${result.data?.id})`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur envoi email à ${options.to}: ${error.message}`);
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Convertit du HTML en texte brut (fallback pour les clients email qui ne supportent pas HTML).
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]+>/g, '') // Supprimer les balises HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}

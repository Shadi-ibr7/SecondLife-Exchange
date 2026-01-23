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
      this.logger.warn(
        'RESEND_API_KEY non configuré - Service email désactivé',
      );
      return;
    }

    if (!fromEmail) {
      this.logger.warn('EMAIL_FROM non configuré - Service email désactivé');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.fromEmail = fromEmail;
      this.logger.log('Service email Resend configuré avec succès');
    } catch (error: any) {
      this.logger.error(`Erreur configuration Resend: ${error.message}`);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      throw new Error('Service email non configuré (RESEND_API_KEY manquant)');
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      this.logger.log(`Email envoyé à ${options.to} (ID: ${result.data?.id})`);
    } catch (error: any) {
      this.logger.error(`Erreur envoi email à ${options.to}: ${error.message}`);
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

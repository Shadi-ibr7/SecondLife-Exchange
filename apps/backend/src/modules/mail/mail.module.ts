/**
 * FICHIER: mail.module.ts
 *
 * DESCRIPTION:
 * Module NestJS pour l'envoi d'emails.
 * Utilise Resend par défaut, mais peut être facilement remplacé par nodemailer SMTP.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendMailService } from './services/resend.mail.service';
import { IMailService } from './interfaces/mail.service.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IMailService',
      useClass: ResendMailService,
    },
  ],
  exports: ['IMailService'],
})
export class MailModule {}

// Export du type pour faciliter l'injection
export type MailService = IMailService;

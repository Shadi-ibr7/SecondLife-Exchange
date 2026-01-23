/**
 * FICHIER: mail.service.interface.ts
 *
 * DESCRIPTION:
 * Interface pour le service d'envoi d'emails.
 * Permet de changer facilement de provider (Resend, nodemailer SMTP, SendGrid, etc.)
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Version texte alternative (optionnel)
}

export interface IMailService {
  /**
   * Envoie un email.
   *
   * @param options - Options d'envoi (destinataire, sujet, contenu)
   * @returns Promise qui se résout si l'email est envoyé avec succès
   * @throws Error si l'envoi échoue
   */
  sendEmail(options: SendEmailOptions): Promise<void>;
}

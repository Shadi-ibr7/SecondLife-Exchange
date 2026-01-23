/**
 * FICHIER: email-verification.service.ts
 *
 * DESCRIPTION:
 * Service pour gérer la vérification d'email des utilisateurs.
 * Génère des tokens sécurisés, les stocke en DB (hashés), et vérifie leur validité.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import { Inject } from '@nestjs/common';
import { IMailService } from '../../mail/interfaces/mail.service.interface';
import { getEmailVerificationTemplate } from '../../mail/templates/email-verification.template';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly frontendUrl: string;
  private readonly tokenExpirationHours = 24;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('IMailService') private mailService: IMailService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Génère un token de vérification et l'envoie par email.
   *
   * @param userId - ID de l'utilisateur
   * @param email - Email de l'utilisateur
   * @param displayName - Nom d'affichage de l'utilisateur
   * @returns Le token en clair (pour tests uniquement, normalement non retourné)
   */
  async generateAndSendVerificationToken(
    userId: string,
    email: string,
    displayName: string,
  ): Promise<string> {
    // Générer un token aléatoire sécurisé (32 bytes = 256 bits)
    const token = randomBytes(32).toString('base64url'); // base64url pour URL-safe

    // Hasher le token avec SHA256 (unidirectionnel, rapide)
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Calculer la date d'expiration (24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.tokenExpirationHours);

    // Invalider tous les anciens tokens non utilisés pour cet utilisateur
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        usedAt: null, // Seulement les non utilisés
      },
      data: {
        usedAt: new Date(), // Les marquer comme utilisés (invalidés)
      },
    });

    // Stocker le token hashé en DB
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Construire l'URL de vérification
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    // Envoyer l'email (non bloquant, log les erreurs)
    try {
      this.logger.log(
        `Tentative d'envoi email vérification à ${email} (URL: ${verificationUrl})`,
      );
      await this.mailService.sendEmail({
        to: email,
        subject: 'Vérifiez votre adresse email - SecondLife Exchange',
        html: getEmailVerificationTemplate(verificationUrl, displayName),
      });
      this.logger.log(`✅ Email de vérification envoyé avec succès à ${email}`);
    } catch (error: any) {
      // Log l'erreur mais ne bloque pas l'inscription
      this.logger.error(
        `❌ Erreur envoi email vérification à ${email}: ${error.message}`,
      );
      this.logger.error(`Stack trace: ${error.stack}`);
      // On continue quand même, l'utilisateur pourra demander un renvoi
      throw error; // Re-throw pour que l'appelant puisse logger aussi
    }

    return token; // Retourné pour tests uniquement
  }

  /**
   * Vérifie un token de vérification d'email.
   *
   * @param token - Token en clair fourni par l'utilisateur
   * @returns true si le token est valide et utilisé avec succès
   * @throws BadRequestException si le token est invalide, expiré ou déjà utilisé
   */
  async verifyToken(token: string): Promise<boolean> {
    // Hasher le token pour le comparer avec celui en DB
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Chercher le token en DB
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token de vérification invalide');
    }

    // Vérifier si déjà utilisé
    if (tokenRecord.usedAt) {
      throw new BadRequestException(
        'Ce lien de vérification a déjà été utilisé',
      );
    }

    // Vérifier l'expiration
    if (new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException(
        'Ce lien de vérification a expiré. Veuillez en demander un nouveau.',
      );
    }

    // Vérifier si l'utilisateur existe toujours
    if (!tokenRecord.user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'email n'est pas déjà vérifié (idempotence)
    if (tokenRecord.user.emailVerifiedAt) {
      // Marquer le token comme utilisé quand même
      await this.prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });
      return true; // Déjà vérifié, mais on considère ça comme un succès
    }

    // Marquer l'email comme vérifié et le token comme utilisé (transaction)
    await this.prisma.$transaction([
      // Mettre à jour l'utilisateur
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      // Marquer le token comme utilisé
      this.prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email vérifié pour user ${tokenRecord.userId}`);
    return true;
  }

  /**
   * Renvoie un email de vérification pour un utilisateur.
   *
   * @param email - Email de l'utilisateur
   * @returns { success: true } ou { alreadyVerified: true }
   * @throws NotFoundException si l'utilisateur n'existe pas (message générique)
   */
  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: true } | { alreadyVerified: true }> {
    // Chercher l'utilisateur (message générique si non trouvé pour éviter l'enumeration)
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Message générique pour ne pas révéler si l'email existe
      this.logger.debug(`Tentative de renvoi pour email inexistant: ${email}`);
      // Retourner success pour éviter l'enumeration
      return { success: true };
    }

    // Si déjà vérifié, retourner alreadyVerified
    if (user.emailVerifiedAt) {
      this.logger.debug(`Email déjà vérifié pour ${email}`);
      return { alreadyVerified: true };
    }

    // Générer et envoyer un nouveau token
    await this.generateAndSendVerificationToken(
      user.id,
      user.email,
      user.displayName,
    );

    return { success: true };
  }
}

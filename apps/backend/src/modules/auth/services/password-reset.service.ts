/**
 * FICHIER: password-reset.service.ts
 *
 * DESCRIPTION:
 * Service pour gérer la réinitialisation de mot de passe des utilisateurs.
 * Génère des tokens sécurisés, les stocke en DB (hashés), et vérifie leur validité.
 *
 * SÉCURITÉ:
 * - Tokens hashés en SHA256 (jamais stockés en clair)
 * - Expiration après 15 minutes
 * - Usage unique (marqué usedAt après utilisation)
 * - Invalidation de tous les tokens précédents à chaque nouvelle demande
 * - Invalidation de toutes les sessions après reset
 * - Messages neutres (pas d'indication si email existe)
 */

import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Inject } from '@nestjs/common';
import { IMailService } from '../../mail/interfaces/mail.service.interface';
import { getPasswordResetTemplate } from '../../mail/templates/password-reset.template';

// Codes d'erreur standardisés
const ERROR_CODES = {
  RESET_TOKEN_INVALID: 'RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED: 'RESET_TOKEN_EXPIRED',
  RESET_TOKEN_USED: 'RESET_TOKEN_USED',
  PASSWORD_VALIDATION_FAILED: 'PASSWORD_VALIDATION_FAILED',
} as const;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly frontendUrl: string;
  private readonly tokenExpirationMinutes = 15;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('IMailService') private mailService: IMailService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Demande de réinitialisation de mot de passe.
   * IMPORTANT: Retourne toujours 200 OK pour ne pas révéler si l'email existe.
   *
   * @param email - Email de l'utilisateur
   * @param requestIp - IP de la requête (audit)
   * @param userAgent - User-Agent de la requête (audit)
   */
  async requestPasswordReset(
    email: string,
    requestIp?: string,
    userAgent?: string,
  ): Promise<{ ok: true }> {
    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim();

    // Chercher l'utilisateur (ne PAS révéler s'il existe)
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Log de l'événement (sans email complet pour GDPR)
    const emailHash = createHash('sha256')
      .update(normalizedEmail)
      .digest('hex')
      .substring(0, 8);
    this.logger.log(
      `PASSWORD_RESET_REQUEST: email_hash=${emailHash}, ip=${requestIp || 'unknown'}`,
    );

    // Si l'utilisateur n'existe pas, retourner silencieusement OK
    if (!user) {
      this.logger.debug(`Password reset requested for non-existent email`);
      return { ok: true };
    }

    // Vérifier que c'est un USER (pas admin) - optionnel mais recommandé
    // Les admins ont un processus séparé
    if (user.roles !== 'USER') {
      this.logger.warn(
        `Password reset attempted for non-USER role: ${user.roles}`,
      );
      // Retourner OK silencieusement pour ne pas révéler le rôle
      return { ok: true };
    }

    try {
      // Invalider tous les anciens tokens non utilisés pour cet utilisateur
      await this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(), // Les marquer comme "invalidés"
        },
      });

      // Générer un token aléatoire sécurisé (32 bytes = 256 bits)
      const token = randomBytes(32).toString('base64url');

      // Hasher le token avec SHA256 (unidirectionnel, rapide)
      const tokenHash = createHash('sha256').update(token).digest('hex');

      // Calculer la date d'expiration (15 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.tokenExpirationMinutes);

      // Stocker le token hashé en DB
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          requestIp,
          userAgent,
        },
      });

      // Construire l'URL de reset
      const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

      // Envoyer l'email
      try {
        await this.mailService.sendEmail({
          to: user.email,
          subject: 'Réinitialisation de votre mot de passe - SecondLife Exchange',
          html: getPasswordResetTemplate(resetUrl, user.displayName),
        });
        this.logger.log(
          `PASSWORD_RESET_EMAIL_SENT: user_id=${user.id}, ip=${requestIp || 'unknown'}`,
        );
      } catch (error: any) {
        // Log l'erreur mais retourner OK quand même (ne pas révéler l'erreur)
        this.logger.error(
          `PASSWORD_RESET_EMAIL_FAILED: user_id=${user.id}, error=${error.message}`,
        );
      }
    } catch (error: any) {
      // Log l'erreur mais retourner OK (ne pas révéler les erreurs internes)
      this.logger.error(
        `PASSWORD_RESET_ERROR: email_hash=${emailHash}, error=${error.message}`,
      );
    }

    return { ok: true };
  }

  /**
   * Réinitialise le mot de passe avec un token valide.
   *
   * @param token - Token en clair fourni par l'utilisateur
   * @param newPassword - Nouveau mot de passe (déjà validé par le DTO)
   * @throws UnprocessableEntityException si le token est invalide, expiré ou utilisé
   */
  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    // Hasher le token pour le comparer avec celui en DB
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Chercher le token en DB
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Token non trouvé
    if (!tokenRecord) {
      this.logger.warn('PASSWORD_RESET_INVALID_TOKEN: token not found');
      throw new UnprocessableEntityException({
        code: ERROR_CODES.RESET_TOKEN_INVALID,
        message: 'Lien de réinitialisation invalide ou expiré',
      });
    }

    // Token déjà utilisé
    if (tokenRecord.usedAt) {
      this.logger.warn(
        `PASSWORD_RESET_TOKEN_ALREADY_USED: user_id=${tokenRecord.userId}`,
      );
      throw new UnprocessableEntityException({
        code: ERROR_CODES.RESET_TOKEN_USED,
        message: 'Ce lien de réinitialisation a déjà été utilisé',
      });
    }

    // Token expiré
    if (new Date() > tokenRecord.expiresAt) {
      this.logger.warn(
        `PASSWORD_RESET_TOKEN_EXPIRED: user_id=${tokenRecord.userId}`,
      );
      throw new UnprocessableEntityException({
        code: ERROR_CODES.RESET_TOKEN_EXPIRED,
        message: 'Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau.',
      });
    }

    // Vérifier que l'utilisateur existe toujours
    if (!tokenRecord.user) {
      this.logger.error(
        `PASSWORD_RESET_USER_NOT_FOUND: user_id=${tokenRecord.userId}`,
      );
      throw new UnprocessableEntityException({
        code: ERROR_CODES.RESET_TOKEN_INVALID,
        message: 'Lien de réinitialisation invalide',
      });
    }

    // Hasher le nouveau mot de passe avec bcrypt
    const saltRounds = this.configService.get<number>('security.bcryptSaltRounds') || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Transaction: mettre à jour le mot de passe + invalider tous les tokens + révoquer les sessions
    await this.prisma.$transaction([
      // 1. Mettre à jour le mot de passe
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),

      // 2. Marquer ce token comme utilisé
      this.prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),

      // 3. Invalider tous les autres tokens de reset pour cet utilisateur
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          id: { not: tokenRecord.id },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),

      // 4. Révoquer tous les refresh tokens (logout everywhere)
      this.prisma.refreshToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.logger.log(
      `PASSWORD_RESET_SUCCESS: user_id=${tokenRecord.userId}`,
    );

    return { ok: true };
  }
}

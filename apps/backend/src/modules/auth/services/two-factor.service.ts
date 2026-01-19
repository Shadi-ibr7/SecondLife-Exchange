/**
 * FICHIER: two-factor.service.ts
 *
 * DESCRIPTION:
 * Service pour gérer l'authentification à deux facteurs (2FA) TOTP pour les admins/moderators.
 *
 * FONCTIONNALITÉS:
 * - Génération de secrets TOTP
 * - Génération de QR codes pour l'activation
 * - Vérification de codes TOTP
 * - Chiffrement/déchiffrement des secrets
 * - Activation/désactivation du 2FA
 *
 * SÉCURITÉ:
 * - Secrets stockés chiffrés avec AES-256-GCM
 * - Utilisation de speakeasy pour TOTP (RFC 6238)
 * - Validation stricte des codes (fenêtre de tolérance)
 */

import { Injectable, UnauthorizedException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { encrypt, decrypt } from '../../../common/utils/encryption.utils';
import { Request } from 'express';
import { AuditService } from '../../admin/services/audit.service';
import { AdminActionType } from '../../admin/enums/admin-action-type.enum';
import { TwoFactorAttemptService } from './two-factor-attempt.service';

/**
 * Réponse du setup 2FA (retourne QR code et secret temporaire pour vérification)
 */
export interface TwoFactorSetupResponse {
  qrCode: string; // QR code en base64 (data URL)
  secret: string; // Secret temporaire (non chiffré) pour affichage à l'utilisateur
  otpAuthUrl: string; // URL otpauth:// pour import manuel
}

/**
 * Réponse de l'activation 2FA (retourne les backup codes)
 */
export interface TwoFactorEnableResponse {
  enabled: boolean;
  backupCodes: string[]; // Backup codes en clair (à afficher une seule fois)
}

/**
 * Réponse de vérification 2FA
 */
export interface TwoFactorVerifyResponse {
  verified: boolean;
  message?: string;
}

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
    private twoFactorAttemptService: TwoFactorAttemptService,
  ) {}

  /**
   * Obtient la clé de chiffrement depuis la config
   */
  private getEncryptionKey(): string {
    const key = this.configService.get<string>('APP_ENCRYPTION_KEY');
    if (!key || key.length < 32) {
      throw new Error(
        'APP_ENCRYPTION_KEY doit être défini et faire au moins 32 caractères. ' +
          'Générer avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
    return key;
  }

  /**
   * Génère des backup codes pour la récupération
   *
   * @param count - Nombre de codes à générer (défaut: 10)
   * @returns Objet avec codes en clair et codes hashés
   */
  private async generateBackupCodes(count: number = 10): Promise<{
    codes: string[];
    hashedCodes: string[];
  }> {
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Générer un code de 8 caractères alphanumériques (format: XXXX-XXXX)
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${part1}-${part2}`;

      codes.push(code);

      // Hasher le code avec bcrypt (on ne peut pas le déchiffrer, seulement vérifier)
      const saltRounds = 10;
      const hashed = await bcrypt.hash(code, saltRounds);
      hashedCodes.push(hashed);
    }

    return { codes, hashedCodes };
  }

  /**
   * Vérifie si un backup code est valide et le consomme
   *
   * @param userId - ID de l'utilisateur
   * @param code - Code backup à vérifier
   * @returns true si le code est valide
   */
  private async verifyAndConsumeBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user || !user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
      return false;
    }

    // Vérifier chaque code hashé
    for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
      const hashedCode = user.twoFactorBackupCodes[i];
      const isValid = await bcrypt.compare(code, hashedCode);

      if (isValid) {
        // Consommer le code en le retirant du tableau
        const updatedCodes = [...user.twoFactorBackupCodes];
        updatedCodes.splice(i, 1);

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorBackupCodes: updatedCodes,
          },
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Génère un secret TOTP et un QR code pour l'activation
   *
   * @param userId - ID de l'utilisateur
   * @returns QR code en base64, secret temporaire, et URL otpauth
   */
  async setup(userId: string): Promise<TwoFactorSetupResponse> {
    // Vérifier que l'utilisateur existe et est ADMIN ou MODERATOR
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (user.roles !== UserRole.ADMIN && user.roles !== UserRole.MODERATOR) {
      throw new UnauthorizedException(
        'Le 2FA est uniquement disponible pour les administrateurs et modérateurs',
      );
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'Le 2FA est déjà activé. Désactivez-le d\'abord si vous souhaitez le réinitialiser.',
      );
    }

    // Générer un secret TOTP
    const secret = speakeasy.generateSecret({
      name: `SecondLife Exchange (${user.email})`,
      issuer: 'SecondLife Exchange',
      length: 32, // Secret de 32 caractères (256 bits)
    });

    // Créer l'URL otpauth:// pour le QR code
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'SecondLife Exchange',
      encoding: 'base32',
    });

    // Générer le QR code en base64
    let qrCodeDataUrl: string;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la génération du QR code: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }

    return {
      qrCode: qrCodeDataUrl,
      secret: secret.base32!, // Secret temporaire pour affichage
      otpAuthUrl,
    };
  }

  /**
   * Active le 2FA après vérification d'un code TOTP
   *
   * @param userId - ID de l'utilisateur
   * @param code - Code TOTP à vérifier
   * @param secret - Secret temporaire du setup (base32)
   * @param req - Requête HTTP optionnelle (pour audit)
   * @returns Backup codes en clair (à afficher une seule fois)
   */
  async enable(
    userId: string,
    code: string,
    secret: string,
    req?: Request,
  ): Promise<TwoFactorEnableResponse> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        roles: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (user.roles !== UserRole.ADMIN && user.roles !== UserRole.MODERATOR) {
      throw new UnauthorizedException(
        'Le 2FA est uniquement disponible pour les administrateurs et modérateurs',
      );
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Le 2FA est déjà activé');
    }

    // Vérifier le code TOTP
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2, // Accepter codes dans une fenêtre de ±2 périodes (60s chacune)
    });

    if (!verified) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    // Chiffrer le secret
    const encryptionKey = this.getEncryptionKey();
    const encryptedSecret = encrypt(secret, encryptionKey);

    // Générer les backup codes
    const { codes: backupCodes, hashedCodes } = await this.generateBackupCodes(10);

    // Activer le 2FA en base avec les backup codes hashés
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorVerifiedAt: new Date(),
        twoFactorBackupCodes: hashedCodes,
      },
    });

    // Logger ENABLE_2FA
    await this.auditService.log({
      actionType: AdminActionType.ENABLE_2FA,
      actorId: userId,
      targetType: 'User',
      targetId: userId,
      metadata: { email: user.email },
      request: req,
    });

    return { enabled: true, backupCodes };
  }

  /**
   * Vérifie un code TOTP pour la connexion (après login email+password)
   *
   * @param userId - ID de l'utilisateur
   * @param code - Code TOTP à vérifier
   * @param ip - Adresse IP de la requête (pour lockout)
   * @param userAgent - User-Agent de la requête (optionnel, pour audit)
   * @param req - Requête HTTP optionnelle (pour audit)
   * @returns true si le code est valide
   */
  async verify(
    userId: string,
    code: string,
    ip?: string,
    userAgent?: string,
    req?: Request,
  ): Promise<TwoFactorVerifyResponse> {
    // Vérifier le lockout avant toute autre vérification
    if (ip) {
      await this.twoFactorAttemptService.checkAndThrowIfBlocked(userId, ip);
    }

    // Récupérer l'utilisateur avec son secret chiffré
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        roles: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Le 2FA n\'est pas activé pour ce compte');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'Secret 2FA introuvable. Veuillez réinitialiser le 2FA.',
      );
    }

    if (user.roles !== UserRole.ADMIN && user.roles !== UserRole.MODERATOR) {
      throw new UnauthorizedException(
        'Le 2FA est uniquement disponible pour les administrateurs et modérateurs',
      );
    }

    // Déchiffrer le secret
    let decryptedSecret: string;
    try {
      const encryptionKey = this.getEncryptionKey();
      decryptedSecret = decrypt(user.twoFactorSecret, encryptionKey);
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors du déchiffrement du secret 2FA: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }

    // Vérifier le code TOTP ou backup code
    let verified = false;
    let usedBackupCode = false;

    // Essayer d'abord avec le code TOTP
    verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Accepter codes dans une fenêtre de ±2 périodes
    });

    // Si le code TOTP n'est pas valide, essayer avec un backup code
    if (!verified) {
      // Normaliser le code (enlever les espaces et convertir en majuscules)
      const normalizedCode = code.replace(/\s+/g, '').toUpperCase();
      verified = await this.verifyAndConsumeBackupCode(userId, normalizedCode);
      usedBackupCode = verified;
    }

    if (!verified) {
      // Enregistrer l'échec et vérifier si bloqué
      if (ip) {
        const failureResult = await this.twoFactorAttemptService.recordFailure(
          userId,
          ip,
          userAgent,
        );

        // Logger l'échec de vérification 2FA
        await this.auditService.log({
          actionType: AdminActionType.ADMIN_LOGIN_FAIL,
          actorId: userId,
          targetType: 'Auth',
          metadata: {
            email: user.email,
            reason: 'invalid_2fa_code',
            isBlocked: failureResult.isBlocked,
            attempts: failureResult.attempts,
          },
          request: req,
        }).catch(() => {
          // Ignorer les erreurs d'audit (non-bloquant)
        });

        // Si bloqué après cet échec, l'exception sera lancée par checkAndThrowIfBlocked au prochain appel
      }

      throw new UnauthorizedException('Code TOTP ou backup code invalide');
    }

    // Si un backup code a été utilisé, logger l'événement
    if (usedBackupCode) {
      await this.auditService.log({
        actionType: AdminActionType.ADMIN_LOGIN_SUCCESS,
        actorId: userId,
        targetType: 'Auth',
        metadata: {
          email: user.email,
          twoFactorEnabled: true,
          usedBackupCode: true,
        },
        request: req,
      }).catch(() => {
        // Ignorer les erreurs d'audit (non-bloquant)
      });
    }

    // Code valide : réinitialiser les tentatives
    if (ip) {
      await this.twoFactorAttemptService.recordSuccess(userId, ip);
    }

    return { verified: true, message: 'Code TOTP valide' };
  }

  /**
   * Désactive le 2FA pour un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @param req - Requête HTTP optionnelle (pour audit trail)
   * @returns true si désactivé avec succès
   */
  async disable(userId: string, req?: Request): Promise<{ disabled: boolean }> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        roles: true,
        twoFactorEnabled: true,
      },
    });

    // Désactiver le 2FA en base (supprimer le secret et les backup codes)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
        twoFactorBackupCodes: [],
      },
    });

    // Logger DISABLE_2FA
    await this.auditService.log({
      actionType: AdminActionType.DISABLE_2FA,
      actorId: userId,
      targetType: 'User',
      targetId: userId,
      metadata: { email: user.email },
      request: req,
    });

    return { disabled: true };
  }

  /**
   * Vérifie si le 2FA est activé pour un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @returns true si le 2FA est activé
   */
  async isEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
      },
    });

    return user?.twoFactorEnabled ?? false;
  }

  /**
   * Régénère les backup codes pour un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @param req - Requête HTTP optionnelle (pour audit)
   * @returns Backup codes en clair (à afficher une seule fois)
   */
  async regenerateBackupCodes(
    userId: string,
    req?: Request,
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        roles: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (user.roles !== UserRole.ADMIN && user.roles !== UserRole.MODERATOR) {
      throw new UnauthorizedException(
        'Le 2FA est uniquement disponible pour les administrateurs et modérateurs',
      );
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Le 2FA n\'est pas activé pour ce compte');
    }

    // Générer de nouveaux backup codes
    const { codes: backupCodes, hashedCodes } = await this.generateBackupCodes(10);

    // Mettre à jour les backup codes en base
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: hashedCodes,
      },
    });

    // Logger la régénération (on pourrait ajouter un type d'action spécifique)
    await this.auditService.log({
      actionType: AdminActionType.ENABLE_2FA, // Réutiliser ENABLE_2FA avec metadata
      actorId: userId,
      targetType: 'User',
      targetId: userId,
      metadata: { email: user.email, action: 'regenerate_backup_codes' },
      request: req,
    }).catch(() => {
      // Ignorer les erreurs d'audit (non-bloquant)
    });

    return { backupCodes };
  }
}

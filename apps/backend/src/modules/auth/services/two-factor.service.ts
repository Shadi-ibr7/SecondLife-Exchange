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
import { encrypt, decrypt } from '../../../common/utils/encryption.utils';
import { Request } from 'express';
import { AuditService } from '../../admin/services/audit.service';
import { AdminActionType } from '../../admin/enums/admin-action-type.enum';

/**
 * Réponse du setup 2FA (retourne QR code et secret temporaire pour vérification)
 */
export interface TwoFactorSetupResponse {
  qrCode: string; // QR code en base64 (data URL)
  secret: string; // Secret temporaire (non chiffré) pour affichage à l'utilisateur
  otpAuthUrl: string; // URL otpauth:// pour import manuel
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
   * @returns true si activé avec succès
   */
  async enable(
    userId: string,
    code: string,
    secret: string,
    req?: Request,
  ): Promise<{ enabled: boolean }> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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

    // Activer le 2FA en base
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorVerifiedAt: new Date(),
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

    return { enabled: true };
  }

  /**
   * Vérifie un code TOTP pour la connexion (après login email+password)
   *
   * @param userId - ID de l'utilisateur
   * @param code - Code TOTP à vérifier
   * @returns true si le code est valide
   */
  async verify(userId: string, code: string): Promise<TwoFactorVerifyResponse> {
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

    // Vérifier le code TOTP
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Accepter codes dans une fenêtre de ±2 périodes
    });

    if (!verified) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    return { verified: true, message: 'Code TOTP valide' };
  }

  /**
   * Désactive le 2FA pour un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @returns true si désactivé avec succès
   */
  async disable(userId: string): Promise<{ disabled: boolean }> {
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

    // Désactiver le 2FA en base (supprimer le secret)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
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
}

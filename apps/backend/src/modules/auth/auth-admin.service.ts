/**
 * FICHIER: auth-admin.service.ts
 *
 * DESCRIPTION:
 * Service d'authentification séparé pour les admins avec gestion sécurisée des sessions.
 *
 * FONCTIONNALITÉS:
 * - Login admin avec génération access + refresh tokens
 * - Refresh token rotation avec détection de replay attacks
 * - Logout avec révocation de tokens
 * - Vérification de session (/me)
 *
 * SÉCURITÉ:
 * - Refresh tokens hashés avec bcrypt avant stockage
 * - Token family pour détecter les replay attacks
 * - Cookies httpOnly pour empêcher accès JavaScript (XSS)
 */

import { Injectable, UnauthorizedException, Inject, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { Response, Request } from 'express';
import {
  setAuthCookies,
  clearAuthCookies,
  COOKIE_MAX_AGE,
} from '../../common/utils/cookie.utils';
import { LoginAttemptService } from './services/login-attempt.service';
import { TwoFactorService } from './services/two-factor.service';
import { AuditService } from '../admin/services/audit.service';
import { AdminActionType } from '../admin/enums/admin-action-type.enum';

/**
 * Réponse du login admin (sans les tokens - ils sont dans les cookies)
 */
export interface AdminLoginResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: UserRole;
    avatarUrl: string | null;
  };
  // Tokens inclus uniquement pour rétrocompatibilité (transition)
  accessToken?: string;
  refreshToken?: string;
  // 2FA: si activé, retourne '2FA_REQUIRED' au lieu des tokens
  requiresTwoFactor?: boolean;
  message?: string;
}

/**
 * Payload du JWT admin
 */
interface AdminJwtPayload {
  sub: string;
  email: string;
  roles: UserRole;
  type?: 'access' | 'refresh';
}

@Injectable()
export class AuthAdminService {
  private readonly logger = new Logger(AuthAdminService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginAttemptService: LoginAttemptService,
    private twoFactorService: TwoFactorService,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
  ) {}

  /**
   * Génère un identifiant unique pour une famille de tokens
   * Tous les tokens d'une même session partagent ce familyId
   */
  private generateFamilyId(): string {
    return crypto.randomUUID();
  }

  /**
   * Génère et stocke un refresh token pour un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @param familyId - ID de famille pour regrouper les tokens d'une session
   * @returns Le refresh token généré (non hashé)
   */
  private async createRefreshToken(
    userId: string,
    familyId: string,
  ): Promise<string> {
    // Générer le JWT refresh token
    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        type: 'refresh',
        familyId,
      },
      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('security.jwtRefreshSecret'),
        expiresIn: '7d',
      },
    );

    // Hasher le token avant stockage (protection si DB compromise)
    const saltRounds = 10;
    const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

    // Stocker en base
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + COOKIE_MAX_AGE.REFRESH_TOKEN),
      },
    });

    return refreshToken;
  }

  /**
   * Connexion admin avec génération de tokens et cookies
   *
   * SÉCURITÉ:
   * - Vérification anti-bruteforce avant toute opération
   * - Enregistrement des tentatives (succès/échec)
   * - Messages d'erreur génériques pour éviter l'enumeration
   *
   * @param loginDto - Email et mot de passe
   * @param res - Objet Response Express (optionnel, pour set cookies)
   * @param ip - Adresse IP de la requête
   * @param userAgent - User-Agent de la requête (optionnel)
   * @returns Informations utilisateur (tokens dans cookies si res fourni)
   */
  async login(
    loginDto: AdminLoginDto,
    res?: Response,
    ip?: string,
    userAgent?: string,
    req?: Request,
  ): Promise<AdminLoginResponse> {
    // ============================================
    // VÉRIFICATION ANTI-BRUTEFORCE
    // ============================================
    if (ip) {
      await this.loginAttemptService.checkAndThrowIfBlocked(
        loginDto.email,
        ip,
      );
    }

    // Rechercher l'utilisateur (avec champs 2FA)
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        avatarUrl: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
    });

    // Vérifier que l'utilisateur existe et est admin
    if (!user || user.roles !== UserRole.ADMIN) {
      if (ip) {
        const failureResult = await this.loginAttemptService.recordFailure(
          loginDto.email,
          ip,
          userAgent,
        );
        // Logger ADMIN_LOGIN_FAIL seulement si on a trouvé l'utilisateur (pour avoir un adminId valide)
        // Si user n'existe pas, on ne peut pas logger car adminId est obligatoire
        if (user?.id) {
          await this.auditService.log({
            actionType: AdminActionType.ADMIN_LOGIN_FAIL,
            actorId: user.id,
            targetType: 'Auth',
            metadata: { email: loginDto.email, reason: 'user_not_admin', isBlocked: failureResult.isBlocked },
            request: req,
          });
        }
      }
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      if (ip) {
        const failureResult = await this.loginAttemptService.recordFailure(
          loginDto.email,
          ip,
          userAgent,
        );
        // Logger ADMIN_LOGIN_FAIL (on a user.id car on a trouvé l'utilisateur)
        await this.auditService.log({
          actionType: AdminActionType.ADMIN_LOGIN_FAIL,
          actorId: user.id,
          targetType: 'Auth',
          metadata: { email: loginDto.email, reason: 'invalid_password', isBlocked: failureResult.isBlocked },
          request: req,
        });
      }
      throw new UnauthorizedException('Identifiants invalides');
    }

    // ============================================
    // VÉRIFICATION 2FA
    // ============================================
    // Si le 2FA est activé, on ne crée pas de session complète
    // On retourne "2FA_REQUIRED" et l'utilisateur devra fournir le code TOTP
    if (user.twoFactorEnabled) {
      // Ne pas enregistrer comme succès (on attend la vérification 2FA)
      // Mais ne pas non plus enregistrer comme échec (mot de passe valide)

      // Réponse indiquant que le 2FA est requis
      const response: AdminLoginResponse = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          roles: user.roles,
          avatarUrl: user.avatarUrl,
        },
        requiresTwoFactor: true,
        message: '2FA_REQUIRED',
      };

      return response;
    }

    // ============================================
    // GÉNÉRATION DES TOKENS (2FA désactivé ou pas encore activé)
    // ============================================

    // Générer l'access token (court: 15 min)
    const payload: AdminJwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('ADMIN_JWT_SECRET') ||
        this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m', // Réduit de 24h à 15m pour la sécurité
    });

    // Générer le refresh token (long: 7 jours) avec nouvelle famille
    const familyId = this.generateFamilyId();
    const refreshToken = await this.createRefreshToken(user.id, familyId);

    // IMPORTANT: Définir les cookies TOUJOURS si Response fournie
    // L'access token doit être TOUJOURS posé en cookie en production
    if (res) {
      setAuthCookies(res, accessToken, refreshToken);
      // LOG TEMPORAIRE pour tracer la pose des cookies
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.log(`[ADMIN LOGIN → access cookie set: YES] accessToken généré et cookie posé`);
        console.log(`[ADMIN LOGIN → refresh cookie set: YES] refreshToken généré et cookie posé`);
      }
    } else {
      // LOG TEMPORAIRE: avertir si Response n'est pas fournie
      console.warn(`[ADMIN LOGIN → access cookie set: NO] Response non fournie, cookies non posés`);
    }

    // ============================================
    // ENREGISTREMENT DU SUCCÈS
    // ============================================
    if (ip) {
      await this.loginAttemptService.recordSuccess(loginDto.email, ip);
    }

    // Logger ADMIN_LOGIN_SUCCESS
    await this.auditService.log({
      actionType: AdminActionType.ADMIN_LOGIN_SUCCESS,
      actorId: user.id,
      targetType: 'Auth',
      metadata: { email: user.email, twoFactorEnabled: user.twoFactorEnabled },
      request: req,
    });

    // Réponse avec infos utilisateur
    const response: AdminLoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles,
        avatarUrl: user.avatarUrl,
      },
    };

    // Inclure tokens dans la réponse pour rétrocompatibilité (période de transition)
    // TODO: Supprimer après migration complète du frontend
    if (!res) {
      response.accessToken = accessToken;
      response.refreshToken = refreshToken;
    }

    return response;
  }

  /**
   * Log ADMIN_LOGIN_LOCKED - appelé depuis le contrôleur quand le compte est bloqué
   */
  async logLoginLocked(email: string, req?: Request): Promise<void> {
    try {
      // Chercher l'utilisateur par email pour obtenir son ID
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true },
      });

      // Logger avec l'ID utilisateur si trouvé, sinon utiliser 'system'
      await this.auditService.log({
        actionType: AdminActionType.ADMIN_LOGIN_LOCKED,
        actorId: user?.id || 'system',
        targetType: 'Auth',
        metadata: { email, reason: 'account_locked_bruteforce' },
        request: req,
      });
    } catch (error: any) {
      // Ignorer les erreurs d'audit (non-bloquant)
      // L'erreur est déjà loggée par AuditService
    }
  }

  /**
   * Rafraîchit les tokens en effectuant une rotation sécurisée
   *
   * SÉCURITÉ - Rotation des tokens:
   * 1. Vérifie que le refresh token est valide et non révoqué
   * 2. Génère un nouveau refresh token dans la même famille
   * 3. Révoque l'ancien refresh token
   * 4. Si un token déjà révoqué est présenté → replay attack détecté
   *    → Révoque TOUS les tokens de la famille
   *
   * @param refreshToken - Le refresh token actuel
   * @param res - Objet Response Express (optionnel, pour set cookies)
   * @returns Nouveaux tokens
   */
  async refresh(
    refreshToken: string,
    res?: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Décoder le token pour obtenir le familyId
    let decoded: { sub: string; familyId?: string };
    try {
      decoded = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('security.jwtRefreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Rechercher tous les tokens de cet utilisateur qui matchent ce token
    const allUserTokens = await this.prisma.refreshToken.findMany({
      where: { userId: decoded.sub },
      include: { user: true },
    });

    // Trouver le token correspondant en comparant les hash
    let matchedToken: (typeof allUserTokens)[0] | null = null;
    for (const tokenRecord of allUserTokens) {
      const isMatch = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
      if (isMatch) {
        matchedToken = tokenRecord;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // ============================================
    // DÉTECTION DE REPLAY ATTACK
    // ============================================
    // Si le token a déjà été révoqué, vérifier si c'est un vrai replay attack
    // ou juste une requête concurrente (fenêtre de grâce de 5 secondes)
    if (matchedToken.revokedAt) {
      const revokedSince = Date.now() - matchedToken.revokedAt.getTime();
      const GRACE_PERIOD_MS = 5000; // 5 secondes de grâce pour les requêtes concurrentes

      // Si le token a été révoqué il y a plus de 5 secondes, c'est probablement un vrai replay attack
      if (revokedSince > GRACE_PERIOD_MS) {
        // Log uniquement si c'est probablement un vrai replay attack (pas une requête concurrente)
        this.logger.warn(
          `[SECURITY] Replay attack détecté! Token réutilisé pour user ${decoded.sub}, family ${matchedToken.familyId || 'null'} (révoqué il y a ${Math.round(revokedSince / 1000)}s)`,
        );

        // Révoquer tous les tokens de la famille
        if (matchedToken.familyId) {
          await this.prisma.refreshToken.updateMany({
            where: { familyId: matchedToken.familyId },
            data: { revokedAt: new Date() },
          });
        }

        throw new UnauthorizedException(
          'Session invalide. Veuillez vous reconnecter.',
        );
      } else {
        // Token révoqué récemment (< 5s) = probablement une requête concurrente
        // On retourne simplement une erreur sans log de sécurité (pour éviter le bruit)
        throw new UnauthorizedException(
          'Token déjà utilisé. Veuillez réessayer.',
        );
      }
    }

    // Vérifier l'expiration
    if (matchedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    // Vérifier que l'utilisateur est toujours admin
    if (matchedToken.user.roles !== UserRole.ADMIN) {
      throw new UnauthorizedException('Accès admin révoqué');
    }

    // ============================================
    // ROTATION DES TOKENS
    // ============================================

    // Générer le nouvel access token
    const newAccessToken = this.jwtService.sign(
      {
        sub: matchedToken.user.id,
        email: matchedToken.user.email,
        roles: matchedToken.user.roles,
        type: 'access',
      },
      {
        secret:
          this.configService.get<string>('ADMIN_JWT_SECRET') ||
          this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    // Générer le nouveau refresh token (même famille)
    const familyId = matchedToken.familyId || this.generateFamilyId();
    const newRefreshToken = await this.createRefreshToken(
      matchedToken.user.id,
      familyId,
    );

    // Révoquer l'ancien refresh token
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    // Définir les nouveaux cookies si Response fournie
    if (res) {
      setAuthCookies(res, newAccessToken, newRefreshToken);
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Déconnexion admin - révoque le refresh token
   *
   * @param refreshToken - Le refresh token à révoquer
   * @param res - Objet Response Express (optionnel, pour clear cookies)
   * @param req - Objet Request Express (pour audit trail)
   */
  async logout(refreshToken: string, res?: Response, req?: Request): Promise<void> {
    let userId: string | null = null;

    if (refreshToken) {
      // Trouver et révoquer le token
      const allTokens = await this.prisma.refreshToken.findMany({
        where: { revokedAt: null },
        include: { user: { select: { id: true } } },
      });

      for (const tokenRecord of allTokens) {
        const isMatch = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
        if (isMatch) {
          userId = tokenRecord.userId;
          // Révoquer ce token
          await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    }

    // Supprimer les cookies si Response fournie
    if (res) {
      clearAuthCookies(res);
    }

    // Logger la déconnexion si on a trouvé l'userId
    if (userId) {
      await this.auditService.log({
        actionType: AdminActionType.ADMIN_LOGOUT,
        actorId: userId,
        targetType: 'Auth',
        metadata: {},
        request: req,
      }).catch(() => {
        // Ignorer les erreurs d'audit (non-bloquant)
      });
    }
  }

  /**
   * Révoque tous les tokens d'un utilisateur (force déconnexion partout)
   *
   * @param userId - ID de l'utilisateur
   */
  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Vérifie le code 2FA et crée la session complète (access + refresh tokens)
   *
   * Utilisé après un login email+password réussi lorsque le 2FA est activé.
   * Si le code TOTP est valide, génère les tokens et les met dans les cookies.
   *
   * @param userId - ID de l'utilisateur (doit avoir passé email+password)
   * @param code - Code TOTP à 6 chiffres
   * @param res - Objet Response Express (optionnel, pour set cookies)
   * @param ip - Adresse IP de la requête (pour lockout)
   * @param userAgent - User-Agent de la requête (optionnel, pour audit)
   * @param req - Requête HTTP optionnelle (pour audit)
   * @returns Informations utilisateur et tokens (dans cookies si res fourni)
   */
  async verifyTwoFactorAndCreateSession(
    userId: string,
    code: string,
    res?: Response,
    ip?: string,
    userAgent?: string,
    req?: Request,
  ): Promise<AdminLoginResponse> {
    // Vérifier que l'utilisateur existe et est admin/moderator
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        avatarUrl: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (user.roles !== UserRole.ADMIN && user.roles !== UserRole.MODERATOR) {
      throw new UnauthorizedException(
        'Le 2FA est uniquement disponible pour les administrateurs et modérateurs',
      );
    }

    if (!user.twoFactorEnabled) {
      throw new UnauthorizedException(
        'Le 2FA n\'est pas activé pour ce compte. Utilisez /auth/admin/login directement.',
      );
    }

    // Vérifier le code TOTP (avec tracking des échecs et lockout)
    await this.twoFactorService.verify(userId, code, ip, userAgent, req);

    // ============================================
    // GÉNÉRATION DES TOKENS (code 2FA valide)
    // ============================================

    // Générer l'access token (court: 15 min)
    const payload: AdminJwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('ADMIN_JWT_SECRET') ||
        this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    // Générer le refresh token (long: 7 jours) avec nouvelle famille
    const familyId = this.generateFamilyId();
    const refreshToken = await this.createRefreshToken(user.id, familyId);

    // IMPORTANT: Définir les cookies TOUJOURS si Response fournie
    // L'access token doit être TOUJOURS posé en cookie en production
    if (res) {
      setAuthCookies(res, accessToken, refreshToken);
      // LOG TEMPORAIRE pour tracer la pose des cookies
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.log(`[ADMIN LOGIN → access cookie set: YES] accessToken généré et cookie posé`);
        console.log(`[ADMIN LOGIN → refresh cookie set: YES] refreshToken généré et cookie posé`);
      }
    } else {
      // LOG TEMPORAIRE: avertir si Response n'est pas fournie
      console.warn(`[ADMIN LOGIN → access cookie set: NO] Response non fournie, cookies non posés`);
    }

    // ============================================
    // ENREGISTREMENT DU SUCCÈS (2FA vérifié)
    // ============================================
    // Logger ADMIN_LOGIN_SUCCESS après vérification 2FA réussie
    await this.auditService.log({
      actionType: AdminActionType.ADMIN_LOGIN_SUCCESS,
      actorId: user.id,
      targetType: 'Auth',
      metadata: { email: user.email, twoFactorEnabled: true, twoFactorVerified: true },
      request: req,
    }).catch(() => {
      // Ignorer les erreurs d'audit (non-bloquant)
    });

    // Réponse avec infos utilisateur
    const response: AdminLoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles,
        avatarUrl: user.avatarUrl,
      },
    };

    // Inclure tokens dans la réponse pour rétrocompatibilité
    if (!res) {
      response.accessToken = accessToken;
      response.refreshToken = refreshToken;
    }

    return response;
  }

  /**
   * Retourne les informations de l'admin connecté
   *
   * @param userId - ID de l'utilisateur (extrait du JWT)
   * @returns Informations de l'admin
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        avatarUrl: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || user.roles !== UserRole.ADMIN) {
      throw new UnauthorizedException('Accès admin refusé');
    }

    return user;
  }
}

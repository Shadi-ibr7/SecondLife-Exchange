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

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { Response } from 'express';
import {
  setAuthCookies,
  clearAuthCookies,
  COOKIE_MAX_AGE,
} from '../../common/utils/cookie.utils';

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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
   * @param loginDto - Email et mot de passe
   * @param res - Objet Response Express (optionnel, pour set cookies)
   * @returns Informations utilisateur (tokens dans cookies si res fourni)
   */
  async login(
    loginDto: AdminLoginDto,
    res?: Response,
  ): Promise<AdminLoginResponse> {
    // Rechercher l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    // Vérifier que l'utilisateur existe et est admin
    if (!user || user.roles !== UserRole.ADMIN) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

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

    // Définir les cookies si Response fournie
    if (res) {
      setAuthCookies(res, accessToken, refreshToken);
    }

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
    // Si le token a déjà été révoqué, c'est une tentative de réutilisation
    // → Un attaquant a probablement volé un ancien token
    // → Révoquer TOUS les tokens de la famille pour forcer une reconnexion
    if (matchedToken.revokedAt) {
      console.warn(
        `[SECURITY] Replay attack détecté! Token réutilisé pour user ${decoded.sub}, family ${matchedToken.familyId}`,
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
   */
  async logout(refreshToken: string, res?: Response): Promise<void> {
    if (refreshToken) {
      // Trouver et révoquer le token
      const allTokens = await this.prisma.refreshToken.findMany({
        where: { revokedAt: null },
      });

      for (const tokenRecord of allTokens) {
        const isMatch = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
        if (isMatch) {
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
      },
    });

    if (!user || user.roles !== UserRole.ADMIN) {
      throw new UnauthorizedException('Accès admin refusé');
    }

    return user;
  }
}

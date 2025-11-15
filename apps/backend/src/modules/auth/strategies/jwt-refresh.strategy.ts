/**
 * FICHIER: jwt-refresh.strategy.ts
 *
 * DESCRIPTION:
 * Cette stratégie Passport valide les refresh tokens JWT.
 * Elle est utilisée par JwtRefreshGuard pour protéger la route de rafraîchissement.
 *
 * DIFFÉRENCE AVEC JwtAccessStrategy:
 * - Extrait le token depuis le body (pas le header)
 * - Utilise un secret différent (jwtRefreshSecret)
 * - Vérifie que le token existe dans la base de données
 * - Vérifie que le token n'est pas révoqué ou expiré
 *
 * FONCTIONNEMENT:
 * 1. Extrait le refresh token depuis le body de la requête
 * 2. Vérifie la signature avec le secret de refresh
 * 3. Vérifie que le token existe dans la base de données
 * 4. Vérifie que le token n'est pas révoqué ou expiré
 * 5. Vérifie que le hash correspond
 * 6. Retourne l'utilisateur et le token record
 */

// Import des classes et exceptions NestJS
import { Injectable, UnauthorizedException } from '@nestjs/common';

// Import de Passport
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Import des services
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Import de bcrypt pour vérifier le hash
import * as bcrypt from 'bcrypt';

/**
 * INTERFACE: JwtRefreshPayload
 *
 * Définit la structure du payload d'un refresh token JWT.
 *
 * PROPRIÉTÉS:
 * - sub: Subject (ID de l'utilisateur)
 * - tokenHash: Hash du token (pour vérification dans la DB)
 * - iat: Issued At (timestamp de création)
 * - exp: Expiration (timestamp d'expiration)
 */
export interface JwtRefreshPayload {
  sub: string; // userId (Subject)
  tokenHash: string; // Hash du token pour vérification
  iat: number; // Issued At
  exp: number; // Expiration
}

/**
 * STRATÉGIE: JwtRefreshStrategy
 *
 * Cette stratégie valide les refresh tokens JWT.
 * Le nom 'jwt-refresh' est utilisé par JwtRefreshGuard.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh', // Nom de la stratégie
) {
  /**
   * CONSTRUCTEUR
   *
   * Configure la stratégie pour les refresh tokens
   */
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extraire le token depuis le body de la requête
      // Format attendu: { "refreshToken": "<token>" }
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),

      // Vérifier l'expiration
      ignoreExpiration: false,

      // Secret pour les refresh tokens (différent du secret des access tokens)
      secretOrKey: configService.get<string>('security.jwtRefreshSecret'),
    });
  }

  // ============================================
  // MÉTHODE: validate
  // ============================================

  /**
   * Valide le refresh token après vérification de la signature.
   *
   * Vérifie:
   * 1. Que le token existe dans la base de données
   * 2. Qu'il n'est pas révoqué
   * 3. Qu'il n'est pas expiré
   * 4. Que le hash correspond
   *
   * @param payload - Le payload du refresh token
   * @returns Informations de l'utilisateur et du token
   * @throws UnauthorizedException si le token est invalide
   */
  async validate(payload: JwtRefreshPayload) {
    // Chercher le refresh token dans la base de données
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: payload.tokenHash }, // Chercher par hash
      include: { user: true }, // Inclure les informations de l'utilisateur
    });

    // Vérifier que le token existe, n'est pas révoqué, et n'est pas expiré
    if (
      !refreshToken || // Token n'existe pas dans la DB
      refreshToken.revokedAt || // Token a été révoqué (logout)
      refreshToken.expiresAt < new Date() // Token a expiré
    ) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // ============================================
    // VÉRIFICATION DU HASH (SÉCURITÉ)
    // ============================================
    /**
     * Vérifier que le hash dans le payload correspond au hash stocké.
     * Cela protège contre les tokens modifiés.
     */
    const isValid = await bcrypt.compare(
      payload.tokenHash,
      refreshToken.tokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Retourner les informations nécessaires pour le service
    return {
      userId: payload.sub, // ID de l'utilisateur
      refreshToken, // Record du token (pour révocation)
      user: refreshToken.user, // Informations de l'utilisateur
    };
  }
}

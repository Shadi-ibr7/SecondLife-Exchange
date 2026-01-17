/**
 * FICHIER: jwt-refresh.strategy.ts
 *
 * DESCRIPTION:
 * Cette stratégie Passport valide les refresh tokens JWT.
 * Elle supporte l'extraction depuis les cookies httpOnly ou le body (rétrocompat).
 *
 * SÉCURITÉ:
 * - Extraction prioritaire depuis cookie httpOnly (protection XSS)
 * - Fallback body pour rétrocompatibilité
 * - Vérifie que le token n'est pas révoqué
 * - Vérifie l'expiration
 *
 * NOTE: La validation complète avec comparaison de hash est faite dans le service,
 * car la stratégie n'a accès qu'au payload décodé, pas au token brut pour les cookies.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AUTH_COOKIES } from '../../../common/utils/cookie.utils';

/**
 * Payload du refresh token JWT
 */
export interface JwtRefreshPayload {
  sub: string; // userId
  type: 'refresh';
  familyId?: string; // ID de famille pour grouper les tokens
  iat: number; // Issued At
  exp: number; // Expiration
}

/**
 * Extrait le refresh token depuis les cookies ou le body
 * Priorité: cookie > body
 */
const extractRefreshToken = (req: Request): string | null => {
  // 1. Essayer d'extraire depuis le cookie httpOnly
  if (req.cookies && req.cookies[AUTH_COOKIES.REFRESH_TOKEN]) {
    return req.cookies[AUTH_COOKIES.REFRESH_TOKEN];
  }

  // 2. Fallback: extraire depuis le body (rétrocompatibilité)
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Utiliser notre extracteur personnalisé (cookie + body)
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        configService.get<string>('security.jwtRefreshSecret'),
      // Passer la requête au callback validate pour accéder au token brut
      passReqToCallback: true,
    });
  }

  /**
   * Valide le refresh token après vérification de la signature.
   *
   * NOTE: Cette méthode fait une validation basique.
   * La validation complète (comparaison de hash, détection replay) est dans le service
   * car nous avons besoin du token brut pour comparer avec le hash en base.
   *
   * @param req - La requête Express
   * @param payload - Le payload décodé du JWT
   * @returns Informations pour le controller
   */
  async validate(req: Request, payload: JwtRefreshPayload) {
    // Vérifier que c'est bien un refresh token
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token invalide: type incorrect');
    }

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Extraire le token brut pour le passer au service
    const rawToken = extractRefreshToken(req);

    // Retourner les informations nécessaires
    // Le service fera la validation complète avec le hash
    return {
      userId: payload.sub,
      user,
      rawToken, // Token brut pour comparaison de hash dans le service
      familyId: payload.familyId,
    };
  }
}

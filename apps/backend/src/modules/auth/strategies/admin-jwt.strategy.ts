/**
 * FICHIER: admin-jwt.strategy.ts
 *
 * DESCRIPTION:
 * Stratégie JWT séparée pour les admins avec support cookies httpOnly.
 *
 * EXTRACTION DU TOKEN:
 * 1. Cookie httpOnly (prioritaire, plus sécurisé)
 * 2. Header Authorization: Bearer <token> (fallback pour API directe)
 *
 * SÉCURITÉ:
 * - Secret JWT différent pour les admins (ADMIN_JWT_SECRET)
 * - Vérifie que l'utilisateur a toujours le rôle ADMIN
 * - Cookies httpOnly empêchent accès JavaScript (XSS protection)
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { AUTH_COOKIES } from '../../../common/utils/cookie.utils';

/**
 * Extrait le JWT depuis les cookies ou le header Authorization
 * Priorité: cookie > header (cookie plus sécurisé)
 */
const extractJwtFromCookieOrHeader = (req: Request): string | null => {
  // 1. Essayer d'extraire depuis le cookie httpOnly
  if (req.cookies && req.cookies[AUTH_COOKIES.ACCESS_TOKEN]) {
    return req.cookies[AUTH_COOKIES.ACCESS_TOKEN];
  }

  // 2. Fallback: extraire depuis le header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Utiliser notre extracteur personnalisé (cookie + header)
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('ADMIN_JWT_SECRET') ||
        configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Valide le payload JWT et vérifie que l'utilisateur est toujours admin
   *
   * @param payload - Payload décodé du JWT
   * @returns Informations utilisateur pour req.user
   * @throws UnauthorizedException si l'utilisateur n'est plus admin
   */
  async validate(payload: { sub: string; email: string; roles: UserRole }) {
    // Récupérer l'utilisateur depuis la base pour vérifier son statut actuel
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

    // Vérifier que l'utilisateur existe et est toujours admin
    if (!user || user.roles !== UserRole.ADMIN) {
      throw new UnauthorizedException('Accès admin refusé');
    }

    return user;
  }
}

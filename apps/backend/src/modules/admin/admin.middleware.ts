/**
 * FICHIER: admin.middleware.ts
 *
 * DESCRIPTION:
 * Middleware pour masquer les routes admin non authentifiées (retourne 404).
 * 
 * IMPORTANT: Ce middleware est OBSOLÈTE car:
 * - Les tokens admin sont maintenant dans les cookies httpOnly (pas dans Authorization header)
 * - Les guards AdminJwtGuard et AdminRoleGuard gèrent déjà l'authentification
 * - Ce middleware ne vérifie que le header Authorization, ce qui bloque les requêtes avec cookies
 * 
 * SOLUTION: Désactiver ce middleware ou le supprimer complètement.
 * L'authentification est gérée par les guards sur chaque route.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { AUTH_COOKIES } from '../../common/utils/cookie.utils';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // IMPORTANT: Ce middleware est désactivé car:
    // 1. Les tokens admin sont dans les cookies (sl_access_token), pas dans Authorization header
    // 2. Les guards (AdminJwtGuard, AdminRoleGuard) gèrent déjà l'authentification
    // 3. Vérifier uniquement le header Authorization bloque les requêtes avec cookies
    
    // Ancien code (OBSOLÈTE - ne pas utiliser):
    // const authHeader = req.headers.authorization;
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   console.log('⚠️  AdminMiddleware: Pas de token, retour 404');
    //   throw new NotFoundException();
    // }

    // Nouveau comportement: Laisser passer, les guards gèrent l'authentification
    // Vérifier si un token est présent (cookie OU header) pour logging uniquement
    const hasCookieToken = req.cookies?.[AUTH_COOKIES.ACCESS_TOKEN];
    const authHeader = req.headers.authorization;
    const hasHeaderToken = authHeader && authHeader.startsWith('Bearer ');

    // Si aucun token présent, on laisse quand même passer car les guards vont retourner 401
    // (plus logique que 404 pour une erreur d'authentification)
    if (!hasCookieToken && !hasHeaderToken) {
      // Pas de token - laisser les guards gérer (ils retourneront 401, pas 404)
      // Ne rien faire ici, laisser passer
    }

    // Laisser passer la requête - les guards gèrent l'authentification
    next();
  }
}


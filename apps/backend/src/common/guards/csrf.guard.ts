/**
 * FICHIER: csrf.guard.ts
 *
 * DESCRIPTION:
 * Guard pour protéger les routes contre les attaques CSRF (Cross-Site Request Forgery).
 * Utilise le mécanisme "double submit cookie" :
 * - Vérifie que le token dans le cookie XSRF-TOKEN correspond au header X-CSRF-Token
 * - Appliqué uniquement sur les méthodes mutantes (POST, PATCH, DELETE, PUT)
 * - Exclut automatiquement les méthodes GET (lecture seule)
 *
 * UTILISATION:
 * - Appliquer avec @UseGuards(CsrfGuard) sur les routes mutantes
 * - Ou appliquer globalement avec exclusion des routes GET
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityService, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../modules/security/security.service';

/**
 * Décorateur pour exclure une route de la vérification CSRF
 * Utile pour les webhooks ou autres endpoints qui ne peuvent pas envoyer le header
 */
export const SKIP_CSRF = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF, true);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly securityService: SecurityService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Vérifier si la route est exclue de la vérification CSRF
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    // Méthodes HTTP à protéger (mutantes)
    const protectedMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];

    // Ignorer les méthodes GET (lecture seule)
    if (!protectedMethods.includes(request.method)) {
      return true;
    }

    // Récupérer le token depuis le cookie
    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];

    // Récupérer le token depuis le header
    const headerToken = request.headers[CSRF_HEADER_NAME.toLowerCase()] as string;

    // Valider que les deux tokens correspondent
    const isValid = this.securityService.validateCsrfToken(cookieToken, headerToken);

    if (!isValid) {
      // Log de sécurité (sans données sensibles)
      console.warn(
        `[CSRF] Token invalide ou manquant - ${request.method} ${request.path} (IP: ${request.ip})`,
      );
      throw new ForbiddenException(
        'Token CSRF invalide ou manquant. Veuillez recharger la page.',
      );
    }

    return true;
  }
}

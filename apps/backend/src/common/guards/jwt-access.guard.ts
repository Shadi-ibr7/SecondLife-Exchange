/**
 * FICHIER: jwt-access.guard.ts
 *
 * DESCRIPTION:
 * Ce guard protège les routes qui nécessitent une authentification JWT.
 * Il vérifie que la requête contient un token JWT valide dans le header Authorization.
 *
 * FONCTIONNEMENT:
 * - Utilise la stratégie 'jwt-access' définie dans auth/strategies/jwt-access.strategy.ts
 * - Vérifie automatiquement le token JWT
 * - Si le token est valide, ajoute l'utilisateur à request.user
 * - Si le token est invalide ou absent, retourne une erreur 401 (Unauthorized)
 *
 * UTILISATION:
 * - Appliqué avec @UseGuards(JwtAccessGuard) sur les routes protégées
 * - Ou configuré globalement pour protéger toutes les routes
 */

// Import des décorateurs NestJS
import { Injectable } from '@nestjs/common';

// Import de AuthGuard de Passport (système d'authentification)
import { AuthGuard } from '@nestjs/passport';

/**
 * GUARD: JwtAccessGuard
 *
 * Ce guard étend AuthGuard de Passport avec la stratégie 'jwt-access'.
 * La stratégie est définie dans auth/strategies/jwt-access.strategy.ts
 *
 * Quand ce guard est appliqué à une route:
 * 1. Il vérifie la présence d'un token JWT dans le header Authorization
 * 2. Il valide le token (signature, expiration, etc.)
 * 3. Si valide, il extrait les informations de l'utilisateur et les ajoute à request.user
 * 4. Si invalide, il rejette la requête avec une erreur 401
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {}

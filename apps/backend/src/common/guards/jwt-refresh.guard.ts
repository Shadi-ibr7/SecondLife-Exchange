/**
 * FICHIER: jwt-refresh.guard.ts
 *
 * DESCRIPTION:
 * Ce guard protège la route de rafraîchissement du token JWT.
 * Il vérifie que la requête contient un refresh token valide.
 *
 * DIFFÉRENCE AVEC JwtAccessGuard:
 * - JwtAccessGuard vérifie les access tokens (courte durée, ~15 minutes)
 * - JwtRefreshGuard vérifie les refresh tokens (longue durée, ~7 jours)
 * - Les refresh tokens sont utilisés uniquement pour obtenir de nouveaux access tokens
 *
 * FONCTIONNEMENT:
 * - Utilise la stratégie 'jwt-refresh' définie dans auth/strategies/jwt-refresh.strategy.ts
 * - Vérifie le refresh token dans les cookies ou le body
 * - Si valide, permet de générer un nouveau access token
 *
 * UTILISATION:
 * - Appliqué uniquement sur la route POST /api/v1/auth/refresh
 */

// Import des décorateurs NestJS
import { Injectable } from '@nestjs/common';

// Import de AuthGuard de Passport
import { AuthGuard } from '@nestjs/passport';

/**
 * GUARD: JwtRefreshGuard
 *
 * Ce guard étend AuthGuard avec la stratégie 'jwt-refresh'.
 * La stratégie est définie dans auth/strategies/jwt-refresh.strategy.ts
 *
 * Utilisé uniquement pour la route de rafraîchissement du token,
 * qui permet d'obtenir un nouveau access token sans se reconnecter.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

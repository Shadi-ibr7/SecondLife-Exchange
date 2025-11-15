/**
 * FICHIER: admin.guard.ts
 *
 * DESCRIPTION:
 * Ce guard protège les routes qui nécessitent des privilèges administrateur.
 * Il vérifie que l'utilisateur authentifié a le rôle 'ADMIN'.
 *
 * FONCTIONNEMENT:
 * - Vérifie que request.user existe (utilisateur authentifié)
 * - Vérifie que user.roles === 'ADMIN'
 * - Si les conditions ne sont pas remplies, retourne une erreur 403 (Forbidden)
 *
 * UTILISATION:
 * - Appliqué avec @UseGuards(JwtAccessGuard, AdminGuard) sur les routes admin
 * - JwtAccessGuard doit être appliqué AVANT pour s'assurer que l'utilisateur est authentifié
 *
 * EXEMPLE:
 * @UseGuards(JwtAccessGuard, AdminGuard)
 * @Get('admin/users')
 * getUsers() { ... }
 */

// Import des interfaces et exceptions NestJS
import {
  Injectable, // Décorateur pour créer un service injectable
  CanActivate, // Interface pour créer un guard
  ExecutionContext, // Contexte d'exécution (contient les infos de la requête)
  ForbiddenException, // Exception pour les accès refusés (403)
} from '@nestjs/common';

/**
 * GUARD: AdminGuard
 *
 * Ce guard vérifie que l'utilisateur authentifié a les privilèges administrateur.
 * Il doit être utilisé APRÈS JwtAccessGuard pour s'assurer que request.user existe.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * MÉTHODE: canActivate
   *
   * Cette méthode est appelée avant d'exécuter la route.
   * Elle retourne true si l'accès est autorisé, sinon lance une exception.
   *
   * @param context - Contexte d'exécution contenant les infos de la requête
   * @returns true si l'utilisateur est admin, sinon lance ForbiddenException
   */
  canActivate(context: ExecutionContext): boolean {
    // Récupérer la requête HTTP depuis le contexte
    const request = context.switchToHttp().getRequest();

    // Récupérer l'utilisateur depuis la requête
    // (ajouté par JwtAccessGuard si le token est valide)
    const user = request.user;

    // Vérifier que l'utilisateur est authentifié
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Vérifier que l'utilisateur a le rôle administrateur
    if (user.roles !== 'ADMIN') {
      throw new ForbiddenException('Accès administrateur requis');
    }

    // Si toutes les vérifications passent, autoriser l'accès
    return true;
  }
}

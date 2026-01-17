/**
 * FICHIER: roles.guard.ts
 *
 * DESCRIPTION:
 * Guard pour le contrôle d'accès basé sur les rôles (RBAC).
 * Vérifie que l'utilisateur authentifié possède un des rôles requis.
 *
 * FONCTIONNEMENT:
 * 1. Lit les rôles requis depuis les métadonnées (@Roles decorator)
 * 2. Si aucun rôle requis, autorise l'accès
 * 3. Vérifie que req.user existe (doit être utilisé après JwtAccessGuard)
 * 4. Compare req.user.roles avec les rôles requis
 * 5. Autorise si l'utilisateur a au moins un des rôles requis
 *
 * UTILISATION:
 * @UseGuards(JwtAccessGuard, RolesGuard)
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 * @Get('admin-route')
 * adminRoute() { ... }
 *
 * IMPORTANT:
 * - JwtAccessGuard DOIT être appliqué AVANT RolesGuard
 * - Si @Roles n'est pas défini, la route est accessible à tous les authentifiés
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles requis depuis les métadonnées (@Roles decorator)
    // Cherche d'abord sur le handler (méthode), puis sur la classe (contrôleur)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucun rôle requis n'est défini, autoriser l'accès
    // (la route est accessible à tous les utilisateurs authentifiés)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupérer la requête HTTP et l'utilisateur
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si pas d'utilisateur (non authentifié), retourner 401
    if (!user) {
      this.logger.warn(
        `Accès refusé (401): Utilisateur non authentifié - ${request.method} ${request.url}`,
      );
      throw new UnauthorizedException('Authentification requise');
    }

    // Vérifier que l'utilisateur a au moins un des rôles requis
    const userRole = user.roles as UserRole;
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      this.logger.warn(
        `Accès refusé (403): Rôle insuffisant - User: ${user.id} (${user.email}), Rôle: ${userRole}, Requis: [${requiredRoles.join(', ')}] - ${request.method} ${request.url}`,
      );
      throw new ForbiddenException(
        `Accès refusé. Rôle requis: ${requiredRoles.join(' ou ')}`,
      );
    }

    // Log de succès pour audit (niveau debug)
    this.logger.debug(
      `Accès autorisé: User: ${user.id} (${userRole}) - ${request.method} ${request.url}`,
    );

    return true;
  }
}

/**
 * FICHIER: admin-role.guard.ts
 *
 * DESCRIPTION:
 * Guard pour vérifier que l'utilisateur a le rôle ADMIN.
 * Utilisé conjointement avec AdminJwtGuard pour les routes admin.
 *
 * LOGGING:
 * - Log les refus d'accès (403) avec les détails de l'utilisateur
 * - Log les accès autorisés en mode debug
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  private readonly logger = new Logger(AdminRoleGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn(
        `Accès refusé (403): Utilisateur non authentifié - ${request.method} ${request.url}`,
      );
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (user.roles !== UserRole.ADMIN) {
      this.logger.warn(
        `Accès refusé (403): Rôle insuffisant - User: ${user.id} (${user.email}), Rôle: ${user.roles} - ${request.method} ${request.url}`,
      );
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    this.logger.debug(
      `Accès autorisé (admin): User: ${user.id} - ${request.method} ${request.url}`,
    );

    return true;
  }
}


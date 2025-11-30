/**
 * FICHIER: admin-role.guard.ts
 *
 * DESCRIPTION:
 * Guard pour vérifier que l'utilisateur a le rôle ADMIN.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (user.roles !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
}


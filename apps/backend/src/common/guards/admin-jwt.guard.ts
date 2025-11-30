/**
 * FICHIER: admin-jwt.guard.ts
 *
 * DESCRIPTION:
 * Guard pour l'authentification admin avec JWT séparé.
 * Utilise un secret JWT différent pour les admins.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token admin invalide');
    }
    return user;
  }
}


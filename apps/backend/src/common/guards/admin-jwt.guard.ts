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
import { Request } from 'express';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    // LOGS DE DIAGNOSTIC TEMPORAIRES
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request as any).requestId || 'unknown';
    const hasCookies = !!request.cookies && Object.keys(request.cookies).length > 0;
    const hasAccessTokenCookie = request.cookies?.['sl_access_token'] ? true : false;
    const hasRefreshTokenCookie = request.cookies?.['sl_refresh_token'] ? true : false;
    const authHeader = request.headers.authorization;
    
    console.log(`[DIAG AdminJwtGuard.canActivate] requestId: ${requestId}`);
    console.log(`[DIAG AdminJwtGuard.canActivate] cookies présents: ${hasCookies}`);
    console.log(`[DIAG AdminJwtGuard.canActivate] sl_access_token présent: ${hasAccessTokenCookie}`);
    console.log(`[DIAG AdminJwtGuard.canActivate] sl_refresh_token présent: ${hasRefreshTokenCookie}`);
    console.log(`[DIAG AdminJwtGuard.canActivate] Authorization header: ${authHeader ? 'PRÉSENT' : 'ABSENT'}`);
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // LOGS DE DIAGNOSTIC TEMPORAIRES
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request as any).requestId || 'unknown';
    
    console.log(`[DIAG AdminJwtGuard.handleRequest] requestId: ${requestId}`);
    console.log(`[DIAG AdminJwtGuard.handleRequest] err:`, err ? err.message || err : 'null');
    console.log(`[DIAG AdminJwtGuard.handleRequest] user:`, user ? `OUI (id: ${user.id})` : 'NON');
    console.log(`[DIAG AdminJwtGuard.handleRequest] info:`, info ? (typeof info === 'object' ? JSON.stringify(info) : info) : 'null');
    
    if (err || !user) {
      const errorToThrow = err || new UnauthorizedException('Token admin invalide');
      console.log(`[DIAG AdminJwtGuard.handleRequest] LANCEMENT EXCEPTION:`, {
        isError: !!err,
        errorType: err?.constructor?.name || 'UnauthorizedException',
        errorMessage: errorToThrow.message,
        userPresent: !!user
      });
      throw errorToThrow;
    }
    return user;
  }
}


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

    // IMPORTANT: Si pas d'utilisateur ou erreur, lancer UnauthorizedException (401)
    // Ne jamais retourner 422 pour un token manquant - c'est une erreur d'authentification (401)
    if (err || !user) {
      // Si info indique un token manquant ou invalide, message clair
      let errorMessage = 'Token admin manquant ou invalide';
      if (info && typeof info === 'object') {
        if (info.message === 'No auth token' || info.message?.includes('No token')) {
          errorMessage = 'Token admin manquant';
        } else if (info.message === 'jwt expired' || info.message?.includes('expired')) {
          errorMessage = 'Token admin expiré';
        } else if (info.message === 'jwt malformed' || info.message?.includes('malformed')) {
          errorMessage = 'Token admin invalide';
        }
      }

      const errorToThrow = err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException(errorMessage);

      console.log(`[DIAG AdminJwtGuard.handleRequest] LANCEMENT EXCEPTION 401:`, {
        isError: !!err,
        errorType: 'UnauthorizedException',
        errorMessage: errorToThrow.message,
        userPresent: !!user,
        statusCode: 401
      });
      throw errorToThrow;
    }
    return user;
  }
}


/**
 * FICHIER: admin.middleware.ts
 *
 * DESCRIPTION:
 * Middleware pour masquer les routes admin non authentifiées (retourne 404).
 */

import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Si pas de token, retourner 404 pour masquer l'existence de la route
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('⚠️  AdminMiddleware: Pas de token, retour 404');
      throw new NotFoundException();
    }

    // Logger la requête admin (IP, user-agent)
    // Cette logique sera gérée par le guard après authentification
    next();
  }
}


/**
 * FICHIER: security.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de sécurité (CSRF).
 * Fournit un endpoint pour obtenir un token CSRF (double submit cookie).
 */

import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * Endpoint pour obtenir un token CSRF
   * GET /api/v1/security/csrf
   *
   * MÉCANISME:
   * - Génère un token CSRF aléatoire
   * - Le définit dans un cookie non-httpOnly (XSRF-TOKEN)
   * - Le retourne aussi dans la réponse JSON
   *
   * UTILISATION FRONTEND:
   * - Le cookie est automatiquement envoyé par le navigateur
   * - Le frontend doit lire le token depuis le cookie ou la réponse JSON
   * - Envoyer le token dans le header X-CSRF-Token sur toutes les requêtes mutantes
   *
   * @returns Token CSRF dans la réponse JSON et dans le cookie
   */
  @Get('csrf')
  getCsrfToken(@Res() res: Response) {
    const token = this.securityService.generateCsrfToken();
    const cookieConfig = this.securityService.getCsrfCookieConfig();

    // Définir le cookie CSRF (non-httpOnly pour que JS puisse le lire)
    res.cookie('XSRF-TOKEN', token, cookieConfig);

    // Retourner le token dans la réponse JSON aussi (pour faciliter la récupération côté client)
    return res.json({
      csrfToken: token,
      message: 'CSRF token généré et défini dans le cookie XSRF-TOKEN',
    });
  }
}

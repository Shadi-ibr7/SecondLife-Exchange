/**
 * FICHIER: security.service.ts
 *
 * DESCRIPTION:
 * Service pour générer et valider les tokens CSRF.
 * Utilise le mécanisme "double submit cookie" :
 * - Le token est envoyé dans un cookie non-httpOnly (XSRF-TOKEN)
 * - Le même token doit être présent dans le header X-CSRF-Token
 * - Le backend vérifie que cookie === header
 */

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Nom du cookie CSRF (non-httpOnly pour que JS puisse le lire)
 */
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/**
 * Nom du header CSRF attendu dans les requêtes
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Durée de vie du cookie CSRF (1 heure)
 */
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 heure en millisecondes

@Injectable()
export class SecurityService {
  /**
   * Génère un token CSRF aléatoire sécurisé
   * @returns Token CSRF (chaîne hexadécimale de 32 bytes)
   */
  generateCsrfToken(): string {
    // Générer 32 bytes aléatoires et les convertir en hexadécimal
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Retourne la configuration du cookie CSRF selon l'environnement
   * @returns Configuration du cookie
   */
  getCsrfCookieConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const config: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
      maxAge: number;
      domain?: string;
    } = {
      httpOnly: false, // IMPORTANT: Non-httpOnly pour que JS puisse le lire
      secure: isProduction, // HTTPS uniquement en prod
      sameSite: isProduction ? 'none' : 'lax', // 'none' pour cross-site en prod
      path: '/',
      maxAge: CSRF_TOKEN_MAX_AGE,
    };

    if (cookieDomain) {
      config.domain = cookieDomain;
    }

    return config;
  }

  /**
   * Valide un token CSRF en comparant le cookie et le header
   * @param cookieToken - Token présent dans le cookie XSRF-TOKEN
   * @param headerToken - Token présent dans le header X-CSRF-Token
   * @returns true si les tokens correspondent, false sinon
   */
  validateCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
    // Les deux tokens doivent être présents
    if (!cookieToken || !headerToken) {
      return false;
    }

    // Les tokens doivent être identiques (comparaison sécurisée avec timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken),
    );
  }
}

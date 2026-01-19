/**
 * FICHIER: cookie.utils.ts
 *
 * DESCRIPTION:
 * Utilitaires pour gérer les cookies d'authentification de manière sécurisée.
 * Gère les différences entre environnement de développement et production.
 *
 * SÉCURITÉ:
 * - httpOnly: Empêche l'accès JavaScript aux cookies (protection XSS)
 * - secure: Cookie envoyé uniquement sur HTTPS (production)
 * - sameSite: Protection CSRF
 *   - 'lax' en dev (même domaine)
 *   - 'none' en prod (cross-site, requis pour front Vercel + API VPS)
 *
 * RÉFÉRENCES:
 * - OWASP Session Management
 * - RFC 6265 (HTTP State Management)
 */

import { Response } from 'express';

/**
 * Configuration des cookies selon l'environnement
 */
export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
  maxAge: number;
}

/**
 * Noms des cookies d'authentification
 */
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'sl_access_token',
  REFRESH_TOKEN: 'sl_refresh_token',
} as const;

/**
 * Durées d'expiration en millisecondes
 */
export const COOKIE_MAX_AGE = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 jours
} as const;

/**
 * Retourne la configuration de cookie selon l'environnement
 *
 * @param maxAge - Durée de vie du cookie en millisecondes
 * @returns Configuration du cookie
 */
export function getCookieConfig(maxAge: number): CookieConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN; // Ex: '.example.com' pour partager entre sous-domaines

  const config: CookieConfig = {
    httpOnly: true, // Toujours httpOnly pour empêcher accès JS
    secure: isProduction, // HTTPS uniquement en prod
    sameSite: isProduction ? 'none' : 'lax', // 'none' requis pour cross-site en prod
    path: '/',
    maxAge,
  };

  // Ajouter le domaine si configuré (pour partager entre sous-domaines)
  if (cookieDomain) {
    config.domain = cookieDomain;
  }

  return config;
}

/**
 * Définit le cookie d'access token
 *
 * IMPORTANT: En production, le cookie est TOUJOURS défini avec:
 * - httpOnly: true
 * - secure: true
 * - sameSite: 'none'
 * - path: '/'
 * - maxAge: 15 minutes
 *
 * @param res - Objet Response Express
 * @param accessToken - Token d'accès JWT
 */
export function setAccessTokenCookie(res: Response, accessToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;

  // Configuration obligatoire en production
  const config: CookieConfig = {
    httpOnly: true,
    secure: isProduction, // true en prod, false en dev
    sameSite: isProduction ? 'none' : 'lax', // 'none' requis pour cross-site en prod
    path: '/',
    maxAge: COOKIE_MAX_AGE.ACCESS_TOKEN, // 15 minutes
  };

  if (cookieDomain) {
    config.domain = cookieDomain;
  }

  res.cookie(AUTH_COOKIES.ACCESS_TOKEN, accessToken, config);

  // LOG TEMPORAIRE pour tracer la pose du cookie
  if (isProduction) {
    console.log(`[ADMIN LOGIN → access cookie set: YES] cookie=${AUTH_COOKIES.ACCESS_TOKEN}, secure=${config.secure}, sameSite=${config.sameSite}, httpOnly=${config.httpOnly}`);
  }
}

/**
 * Définit le cookie de refresh token
 *
 * @param res - Objet Response Express
 * @param refreshToken - Token de rafraîchissement JWT
 */
export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  const config = getCookieConfig(COOKIE_MAX_AGE.REFRESH_TOKEN);
  res.cookie(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, config);
}

/**
 * Définit les deux cookies d'authentification (access + refresh)
 *
 * @param res - Objet Response Express
 * @param accessToken - Token d'accès JWT
 * @param refreshToken - Token de rafraîchissement JWT
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
}

/**
 * Supprime les cookies d'authentification (logout)
 *
 * @param res - Objet Response Express
 */
export function clearAuthCookies(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;

  const clearOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  if (cookieDomain) {
    clearOptions.domain = cookieDomain;
  }

  // Supprimer les cookies en les expirant immédiatement
  res.clearCookie(AUTH_COOKIES.ACCESS_TOKEN, clearOptions);
  res.clearCookie(AUTH_COOKIES.REFRESH_TOKEN, clearOptions);
}

/**
 * Extrait le token d'un cookie de la requête
 *
 * @param cookies - Objet cookies de la requête
 * @param cookieName - Nom du cookie à extraire
 * @returns Le token ou null si non présent
 */
export function extractTokenFromCookie(
  cookies: Record<string, string> | undefined,
  cookieName: string,
): string | null {
  if (!cookies || !cookies[cookieName]) {
    return null;
  }
  return cookies[cookieName];
}

/**
 * Extrait l'access token des cookies
 *
 * @param cookies - Objet cookies de la requête
 * @returns Le token d'accès ou null
 */
export function extractAccessToken(
  cookies: Record<string, string> | undefined,
): string | null {
  return extractTokenFromCookie(cookies, AUTH_COOKIES.ACCESS_TOKEN);
}

/**
 * Extrait le refresh token des cookies
 *
 * @param cookies - Objet cookies de la requête
 * @returns Le refresh token ou null
 */
export function extractRefreshToken(
  cookies: Record<string, string> | undefined,
): string | null {
  return extractTokenFromCookie(cookies, AUTH_COOKIES.REFRESH_TOKEN);
}

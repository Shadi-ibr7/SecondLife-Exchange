/**
 * FICHIER: security.config.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la configuration de sécurité de l'application.
 * Il contient les secrets JWT, les durées d'expiration, et les paramètres de rate limiting.
 *
 * SÉCURITÉ:
 * - Les secrets JWT doivent être des chaînes aléatoires longues et sécurisées
 * - Ne JAMAIS commiter les secrets dans le code source
 * - Utiliser des variables d'environnement en production
 *
 * CONFIGURATION:
 * - JWT: Secrets et durées d'expiration pour les tokens
 * - Bcrypt: Nombre de rounds pour le hachage des mots de passe
 * - Rate Limiting: Limites pour protéger contre les abus
 */

// Import de registerAs
import { registerAs } from '@nestjs/config';

/**
 * CONFIGURATION: security
 *
 * Configuration de sécurité de l'application.
 */
export default registerAs('security', () => ({
  // ============================================
  // JWT (JSON Web Tokens)
  // ============================================
  /**
   * Secret pour signer et vérifier les access tokens.
   * ATTENTION: En production, utiliser une chaîne aléatoire longue et sécurisée!
   * Ne JAMAIS utiliser la valeur par défaut en production.
   */
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',

  /**
   * Secret pour signer et vérifier les refresh tokens.
   * Doit être différent du secret des access tokens.
   */
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',

  /**
   * Durée de vie des access tokens (15 minutes).
   * Les tokens expirent rapidement pour limiter les risques en cas de vol.
   */
  jwtAccessExpiresIn: '15m',

  /**
   * Durée de vie des refresh tokens (7 jours).
   * Permet de rester connecté sans se reconnecter fréquemment.
   */
  jwtRefreshExpiresIn: '7d',

  // ============================================
  // BCRYPT (Hachage des mots de passe)
  // ============================================
  /**
   * Nombre de "salt rounds" pour bcrypt.
   * Plus élevé = plus sécurisé mais plus lent.
   * 12 est un bon compromis entre sécurité et performance.
   */
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  // ============================================
  // RATE LIMITING (Protection contre les abus)
  // ============================================
  /**
   * Limite générale: 100 requêtes par minute par IP.
   * Protège contre les attaques par déni de service (DDoS).
   */
  rateLimitTtl: 60, // Time To Live: 1 minute (en secondes)
  rateLimitLimit: 100, // Maximum 100 requêtes par minute

  /**
   * Limite pour les tentatives de connexion: 5 par minute.
   * Protège contre les attaques par force brute (brute force).
   */
  loginRateLimitTtl: 60, // 1 minute
  loginRateLimitLimit: 5, // Maximum 5 tentatives de connexion par minute
}));

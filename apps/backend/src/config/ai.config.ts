/**
 * FICHIER: ai.config.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la configuration pour l'intégration avec l'API Google Gemini (IA).
 * Il contient la clé API, le modèle à utiliser, et les paramètres de timeout/retry.
 *
 * UTILISATION:
 * - Analyse automatique des items pour catégorisation
 * - Génération de suggestions d'objets basées sur les thèmes
 * - Génération de contenu écologique
 *
 * SÉCURITÉ:
 * - La clé API doit être stockée dans les variables d'environnement
 * - Ne JAMAIS commiter la clé API dans le code source
 */

// Import de registerAs
import { registerAs } from '@nestjs/config';

/**
 * CONFIGURATION: ai
 *
 * Configuration pour l'intégration avec Google Gemini API.
 */
export default registerAs('ai', () => ({
  /**
   * Clé API Google Gemini.
   * OBLIGATOIRE pour utiliser les fonctionnalités IA.
   * Obtenue depuis: https://makersuite.google.com/app/apikey
   */
  geminiApiKey: process.env.AI_GEMINI_API_KEY,

  /**
   * Modèle Gemini à utiliser.
   * - gemini-2.5-flash: Rapide et économique (recommandé)
   * - gemini-pro: Plus puissant mais plus lent et coûteux
   */
  geminiModel: process.env.AI_GEMINI_MODEL || 'gemini-2.5-flash',

  /**
   * Timeout pour les requêtes API (en millisecondes).
   * Si la requête prend plus de temps, elle sera annulée.
   * Défaut: 10 secondes (10000 ms)
   */
  geminiTimeout: parseInt(process.env.AI_GEMINI_TIMEOUT_MS || '10000'),

  /**
   * Nombre maximum de tentatives en cas d'échec.
   * Si une requête échoue, elle sera réessayée jusqu'à ce nombre de fois.
   * Défaut: 1 tentative (pas de retry)
   */
  geminiMaxRetries: parseInt(process.env.AI_GEMINI_MAX_RETRIES || '1'),

  /**
   * URL de base de l'API Google Gemini.
   * Ne change généralement pas, sauf mise à jour de l'API.
   */
  geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
}));

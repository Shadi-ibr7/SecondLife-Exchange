/**
 * FICHIER: env.validation.ts
 *
 * DESCRIPTION:
 * Validation des variables d'environnement au démarrage de l'application.
 * Utilise Zod pour valider et typer les variables d'environnement.
 *
 * COMPORTEMENT:
 * - Si une variable requise est manquante => crash au boot avec message clair
 * - Si une variable optionnelle est manquante => valeur par défaut ou null
 * - Validation des formats (URLs, secrets, etc.)
 *
 * SÉCURITÉ:
 * - Empêche le démarrage avec une configuration invalide
 * - Messages d'erreur clairs pour faciliter le debugging
 */

import { z } from 'zod';

/**
 * SCHÉMA DE VALIDATION: EnvSchema
 *
 * Définit toutes les variables d'environnement avec leurs types et validations.
 */
const EnvSchema = z.object({
  // ============================================
  // CONFIGURATION GÉNÉRALE
  // ============================================
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Environnement d\'exécution'),

  API_PORT: z
    .string()
    .regex(/^\d+$/, 'API_PORT doit être un nombre')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535))
    .default('4000')
    .describe('Port du serveur HTTP'),

  // ============================================
  // BASE DE DONNÉES
  // ============================================
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL doit être une URL valide')
    .startsWith('postgresql://', 'DATABASE_URL doit commencer par postgresql://')
    .describe('URL de connexion PostgreSQL (format: postgresql://user:password@host:port/database)'),

  // ============================================
  // SÉCURITÉ JWT
  // ============================================
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET doit contenir au moins 32 caractères')
    .describe('Secret pour signer les access tokens JWT'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET doit contenir au moins 32 caractères')
    .describe('Secret pour signer les refresh tokens JWT'),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('15m')
    .describe('Durée de vie des access tokens (ex: 15m, 1h)'),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .describe('Durée de vie des refresh tokens (ex: 7d, 30d)'),

  // ============================================
  // ADMIN
  // ============================================
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, 'ADMIN_JWT_SECRET doit contenir au moins 32 caractères')
    .describe('Secret pour signer les tokens JWT admin'),

  // ============================================
  // CORS
  // ============================================
  CORS_ORIGIN: z
    .string()
    .url('CORS_ORIGIN doit être une URL valide')
    .optional()
    .describe('Origine CORS unique (déprécié, utiliser FRONTEND_ORIGINS)'),

  FRONTEND_ORIGINS: z
    .string()
    .optional()
    .describe('Origines frontend autorisées (séparées par virgules)'),

  ADMIN_ORIGIN: z
    .string()
    .url('ADMIN_ORIGIN doit être une URL valide')
    .optional()
    .describe('Origine admin (optionnel, si différente du frontend)'),

  COOKIE_DOMAIN: z
    .string()
    .optional()
    .describe('Domaine des cookies (optionnel, pour partager entre sous-domaines)'),

  // ============================================
  // CLOUDINARY (Optionnel mais recommandé)
  // ============================================
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, 'CLOUDINARY_CLOUD_NAME est requis si Cloudinary est utilisé')
    .optional()
    .describe('Nom du compte Cloudinary'),

  CLOUDINARY_API_KEY: z
    .string()
    .min(1, 'CLOUDINARY_API_KEY est requis si Cloudinary est utilisé')
    .optional()
    .describe('Clé API Cloudinary'),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, 'CLOUDINARY_API_SECRET est requis si Cloudinary est utilisé')
    .optional()
    .describe('Secret API Cloudinary (NE JAMAIS exposer côté client)'),

  CLOUDINARY_UPLOAD_PRESET: z
    .string()
    .optional()
    .describe('Preset d\'upload Cloudinary (optionnel)'),

  // ============================================
  // REDIS (Optionnel)
  // ============================================
  REDIS_URL: z
    .string()
    .url('REDIS_URL doit être une URL valide')
    .startsWith('redis://', 'REDIS_URL doit commencer par redis://')
    .optional()
    .describe('URL de connexion Redis (optionnel, fallback sur PostgreSQL)'),

  // ============================================
  // IA GEMINI (Optionnel)
  // ============================================
  AI_GEMINI_API_KEY: z
    .string()
    .optional()
    .describe('Clé API Gemini (optionnel, pour les suggestions IA)'),

  AI_GEMINI_MODEL: z
    .string()
    .default('gemini-1.5-pro')
    .describe('Modèle Gemini à utiliser'),

  // ============================================
  // UNSPLASH (Optionnel)
  // ============================================
  UNSPLASH_ACCESS_KEY: z
    .string()
    .optional()
    .describe('Clé d\'accès Unsplash (optionnel, pour la galerie d\'images)'),

  UNSPLASH_API_URL: z
    .string()
    .url('UNSPLASH_API_URL doit être une URL valide')
    .default('https://api.unsplash.com')
    .optional()
    .describe('URL de l\'API Unsplash'),

  // ============================================
  // VAPID (Optionnel)
  // ============================================
  VAPID_PUBLIC_KEY: z
    .string()
    .optional()
    .describe('Clé publique VAPID pour les notifications push'),

  VAPID_PRIVATE_KEY: z
    .string()
    .optional()
    .describe('Clé privée VAPID pour les notifications push'),

  VAPID_SUBJECT: z
    .string()
    .url('VAPID_SUBJECT doit être une URL mailto: ou https://')
    .optional()
    .describe('Sujet VAPID (mailto: ou https://)'),

  // ============================================
  // BCRYPT
  // ============================================
  BCRYPT_SALT_ROUNDS: z
    .string()
    .regex(/^\d+$/, 'BCRYPT_SALT_ROUNDS doit être un nombre')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(10).max(20))
    .default('12')
    .describe('Nombre de rounds bcrypt pour le hachage des mots de passe'),

  // ============================================
  // RATE LIMITING
  // ============================================
  THROTTLE_TTL: z
    .string()
    .regex(/^\d+$/, 'THROTTLE_TTL doit être un nombre')
    .transform((val) => parseInt(val, 10))
    .default('60')
    .optional()
    .describe('Time To Live pour le rate limiting (en secondes)'),

  THROTTLE_LIMIT: z
    .string()
    .regex(/^\d+$/, 'THROTTLE_LIMIT doit être un nombre')
    .transform((val) => parseInt(val, 10))
    .default('100')
    .optional()
    .describe('Limite de requêtes par fenêtre de temps'),
});

/**
 * TYPE: Env
 *
 * Type TypeScript dérivé du schéma Zod.
 * Utilisé pour typer les variables d'environnement dans l'application.
 */
export type Env = z.infer<typeof EnvSchema>;

/**
 * FONCTION: validateEnv
 *
 * Valide les variables d'environnement au démarrage.
 * Si la validation échoue, l'application crash avec un message d'erreur clair.
 *
 * @returns Les variables d'environnement validées
 * @throws Error si la validation échoue
 */
export function validateEnv(): Env {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      console.error('\n❌ ERREUR: Variables d\'environnement invalides\n');
      console.error('Variables manquantes ou invalides:');
      console.error(errors.join('\n'));
      console.error('\n💡 Vérifiez votre fichier .env ou .env.local\n');
      console.error('📚 Consultez apps/backend/env.example pour la liste complète\n');

      process.exit(1);
    }
    throw error;
  }
}

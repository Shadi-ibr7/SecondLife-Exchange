/**
 * FICHIER: prisma.config.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la configuration de la base de données Prisma.
 * Il contient l'URL de connexion PostgreSQL.
 *
 * FORMAT DE L'URL:
 * postgresql://[user]:[password]@[host]:[port]/[database]
 *
 * SÉCURITÉ:
 * - Ne JAMAIS commiter l'URL avec des credentials réels
 * - Utiliser des variables d'environnement en production
 * - L'URL par défaut est uniquement pour le développement local
 */

// Import de registerAs
import { registerAs } from '@nestjs/config';

/**
 * CONFIGURATION: prisma
 *
 * Configuration de la base de données PostgreSQL via Prisma.
 */
export default registerAs('prisma', () => ({
  /**
   * URL de connexion à la base de données PostgreSQL.
   *
   * FORMAT:
   * postgresql://[user]:[password]@[host]:[port]/[database]
   *
   * EXEMPLE:
   * postgresql://postgres:password@localhost:5432/secondlife
   *
   * EN PRODUCTION:
   * Utiliser une variable d'environnement DATABASE_URL sécurisée.
   */
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/secondlife', // Valeur par défaut pour le développement
}));

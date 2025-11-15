/**
 * FICHIER: app.config.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la configuration générale de l'application backend.
 * Il utilise registerAs() de NestJS pour créer un namespace de configuration.
 *
 * CONFIGURATION:
 * - port: Port sur lequel le serveur écoute (défaut: 4000)
 * - nodeEnv: Environnement d'exécution (development, production, test)
 * - corsOrigin: URL du frontend autorisée pour CORS (défaut: http://localhost:3000)
 *
 * UTILISATION:
 * - Chargé dans AppModule via ConfigModule.forRoot()
 * - Accessible via ConfigService.get('app.port'), etc.
 */

// Import de registerAs pour créer un namespace de configuration
import { registerAs } from '@nestjs/config';

/**
 * CONFIGURATION: app
 *
 * Configuration générale de l'application.
 * Les valeurs sont lues depuis les variables d'environnement avec des valeurs par défaut.
 */
export default registerAs('app', () => ({
  // Port du serveur HTTP (défaut: 4000)
  // Utilisé dans main.ts pour démarrer le serveur
  port: parseInt(process.env.API_PORT, 10) || 4000,

  // Environnement d'exécution (development, production, test)
  // Utilisé pour adapter le comportement de l'application
  nodeEnv: process.env.NODE_ENV || 'development',

  // URL du frontend autorisée pour CORS (Cross-Origin Resource Sharing)
  // Permet au frontend de faire des requêtes vers l'API
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));

/**
 * FICHIER: main.ts
 *
 * DESCRIPTION:
 * Ce fichier est le point d'entrée principal de l'application backend NestJS.
 * Il initialise l'application, configure la sécurité, CORS, validation, et démarre le serveur.
 *
 * FONCTIONNALITÉS:
 * - Création de l'application NestJS
 * - Configuration de la sécurité (Helmet)
 * - Configuration CORS pour autoriser les requêtes depuis le frontend
 * - Validation globale des données entrantes
 * - Intercepteur de logging pour tracer les requêtes
 * - Démarrage du serveur HTTP
 */

// Import de NestFactory: permet de créer une instance de l'application NestJS
import { NestFactory } from '@nestjs/core';

// Import de ValidationPipe: valide automatiquement les données des requêtes
import { ValidationPipe } from '@nestjs/common';

// Import de ConfigService: permet d'accéder aux variables d'environnement
import { ConfigService } from '@nestjs/config';

// Import de ThrottlerModule: pour le rate limiting (limitation du nombre de requêtes)
import { ThrottlerModule } from '@nestjs/throttler';

// Import de Helmet: middleware de sécurité qui ajoute des headers HTTP sécurisés
import helmet from 'helmet';

// Import de CORS: middleware pour gérer les requêtes cross-origin
import cors from 'cors';

// Import de cookie-parser: middleware pour parser les cookies
import cookieParser from 'cookie-parser';

// Import du module principal de l'application
import { AppModule } from './app.module';

// Import du pipe de validation personnalisé (utilise Zod pour la validation)
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';

// Import de l'intercepteur de logging (enregistre toutes les requêtes)
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * FONCTION PRINCIPALE: bootstrap
 *
 * Cette fonction est appelée au démarrage de l'application.
 * Elle configure et démarre le serveur NestJS.
 *
 * async/await: permet d'utiliser des opérations asynchrones (création de l'app, démarrage du serveur)
 */
async function bootstrap() {
  // ============================================
  // CRÉATION DE L'APPLICATION NESTJS
  // ============================================
  // NestFactory.create() crée une instance de l'application en utilisant AppModule
  // await est nécessaire car c'est une opération asynchrone
  const app = await NestFactory.create(AppModule);

  // Récupération du service de configuration pour accéder aux variables d'environnement
  const configService = app.get(ConfigService);

  // ============================================
  // CONFIGURATION DE LA SÉCURITÉ (HELMET)
  // ============================================
  /**
   * Helmet ajoute des headers HTTP de sécurité pour protéger contre:
   * - XSS (Cross-Site Scripting)
   * - Clickjacking
   * - MIME type sniffing
   * - Et autres vulnérabilités courantes
   *
   * Content Security Policy (CSP) définit quelles ressources peuvent être chargées:
   * - imgSrc: images depuis le même domaine, data URIs, HTTPS, et blobs
   * - defaultSrc: par défaut, seulement depuis le même domaine
   * - styleSrc: styles depuis le même domaine + inline (pour Tailwind)
   * - scriptSrc: scripts uniquement depuis le même domaine
   * - connectSrc: connexions WebSocket (ws:, wss:) autorisées pour Socket.io
   */
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // Désactivé pour permettre certaines intégrations
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'], // Images autorisées
          defaultSrc: ["'self'"], // Par défaut, seulement même origine
          styleSrc: ["'self'", "'unsafe-inline'"], // Styles inline autorisés (Tailwind)
          scriptSrc: ["'self'"], // Scripts uniquement depuis même domaine
          connectSrc: ["'self'", 'ws:', 'wss:'], // WebSockets autorisés
        },
      },
    }),
  );

  // ============================================
  // CONFIGURATION COOKIE PARSER
  // ============================================
  /**
   * Cookie-parser permet de parser les cookies des requêtes entrantes.
   * Nécessaire pour l'authentification via cookies httpOnly.
   */
  app.use(cookieParser());

  // ============================================
  // CONFIGURATION CORS (Cross-Origin Resource Sharing)
  // ============================================
  /**
   * CORS strict avec whitelist d'origins.
   * En production, toutes les requêtes sans origin ou avec origin non-whitelisted sont rejetées.
   *
   * CONFIGURATION:
   * - FRONTEND_ORIGINS: Liste des origines autorisées (séparées par virgules)
   * - ADMIN_ORIGIN: Origine admin optionnelle (si différente)
   *
   * SÉCURITÉ:
   * - credentials: true est OBLIGATOIRE pour les cookies cross-origin
   * - En prod, les requêtes sans origin sont rejetées (protection contre certaines attaques)
   * - Headers X-CSRF-Token autorisé pour la protection CSRF
   */
  const frontendOrigins = configService.get<string[]>('app.frontendOrigins') || [
    'http://localhost:3000',
  ];
  const adminOrigin = configService.get<string>('app.adminOrigin');

  // Construire la liste complète des origines autorisées
  const allowedOrigins = [...frontendOrigins];
  if (adminOrigin && !allowedOrigins.includes(adminOrigin)) {
    allowedOrigins.push(adminOrigin);
  }

  const isProduction = configService.get<string>('app.nodeEnv') === 'production';

  app.use(
    cors({
      origin: (origin, callback) => {
        // En production, rejeter les requêtes sans origin (protection renforcée)
        // En dev, autoriser pour faciliter le développement avec Postman/curl
        if (!origin) {
          if (isProduction) {
            console.warn('[CORS] Requête sans origin rejetée en production');
            return callback(new Error('Origin header required in production'));
          }
          // En dev, autoriser les requêtes sans origin
          return callback(null, true);
        }

        // Vérifier si l'origine est dans la whitelist
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Log de sécurité (sans données sensibles)
        console.warn(
          `[CORS] Origine rejetée: ${origin.substring(0, 50)}... (whitelist: ${allowedOrigins.length} origin(s))`,
        );
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true, // OBLIGATOIRE pour les cookies cross-origin
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // PUT retiré (utiliser PATCH)
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token', // Header pour protection CSRF
      ],
      exposedHeaders: ['X-CSRF-Token'], // Permettre au client de lire ce header
    }),
  );

  // ============================================
  // VALIDATION GLOBALE DES DONNÉES
  // ============================================
  /**
   * Le pipe de validation personnalisé valide automatiquement toutes les données
   * entrantes dans l'API selon les schémas Zod définis dans les DTOs.
   * Si les données sont invalides, une erreur 400 est retournée automatiquement.
   */
  app.useGlobalPipes(new CustomValidationPipe());

  // ============================================
  // INTERCEPTEUR DE LOGGING
  // ============================================
  /**
   * L'intercepteur de logging enregistre toutes les requêtes HTTP:
   * - Méthode HTTP (GET, POST, etc.)
   * - URL de la requête
   * - Temps de réponse
   * - Code de statut
   *
   * Utile pour le débogage et le monitoring en production.
   */
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ============================================
  // PRÉFIXE GLOBAL DE L'API
  // ============================================
  /**
   * Toutes les routes de l'API commenceront par /api/v1
   * Exemple: /api/v1/users, /api/v1/items, etc.
   *
   * Le "v1" permet de versionner l'API pour faciliter les mises à jour futures.
   */
  app.setGlobalPrefix('api/v1');

  // ============================================
  // DÉMARRAGE DU SERVEUR
  // ============================================
  /**
   * Récupération du port depuis la configuration (par défaut 4000)
   * app.listen() démarre le serveur HTTP et écoute sur le port spécifié
   */
  const port = configService.get<number>('app.port');
  await app.listen(port);

  // ============================================
  // MESSAGES DE CONFIRMATION
  // ============================================
  /**
   * Affichage de messages informatifs dans la console pour confirmer le démarrage
   */
  console.log(`🚀 Backend démarré sur le port ${port}`);
  console.log(`📚 API disponible sur http://localhost:${port}/api/v1`);
  console.log(
    `🔒 CORS configuré pour ${allowedOrigins.length} origine(s): ${allowedOrigins.join(', ')}`,
  );
  console.log(`🍪 Cookie-parser activé pour auth httpOnly`);
}

// ============================================
// LANCEMENT DE L'APPLICATION
// ============================================
/**
 * Appel de la fonction bootstrap() pour démarrer l'application
 * Cette ligne est exécutée quand le fichier est chargé par Node.js
 */
bootstrap();

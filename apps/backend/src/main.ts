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

// Import de l'intercepteur de logging HTTP (enregistre toutes les requêtes avec requestId)
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

// Import du filtre global d'exception (standardise les réponses d'erreur)
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Import du middleware RequestId (génère un UUID pour chaque requête)
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

// Import du logger structuré Pino
import { PinoLoggerService } from './common/logger/pino-logger.service';

// Import de la validation des variables d'environnement
import { validateEnv } from './config/env.validation';

// Import du service health pour les routes sans préfixe
import { HealthService } from './modules/health/health.service';
import { HealthModule } from './modules/health/health.module';

/**
 * VALIDATION DES VARIABLES D'ENVIRONNEMENT
 *
 * Valide les variables d'environnement AVANT de démarrer l'application.
 * Si une variable requise est manquante ou invalide, l'application crash
 * avec un message d'erreur clair.
 */
validateEnv();

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
  // CONFIGURATION DU LOGGER STRUCTURÉ (PINO)
  // ============================================
  /**
   * Configuration du logger structuré Pino pour tous les logs NestJS.
   * - Format JSON en production pour parsing facile
   * - Format lisible en développement (pino-pretty)
   * - Inclusion automatique du requestId dans tous les logs
   * - Filtrage automatique des secrets
   */
  const pinoLogger = new PinoLoggerService();
  app.useLogger(pinoLogger);

  // Logger structuré pour le bootstrap (utilise aussi Pino)
  const logger = pinoLogger;

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
  // ROUTES HEALTH SANS PRÉFIXE (AVANT CORS pour éviter les blocages)
  // ============================================
  /**
   * Routes health accessibles directement sans préfixe /api/v1
   * Créées AVANT CORS pour permettre les health checks sans origin header
   * pour faciliter l'intégration avec les orchestrateurs (PM2, Kubernetes, Nginx, etc.)
   */
  const healthModule = app.select(HealthModule);
  const healthService = healthModule.get(HealthService, { strict: false });

  app.getHttpAdapter().get('/health', (req, res) => {
    try {
      const response = healthService.getHealth();
      res.json(response);
    } catch (error: any) {
      logger.error('Health check error', error?.stack, 'HealthCheck');
      res.status(500).json({ status: 'error', message: 'Health check failed' });
    }
  });

  app.getHttpAdapter().get('/health/ready', async (req, res) => {
    try {
      const response = await healthService.getReady();
      // Retourner 503 si non ready, 200 si ready
      const statusCode = response.status === 'ready' ? 200 : 503;
      res.status(statusCode).json(response);
    } catch (error: any) {
      logger.error('Readiness check error', error?.stack, 'HealthCheck');
      res.status(500).json({ status: 'error', message: 'Readiness check failed' });
    }
  });

  // ============================================
  // MIDDLEWARE REQUEST ID
  // ============================================
  /**
   * Middleware RequestId génère un UUID unique pour chaque requête HTTP.
   * Permet de tracer toutes les opérations liées à une même requête dans les logs.
   *
   * - Génère un UUID si le header X-Request-Id est absent
   * - Utilise le header X-Request-Id existant s'il est présent
   * - Ajoute X-Request-Id dans la réponse HTTP
   * - Attache requestId à req pour utilisation dans les services/intercepteurs
   */
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

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
   * - Les routes /health et /health/ready bypassent CORS (créées avant)
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

  // CORS conditionnel : appliquer seulement pour les routes qui ne sont pas /health
  app.use((req, res, next) => {
    // Skip CORS pour les routes health (elles sont accessibles publiquement)
    // Supporte à la fois /health et /api/v1/health pour compatibilité
    if (
      req.path === '/health' ||
      req.path === '/health/ready' ||
      req.path === '/api/v1/health' ||
      req.path === '/api/v1/health/ready'
    ) {
      return next();
    }
    // Appliquer CORS pour les autres routes
    return cors({
      origin: (origin, callback) => {
        // En production, rejeter les requêtes sans origin (protection renforcée)
        // En dev, autoriser pour faciliter le développement avec Postman/curl
        if (!origin) {
          if (isProduction) {
            logger.warn('[CORS] Requête sans origin rejetée en production', 'CORS');
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
        logger.warn(
          `[CORS] Origine rejetée: ${origin.substring(0, 50)}... (whitelist: ${allowedOrigins.length} origin(s))`,
          'CORS',
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
    })(req, res, next);
  });

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
  // INTERCEPTEUR DE LOGGING HTTP
  // ============================================
  /**
   * L'intercepteur de logging HTTP enregistre toutes les requêtes HTTP avec:
   * - RequestId unique pour tracer la requête
   * - Méthode HTTP, route, code de statut
   * - Durée de traitement en millisecondes
   * - UserId si l'utilisateur est authentifié
   * - Niveaux: info (2xx, 3xx), warn (4xx), error (5xx)
   * - Format JSON structuré en production
   *
   * Utile pour le débogage et le monitoring en production.
   */
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  // ============================================
  // FILTRE GLOBAL D'EXCEPTION
  // ============================================
  /**
   * Le filtre global d'exception intercepte toutes les exceptions et les formate:
   * - Format standardisé (statusCode, error, message, path, timestamp, requestId)
   * - Gestion des erreurs Prisma (P2002 → 409, P2025 → 404, etc.)
   * - Gestion des HttpException de NestJS
   * - Pas de stacktrace exposée en production (uniquement en dev)
   * - Messages utilisateur-friendly pour toutes les erreurs
   * - Détails techniques loggés mais jamais exposés au client
   *
   * SÉCURITÉ:
   * - Ne jamais exposer les stacktraces en production
   * - Ne jamais exposer les messages d'erreur techniques en production
   * - Tous les détails techniques sont dans les logs uniquement
   */
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // ============================================
  // PRÉFIXE GLOBAL DE L'API
  // ============================================
  // NOTE: Les routes /health sont créées AVANT ce préfixe (ligne 122), donc elles sont accessibles sans /api/v1
  /**
   * Toutes les routes de l'API commenceront par /api/v1
   * Exemple: /api/v1/users, /api/v1/items, etc.
   *
   * Le "v1" permet de versionner l'API pour faciliter les mises à jour futures.
   *
   * NOTE: Les routes /health et /health/ready sont accessibles
   * directement sans préfixe grâce aux routes Express définies ci-dessus.
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
   * Affichage de messages informatifs pour confirmer le démarrage
   */
  logger.log(`🚀 Backend démarré sur le port ${port}`, 'Bootstrap');
  logger.log(`📚 API disponible sur http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.log(
    `🔒 CORS configuré pour ${allowedOrigins.length} origine(s): ${allowedOrigins.join(', ')}`,
    'Bootstrap',
  );
  logger.log(`🍪 Cookie-parser activé pour auth httpOnly`, 'Bootstrap');
}

// ============================================
// LANCEMENT DE L'APPLICATION
// ============================================
/**
 * Appel de la fonction bootstrap() pour démarrer l'application
 * Cette ligne est exécutée quand le fichier est chargé par Node.js
 */
bootstrap();

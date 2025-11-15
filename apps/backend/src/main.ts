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
  // CONFIGURATION CORS (Cross-Origin Resource Sharing)
  // ============================================
  /**
   * CORS permet au frontend (qui tourne sur un autre port) de faire des requêtes
   * vers le backend. Sans CORS, le navigateur bloquerait ces requêtes.
   *
   * origin: l'URL du frontend autorisée (ex: http://localhost:3000)
   * credentials: true permet d'envoyer les cookies et tokens d'authentification
   */
  const corsOrigin = configService.get<string>('app.corsOrigin');
  app.use(
    cors({
      origin: corsOrigin, // URL du frontend autorisée
      credentials: true, // Autorise l'envoi de cookies/tokens
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
  console.log(`🔒 CORS configuré pour: ${corsOrigin}`);
}

// ============================================
// LANCEMENT DE L'APPLICATION
// ============================================
/**
 * Appel de la fonction bootstrap() pour démarrer l'application
 * Cette ligne est exécutée quand le fichier est chargé par Node.js
 */
bootstrap();

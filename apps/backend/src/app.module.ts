/**
 * FICHIER: app.module.ts
 *
 * DESCRIPTION:
 * Ce fichier est le module racine de l'application NestJS.
 * Il importe et configure tous les modules de l'application (auth, users, items, etc.).
 * C'est le point central qui assemble toutes les fonctionnalités de l'application.
 *
 * ARCHITECTURE NESTJS:
 * - Un module NestJS regroupe des fonctionnalités liées (controllers, services, etc.)
 * - Les modules peuvent importer d'autres modules pour utiliser leurs fonctionnalités
 * - AppModule est le module principal qui importe tous les autres
 */

// Import du décorateur Module: permet de définir un module NestJS
import { Module } from '@nestjs/common';

// Import de ConfigModule: gère les variables d'environnement et la configuration
import { ConfigModule } from '@nestjs/config';

// Import de ThrottlerModule: module pour le rate limiting (limitation des requêtes)
import { ThrottlerModule } from '@nestjs/throttler';

// Import des modules métier de l'application
import { PrismaModule } from './common/prisma/prisma.module'; // Module pour la base de données
import { RedisModule } from './common/redis/redis.module'; // Module Redis pour cache et rate limiting
import { AuthModule } from './modules/auth/auth.module'; // Authentification JWT
import { UsersModule } from './modules/users/users.module'; // Gestion des utilisateurs
import { ProfilesModule } from './modules/profiles/profiles.module'; // Profils utilisateurs
import { ExchangesModule } from './modules/exchanges/exchanges.module'; // Système d'échanges
import { ItemsModule } from './modules/items/items.module'; // Gestion des objets
import { ThemesModule } from './modules/themes/themes.module'; // Thèmes hebdomadaires
import { SuggestionsModule } from './modules/suggestions/suggestions.module'; // Suggestions IA
import { SchedulerModule } from './modules/scheduler/scheduler.module'; // Tâches planifiées (cron)
import { MatchingModule } from './modules/matching/matching.module'; // Algorithme de matching
import { EcoModule } from './modules/eco/eco.module'; // Contenu écologique
import { CommunityModule } from './modules/community/community.module'; // Communauté (forums)
import { NotificationsModule } from './modules/notifications/notifications.module'; // Notifications
import { AdminModule } from './modules/admin/admin.module'; // Administration
import { SecurityModule } from './modules/security/security.module'; // Sécurité (CSRF)
import { HealthModule } from './modules/health/health.module'; // Health checks
import { UploadsModule } from './modules/uploads/uploads.module'; // Uploads Cloudinary sécurisés
import { ReportsModule } from './modules/reports/reports.module'; // Signalements utilisateurs

// Import des fichiers de configuration
import appConfig from './config/app.config'; // Configuration générale de l'app
import securityConfig from './config/security.config'; // Configuration de sécurité
import prismaConfig from './config/prisma.config'; // Configuration de la base de données

/**
 * DÉCORATEUR @Module
 *
 * Définit AppModule comme le module racine de l'application.
 * Tous les imports listés ici seront disponibles dans toute l'application.
 */
@Module({
  // ============================================
  // IMPORTS: Modules et configurations importés
  // ============================================
  imports: [
    // ============================================
    // CONFIGURATION GLOBALE
    // ============================================
    /**
     * ConfigModule charge les variables d'environnement depuis les fichiers .env
     * isGlobal: true rend la configuration accessible partout dans l'application
     * load: charge les configurations personnalisées (app, security, prisma)
     * envFilePath: ordre de priorité des fichiers .env (local d'abord, puis .env)
     */
    ConfigModule.forRoot({
      isGlobal: true, // Disponible dans tous les modules sans réimporter
      load: [appConfig, securityConfig, prismaConfig], // Charge les configs personnalisées
      // Note: Le .env à la racine est déjà chargé dans main.ts avant cette étape
      // Ici on garde les chemins locaux pour compatibilité
      envFilePath: [
        '.env.local', // Fichier local prioritaire (si existe dans apps/backend/)
        '.env', // Fichier dans apps/backend/ (si existe)
      ], // Fichiers .env à lire (ordre de priorité)
    }),

    // ============================================
    // RATE LIMITING (Protection contre les abus)
    // ============================================
    /**
     * ThrottlerModule limite le nombre de requêtes par IP pour protéger l'API
     * contre les attaques par déni de service (DDoS) et les abus.
     *
     * Limites par endpoint:
     * - default: 100 requêtes par minute (limite générale)
     * - login: 10 tentatives de connexion par minute (protection contre brute force)
     * - admin-login: 5 tentatives de connexion admin par minute (strict)
     * - refresh: 20 rafraîchissements de token par minute
     * - ai: 10 requêtes IA par minute (économie de coûts API)
     * - upload: 20 uploads par minute
     * - recommendations: 10 recommandations par minute (limite pour l'IA)
     */
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000, // Time To Live: 1 minute (60 secondes * 1000 millisecondes)
        limit: 100, // Maximum 100 requêtes par minute
      },
      {
        name: 'login',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // Maximum 10 tentatives de connexion par minute (sécurité)
      },
      {
        name: 'admin-login',
        ttl: 60 * 1000, // 1 minute
        limit: 5, // Maximum 5 tentatives de connexion admin par minute (strict)
      },
      {
        name: 'refresh',
        ttl: 60 * 1000, // 1 minute
        limit: 20, // Maximum 20 rafraîchissements de token par minute
      },
      {
        name: 'ai',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // Maximum 10 requêtes IA par minute (économie de coûts API)
      },
      {
        name: 'upload',
        ttl: 60 * 1000, // 1 minute
        limit: 20, // Maximum 20 uploads par minute
      },
      {
        name: 'recommendations',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // Maximum 10 recommandations IA par minute (économie de coûts API)
      },
    ]),

    // ============================================
    // BASE DE DONNÉES
    // ============================================
    /**
     * PrismaModule fournit l'accès à la base de données PostgreSQL
     * via Prisma ORM (Object-Relational Mapping).
     * Tous les autres modules peuvent utiliser PrismaService pour interroger la DB.
     */
    PrismaModule,

    // ============================================
    // REDIS (Cache et Rate Limiting)
    // ============================================
    /**
     * RedisModule fournit l'accès à Redis pour:
     * - Cache des données fréquemment accédées
     * - Stockage des tentatives de login (anti-bruteforce)
     * - Rate limiting distribué
     */
    RedisModule,

    // ============================================
    // MODULES MÉTIER (Fonctionnalités de l'application)
    // ============================================
    /**
     * Chaque module gère une fonctionnalité spécifique de l'application:
     *
     * AuthModule: Authentification JWT (login, register, refresh token)
     * UsersModule: Gestion des utilisateurs (CRUD)
     * ProfilesModule: Profils utilisateurs (avatar, bio, préférences)
     * ExchangesModule: Système d'échanges d'objets (création, suivi, chat)
     * ItemsModule: Gestion des objets à échanger (CRUD, photos, catégories)
     * ThemesModule: Thèmes hebdomadaires générés par l'IA
     * SuggestionsModule: Suggestions d'objets basées sur les thèmes
     * SchedulerModule: Tâches planifiées (génération automatique de thèmes)
     * MatchingModule: Algorithme de matching entre utilisateurs
     * EcoModule: Contenu écologique et éducatif
     * CommunityModule: Forums et discussions communautaires
     * NotificationsModule: Notifications push et in-app
     */
    AuthModule,
    UsersModule,
    ProfilesModule,
    ExchangesModule,
    ItemsModule,
    ThemesModule,
    SuggestionsModule,
    SchedulerModule,
    MatchingModule,
    EcoModule,
    CommunityModule,
    NotificationsModule,
    AdminModule,
    SecurityModule,
    HealthModule,
    UploadsModule,
    ReportsModule,
  ],
})
/**
 * EXPORT DE LA CLASSE AppModule
 *
 * Cette classe est exportée pour être utilisée dans main.ts
 * pour créer l'application NestJS.
 */
export class AppModule {}

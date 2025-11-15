/**
 * FICHIER: prisma.service.ts
 *
 * DESCRIPTION:
 * Ce service est le service principal pour interagir avec la base de données PostgreSQL
 * via Prisma ORM. Il étend PrismaClient et gère la connexion à la base de données.
 *
 * FONCTIONNALITÉS:
 * - Gestion de la connexion à PostgreSQL
 * - Gestion des erreurs de connexion (P1010)
 * - Logging des erreurs et avertissements
 * - Connexion lazy (se connecte seulement quand nécessaire)
 * - Déconnexion propre à l'arrêt de l'application
 */

// Import des décorateurs et interfaces NestJS
import {
  Injectable, // Décorateur pour créer un service injectable
  OnModuleInit, // Interface pour exécuter du code au démarrage du module
  OnModuleDestroy, // Interface pour exécuter du code à l'arrêt du module
  Logger, // Service de logging intégré à NestJS
} from '@nestjs/common';

// Import du client Prisma (généré automatiquement par Prisma)
import { PrismaClient } from '@prisma/client';

/**
 * SERVICE: PrismaService
 *
 * Ce service étend PrismaClient pour ajouter des fonctionnalités spécifiques:
 * - Gestion du cycle de vie (démarrage/arrêt)
 * - Gestion des erreurs personnalisées
 * - Logging amélioré
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Logger pour enregistrer les messages (erreurs, warnings, infos)
  private readonly logger = new Logger(PrismaService.name);

  /**
   * CONSTRUCTEUR
   *
   * Initialise PrismaClient avec une configuration personnalisée
   */
  constructor() {
    // Appel du constructeur parent (PrismaClient) avec configuration
    super({
      // Logging: enregistrer seulement les erreurs et avertissements
      log: ['error', 'warn'],

      // Format d'erreur minimal (plus lisible)
      errorFormat: 'minimal',

      // Configuration de la source de données
      datasources: {
        db: {
          // URL de connexion depuis les variables d'environnement
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Configuration de la gestion des erreurs personnalisée
    this.setupErrorHandling();
  }

  // ============================================
  // GESTION DES ERREURS PERSONNALISÉE
  // ============================================

  /**
   * Configure la gestion des erreurs pour intercepter les erreurs Prisma
   * L'erreur P1010 se produit quand Prisma ne peut pas se connecter à la base de données
   * (permissions, base inexistante, etc.)
   */
  private setupErrorHandling() {
    // Sauvegarder la méthode originale $queryRaw de Prisma
    const originalQuery = (this as any).$queryRaw;

    if (originalQuery) {
      // Remplacer $queryRaw par une version qui intercepte les erreurs
      (this as any).$queryRaw = async (...args: any[]) => {
        try {
          // Exécuter la requête originale
          return await originalQuery.apply(this, args);
        } catch (error: any) {
          // Si c'est une erreur P1010 (connexion impossible)
          if (error.code === 'P1010') {
            // Logger l'erreur avec un message clair
            this.logger.error(`❌ Erreur Prisma P1010: ${error.message}`);

            // Lancer une erreur plus compréhensible
            throw new Error(
              `Erreur de connexion à la base de données: ${error.message}`,
            );
          }
          // Pour les autres erreurs, les propager telles quelles
          throw error;
        }
      };
    }
  }

  // ============================================
  // CYCLE DE VIE: INITIALISATION
  // ============================================

  /**
   * Méthode appelée automatiquement quand le module NestJS démarre
   * On utilise une connexion "lazy" (paresseuse):
   * - Prisma ne se connecte pas immédiatement
   * - La connexion se fait automatiquement au premier usage
   * - Cela évite de bloquer le démarrage de l'application
   */
  async onModuleInit() {
    // Connexion lazy - Prisma se connectera automatiquement au premier usage
    // Ne pas appeler $connect() ici pour éviter de bloquer le démarrage
    this.logger.log('⏳ Prisma initialisé - connexion lazy activée');
    this.logger.warn(
      '⚠️  Note: Si vous voyez des erreurs P1010, vérifiez les permissions PostgreSQL',
    );
  }

  // ============================================
  // CYCLE DE VIE: DESTRUCTION
  // ============================================

  /**
   * Méthode appelée automatiquement quand le module NestJS s'arrête
   * Ferme proprement la connexion à la base de données
   */
  async onModuleDestroy() {
    try {
      // Déconnecter Prisma de la base de données
      await this.$disconnect();
    } catch (error) {
      // Ignorer les erreurs de déconnexion (l'application s'arrête de toute façon)
    }
  }
}

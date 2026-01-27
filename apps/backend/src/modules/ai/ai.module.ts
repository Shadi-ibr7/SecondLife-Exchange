/**
 * FICHIER: ai.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités liées à l'intelligence artificielle.
 * Il intègre Google Gemini API pour l'analyse et la génération de contenu.
 *
 * COMPOSANTS:
 * - GeminiService: Service pour interagir avec l'API Google Gemini
 * - AiController: Endpoints pour les suggestions IA
 *
 * FONCTIONNALITÉS:
 * - Analyse automatique des items (catégorisation, tags, résumé)
 * - Génération de suggestions d'objets basées sur les thèmes
 * - Génération de contenu écologique
 * - Suggestions IA pour la création d'items (quota 3/jour)
 *
 * DÉPENDANCES:
 * - ConfigModule: Configuration de l'API Gemini (clé API, modèle, etc.)
 * - PrismaModule: Accès base de données pour le tracking des quotas
 */

// Import des modules NestJS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import du controller
import { AiItemsController } from './ai.controller';

// Import du service
import { GeminiService } from './gemini.service';

// Import de la configuration
import aiConfig from '../../config/ai.config';

// Import de Prisma
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * MODULE: AiModule
 *
 * Module pour l'intégration avec l'API Google Gemini.
 */
@Module({
  // Modules importés nécessaires
  imports: [
    ConfigModule.forFeature(aiConfig), // Configuration de l'API Gemini
    PrismaModule, // Accès base de données pour le quota
  ],

  // Controllers exposant les endpoints
  controllers: [AiItemsController],

  // Services fournis par ce module
  providers: [GeminiService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [GeminiService],
})
export class AiModule {}

/**
 * FICHIER: ai.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités liées à l'intelligence artificielle.
 * Il intègre Google Gemini API pour l'analyse et la génération de contenu.
 *
 * COMPOSANTS:
 * - GeminiService: Service pour interagir avec l'API Google Gemini
 *
 * FONCTIONNALITÉS:
 * - Analyse automatique des items (catégorisation, tags, résumé)
 * - Génération de suggestions d'objets basées sur les thèmes
 * - Génération de contenu écologique
 *
 * DÉPENDANCES:
 * - ConfigModule: Configuration de l'API Gemini (clé API, modèle, etc.)
 */

// Import des modules NestJS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import du service
import { GeminiService } from './gemini.service';

// Import de la configuration
import aiConfig from '../../config/ai.config';

/**
 * MODULE: AiModule
 *
 * Module pour l'intégration avec l'API Google Gemini.
 */
@Module({
  // Modules importés nécessaires
  imports: [ConfigModule.forFeature(aiConfig)], // Configuration de l'API Gemini

  // Services fournis par ce module
  providers: [GeminiService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [GeminiService],
})
export class AiModule {}

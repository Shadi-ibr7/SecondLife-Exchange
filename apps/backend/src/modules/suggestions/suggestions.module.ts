/**
 * FICHIER: suggestions.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités liées aux suggestions d'objets.
 * Les suggestions sont générées par l'IA et associées aux thèmes hebdomadaires.
 *
 * COMPOSANTS:
 * - SuggestionsController: Routes HTTP pour récupérer les suggestions
 * - SuggestionsService: Logique métier pour la génération et gestion des suggestions
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 * - AiModule: Service Gemini pour générer les suggestions
 * - ConfigModule: Configuration du scheduler (limites de diversité)
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import scheduleConfig from '../../config/schedule.config';

/**
 * MODULE: SuggestionsModule
 *
 * Module pour la gestion des suggestions d'objets.
 */
@Module({
  // Modules importés nécessaires
  imports: [
    PrismaModule, // Accès à la base de données
    AiModule, // Service Gemini pour générer les suggestions
    ConfigModule.forFeature(scheduleConfig), // Configuration du scheduler
  ],

  // Contrôleur qui expose les routes HTTP
  controllers: [SuggestionsController],

  // Services fournis par ce module
  providers: [SuggestionsService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [SuggestionsService],
})
export class SuggestionsModule {}

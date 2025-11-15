/**
 * FICHIER: scheduler.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités de tâches planifiées (cron jobs).
 * Il configure le module ScheduleModule et les services de cron.
 *
 * COMPOSANTS:
 * - WeeklyCronService: Service pour les tâches cron hebdomadaires
 * - AiController: Contrôleur pour déclencher manuellement la génération
 *
 * DÉPENDANCES:
 * - ScheduleModule: Module NestJS pour les tâches planifiées
 * - ThemesModule: Pour gérer les thèmes
 * - SuggestionsModule: Pour générer les suggestions
 * - AiModule: Pour l'intégration avec Gemini
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import du module de scheduling
import { ScheduleModule } from '@nestjs/schedule';

// Import des composants du module
import { WeeklyCronService } from './weekly-cron.service';
import { AiController } from './ai.controller';

// Import des modules dépendants
import { ThemesModule } from '../themes/themes.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';
import { AiModule } from '../ai/ai.module';

/**
 * MODULE: SchedulerModule
 *
 * Module pour les tâches planifiées (cron jobs).
 */
@Module({
  // Modules importés nécessaires
  imports: [
    ScheduleModule.forRoot(), // Initialise le module de scheduling
    ThemesModule, // Pour gérer les thèmes
    SuggestionsModule, // Pour générer les suggestions
    AiModule, // Pour l'intégration avec Gemini
  ],

  // Contrôleur qui expose les routes HTTP
  controllers: [AiController],

  // Services fournis par ce module
  providers: [WeeklyCronService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [WeeklyCronService],
})
export class SchedulerModule {}

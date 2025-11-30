/**
 * FICHIER: themes.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe toutes les fonctionnalités liées aux thèmes hebdomadaires.
 * Les thèmes sont générés par l'IA et proposent des idées d'objets à échanger.
 *
 * COMPOSANTS:
 * - ThemesController: Routes HTTP pour la gestion des thèmes
 * - ThemesService: Logique métier pour les thèmes
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { ThemesService } from './themes.service';
import { ThemesController } from './themes.controller';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { UnsplashModule } from '../unsplash/unsplash.module';

/**
 * MODULE: ThemesModule
 *
 * Module pour la gestion des thèmes hebdomadaires.
 */
@Module({
  // Modules importés nécessaires
  imports: [PrismaModule, AiModule, UnsplashModule], // Accès à la base de données, IA et Unsplash

  // Contrôleur qui expose les routes HTTP
  controllers: [ThemesController],

  // Services fournis par ce module
  providers: [ThemesService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [ThemesService],
})
export class ThemesModule {}

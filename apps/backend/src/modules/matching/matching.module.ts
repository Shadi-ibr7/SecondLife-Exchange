/**
 * FICHIER: matching.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités du système de recommandations.
 * Il gère les préférences utilisateur et génère des recommandations personnalisées.
 *
 * COMPOSANTS:
 * - MatchingController: Routes HTTP pour les recommandations et préférences
 * - MatchingService: Logique métier pour le système de recommandations
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * MODULE: MatchingModule
 *
 * Module pour le système de recommandations personnalisées.
 */
@Module({
  // Modules importés nécessaires
  imports: [PrismaModule], // Accès à la base de données

  // Contrôleur qui expose les routes HTTP
  controllers: [MatchingController],

  // Services fournis par ce module
  providers: [MatchingService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [MatchingService],
})
export class MatchingModule {}

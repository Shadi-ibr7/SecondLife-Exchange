/**
 * FICHIER: eco.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités de contenus éco-éducatifs.
 * Il gère les articles, vidéos et statistiques sur l'impact écologique.
 *
 * COMPOSANTS:
 * - EcoController: Routes HTTP pour les contenus éco
 * - EcoService: Logique métier pour les contenus éco
 * - GeminiService: Service IA pour l'enrichissement automatique de contenus
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 *
 * NOTE:
 * GeminiService est spécifique au module eco (différent de ai/gemini.service.ts).
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { EcoController } from './eco.controller';
import { EcoService } from './eco.service';
import { GeminiService } from './gemini.service';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * MODULE: EcoModule
 *
 * Module pour la gestion des contenus éco-éducatifs.
 */
@Module({
  // Modules importés nécessaires
  imports: [PrismaModule], // Accès à la base de données

  // Contrôleur qui expose les routes HTTP
  controllers: [EcoController],

  // Services fournis par ce module
  providers: [EcoService, GeminiService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [EcoService, GeminiService],
})
export class EcoModule {}

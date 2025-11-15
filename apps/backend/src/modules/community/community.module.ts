/**
 * FICHIER: community.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités de la communauté (threads et posts).
 * Il gère les discussions entre utilisateurs autour de différents sujets.
 *
 * COMPOSANTS:
 * - ThreadsController: Routes HTTP pour les threads
 * - PostsController: Routes HTTP pour les posts
 * - ThreadsService: Logique métier pour les threads
 * - PostsService: Logique métier pour les posts
 * - CommunityGateway: WebSocket pour les mises à jour en temps réel
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { ThreadsController } from './threads.controller';
import { PostsController } from './posts.controller';
import { ThreadsService } from './threads.service';
import { PostsService } from './posts.service';
import { CommunityGateway } from './community.gateway';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * MODULE: CommunityModule
 *
 * Module pour la gestion de la communauté (threads et posts).
 */
@Module({
  // Modules importés nécessaires
  imports: [PrismaModule], // Accès à la base de données

  // Contrôleurs qui exposent les routes HTTP
  controllers: [ThreadsController, PostsController],

  // Services fournis par ce module
  providers: [ThreadsService, PostsService, CommunityGateway],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [ThreadsService, PostsService, CommunityGateway],
})
export class CommunityModule {}

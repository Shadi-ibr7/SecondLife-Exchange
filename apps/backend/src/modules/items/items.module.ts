/**
 * FICHIER: items.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe toutes les fonctionnalités liées aux items (objets à échanger).
 * Il configure les services, contrôleurs et dépendances nécessaires.
 *
 * COMPOSANTS:
 * - ItemsController: Routes HTTP pour la gestion des items
 * - ItemsService: Logique métier pour les items
 * - UploadsService: Gestion de l'upload de photos vers Cloudinary
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 * - AiModule: Analyse IA des items (catégorisation automatique)
 * - ConfigModule: Configuration Cloudinary pour l'upload d'images
 */

// Import des modules NestJS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import des composants du module
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { UploadsService } from './uploads/uploads.service';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import cloudinaryConfig from '../../config/cloudinary.config';

/**
 * MODULE: ItemsModule
 *
 * Module pour la gestion des items et de l'upload de photos.
 */
@Module({
  // Modules importés nécessaires pour ce module
  imports: [
    PrismaModule, // Accès à la base de données
    AiModule, // Analyse IA des items
    ConfigModule.forFeature(cloudinaryConfig), // Configuration Cloudinary
  ],

  // Contrôleur qui expose les routes HTTP
  controllers: [ItemsController],

  // Services fournis par ce module
  providers: [ItemsService, UploadsService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [ItemsService, UploadsService],
})
export class ItemsModule {}

/**
 * FICHIER: uploads.module.ts
 *
 * DESCRIPTION:
 * Module NestJS pour la gestion des uploads Cloudinary sécurisés.
 * Fournit un contrôleur dédié pour générer des signatures d'upload.
 *
 * DÉPENDANCES:
 * - ItemsModule: Utilise UploadsService exporté depuis ItemsModule
 * - ConfigModule: Configuration Cloudinary
 */

// Import des modules NestJS
import { Module } from '@nestjs/common';

// Import du contrôleur
import { UploadsController } from './uploads.controller';

// Import du module ItemsModule pour utiliser UploadsService
import { ItemsModule } from '../items/items.module';

/**
 * MODULE: UploadsModule
 *
 * Module pour la gestion des uploads Cloudinary sécurisés.
 */
@Module({
  // Import du module ItemsModule pour accéder à UploadsService
  imports: [ItemsModule],

  // Contrôleur qui expose les routes HTTP
  controllers: [UploadsController],

  // Pas de providers car on utilise UploadsService depuis ItemsModule
})
export class UploadsModule {}

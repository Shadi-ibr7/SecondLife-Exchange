/**
 * FICHIER: profiles.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités liées aux profils utilisateurs.
 * Il exporte ProfilesService pour être utilisé dans d'autres modules.
 *
 * COMPOSANTS:
 * - ProfilesService: Logique métier pour les profils
 *
 * UTILISATION:
 * - Importé dans UsersModule pour gérer les profils lors des opérations utilisateurs
 * - Peut être utilisé directement par d'autres modules si nécessaire
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import du service
import { ProfilesService } from './profiles.service';

/**
 * MODULE: ProfilesModule
 *
 * Module pour la gestion des profils utilisateurs.
 */
@Module({
  // Service fourni par ce module
  providers: [ProfilesService],

  // Service exporté pour être utilisé dans d'autres modules
  exports: [ProfilesService],
})
export class ProfilesModule {}

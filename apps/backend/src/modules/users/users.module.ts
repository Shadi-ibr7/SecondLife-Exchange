/**
 * FICHIER: users.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe toutes les fonctionnalités liées aux utilisateurs.
 * Il expose les routes pour gérer le profil utilisateur.
 *
 * COMPOSANTS:
 * - UsersController: Routes HTTP pour la gestion du profil
 * - UsersService: Logique métier pour les utilisateurs
 *
 * EXPORTS:
 * - UsersService est exporté pour être utilisé dans d'autres modules si nécessaire
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * MODULE: UsersModule
 *
 * Module pour la gestion des utilisateurs.
 */
@Module({
  // Contrôleur qui expose les routes HTTP
  controllers: [UsersController],

  // Services fournis par ce module
  providers: [UsersService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [UsersService],
})
export class UsersModule {}

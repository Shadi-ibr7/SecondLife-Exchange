/**
 * FICHIER: notifications.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe les fonctionnalités de notifications push.
 * Il gère l'enregistrement de tokens et l'envoi de notifications.
 *
 * COMPOSANTS:
 * - NotificationsController: Routes HTTP pour les notifications
 * - NotificationsService: Logique métier pour les notifications
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 *
 * NOTE:
 * Le service inclut une tâche cron pour les rappels hebdomadaires de thèmes.
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Import des modules dépendants
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * MODULE: NotificationsModule
 *
 * Module pour la gestion des notifications push.
 */
@Module({
  // Modules importés nécessaires
  imports: [PrismaModule], // Accès à la base de données

  // Contrôleur qui expose les routes HTTP
  controllers: [NotificationsController],

  // Services fournis par ce module
  providers: [NotificationsService],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [NotificationsService],
})
export class NotificationsModule {}

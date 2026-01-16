/**
 * FICHIER: notifications.module.ts
 *
 * DESCRIPTION:
 * Module NestJS pour la gestion des notifications In-App et Push Web.
 *
 * FONCTIONNALITÉS:
 * - Notifications In-App (DB) avec CRUD
 * - Push Web avec VAPID
 * - Tokens FCM pour mobile (future)
 * - Cron pour rappels hebdomadaires
 *
 * DÉPENDANCES:
 * - PrismaModule: Accès à la base de données
 * - ConfigModule: Variables d'environnement VAPID
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule, // Pour VAPID keys
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Exporté pour être utilisé dans d'autres modules
})
export class NotificationsModule {}

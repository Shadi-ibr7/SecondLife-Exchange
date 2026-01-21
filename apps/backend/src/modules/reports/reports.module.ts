/**
 * FICHIER: reports.module.ts
 *
 * DESCRIPTION:
 * Module pour la gestion des signalements par les utilisateurs.
 */

import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}

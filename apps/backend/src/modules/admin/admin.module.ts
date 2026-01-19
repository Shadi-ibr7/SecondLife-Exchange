/**
 * FICHIER: admin.module.ts
 *
 * DESCRIPTION:
 * Module admin avec routes API fixes sur /admin.
 *
 * IMPORTANT:
 * - Routes API: /api/v1/admin/* (chemin fixe)
 * - ADMIN_BASE_PATH sert UNIQUEMENT au routing Next.js (UI)
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './services/audit.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdminJwtStrategy } from '../auth/strategies/admin-jwt.strategy';
import { AdminMiddleware } from './admin.middleware';
import { ThemesModule } from '../themes/themes.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, ConfigModule, ThemesModule, SuggestionsModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, AuditService, AdminJwtStrategy],
  exports: [AdminService, AuditService],
})
export class AdminModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // IMPORTANT: Utiliser un chemin fixe 'admin' pour les routes API
    // ADMIN_BASE_PATH sert UNIQUEMENT au routing Next.js (UI), pas aux appels API
    consumer
      .apply(AdminMiddleware)
      .forRoutes('admin/*');
  }
}


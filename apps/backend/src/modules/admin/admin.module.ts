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
    // IMPORTANT: AdminMiddleware désactivé car:
    // 1. Les tokens admin sont maintenant dans les cookies httpOnly (sl_access_token)
    // 2. Les guards AdminJwtGuard et AdminRoleGuard gèrent déjà l'authentification
    // 3. Le middleware vérifiait uniquement le header Authorization, ce qui bloquait les requêtes avec cookies
    // 
    // L'authentification est maintenant gérée par les guards sur chaque route du AdminController
    // qui retournent 401 (pas 404) si non authentifié
    
    // Middleware désactivé - laisser les guards gérer l'authentification
    // consumer
    //   .apply(AdminMiddleware)
    //   .forRoutes('admin/*');
  }
}


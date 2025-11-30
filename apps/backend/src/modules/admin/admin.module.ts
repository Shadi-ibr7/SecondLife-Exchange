/**
 * FICHIER: admin.module.ts
 *
 * DESCRIPTION:
 * Module admin avec routes secrètes basées sur ADMIN_BASE_PATH.
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdminJwtStrategy } from '../auth/strategies/admin-jwt.strategy';
import { AdminMiddleware } from './admin.middleware';
import { ThemesModule } from '../themes/themes.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';

@Module({
  imports: [PrismaModule, ConfigModule, ThemesModule, SuggestionsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy],
  exports: [AdminService],
})
export class AdminModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const adminBasePath = this.configService.get<string>('ADMIN_BASE_PATH') || 'admin';
    
    // Appliquer le middleware uniquement aux routes admin
    consumer
      .apply(AdminMiddleware)
      .forRoutes(`${adminBasePath}/*`);
  }
}


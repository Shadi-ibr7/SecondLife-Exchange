import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ExchangesModule } from './modules/exchanges/exchanges.module';
import { ItemsModule } from './modules/items/items.module';
import { ThemesModule } from './modules/themes/themes.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MatchingModule } from './modules/matching/matching.module';
import { EcoModule } from './modules/eco/eco.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import appConfig from './config/app.config';
import securityConfig from './config/security.config';
import prismaConfig from './config/prisma.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, securityConfig, prismaConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'login',
        ttl: 60 * 1000, // 1 minute
        limit: 5, // 5 login attempts per minute
      },
      {
        name: 'recommendations',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // 10 recommendations per minute
      },
    ]),

    // Base de données
    PrismaModule,

    // Modules métier
    AuthModule,
    UsersModule,
    ProfilesModule,
    ExchangesModule,
    ItemsModule,
    ThemesModule,
    SuggestionsModule,
    SchedulerModule,
    MatchingModule,
    EcoModule,
    CommunityModule,
    NotificationsModule,
  ],
})
export class AppModule {}

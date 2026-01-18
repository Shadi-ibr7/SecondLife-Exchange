/**
 * FICHIER: health.module.ts
 *
 * DESCRIPTION:
 * Module pour les health checks (/health et /ready).
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthNoPrefixController } from './health-no-prefix.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule],
  controllers: [HealthController, HealthNoPrefixController],
  providers: [HealthService],
})
export class HealthModule {}

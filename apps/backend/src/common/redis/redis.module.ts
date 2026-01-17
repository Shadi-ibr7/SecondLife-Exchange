/**
 * FICHIER: redis.module.ts
 *
 * DESCRIPTION:
 * Module NestJS pour gérer la connexion Redis.
 * Utilisé pour le cache, les sessions, et le rate limiting.
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

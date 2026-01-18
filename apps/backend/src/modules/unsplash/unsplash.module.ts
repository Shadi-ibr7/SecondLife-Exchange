/**
 * FICHIER: unsplash.module.ts
 *
 * DESCRIPTION:
 * Module pour l'intégration avec l'API Unsplash.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UnsplashService } from './unsplash.service';
import { UnsplashController } from './unsplash.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UnsplashController],
  providers: [UnsplashService],
  exports: [UnsplashService],
})
export class UnsplashModule {}


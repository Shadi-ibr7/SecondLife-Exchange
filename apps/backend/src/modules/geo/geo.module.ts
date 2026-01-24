/**
 * FICHIER: geo.module.ts
 *
 * DESCRIPTION:
 * Module NestJS pour les fonctionnalités de géolocalisation.
 * Fournit l'autocomplétion des villes via l'API Adresse Etalab.
 *
 * FONCTIONNALITÉS:
 * - Autocomplétion des communes françaises
 * - Cache mémoire pour réduire les appels API
 * - Rate limiting pour protéger le service
 */

import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}

/**
 * FICHIER: prisma.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS exporte PrismaService de manière globale.
 * Grâce au décorateur @Global(), PrismaService est disponible dans tous les modules
 * sans avoir besoin de l'importer explicitement.
 *
 * UTILISATION:
 * - Importé une seule fois dans AppModule
 * - Tous les autres modules peuvent utiliser PrismaService directement
 * - Pas besoin d'importer PrismaModule dans chaque module
 */

// Import des décorateurs NestJS
import { Global, Module } from '@nestjs/common';

// Import du service Prisma
import { PrismaService } from './prisma.service';

/**
 * MODULE: PrismaModule
 *
 * @Global(): Rend ce module global, ce qui signifie que PrismaService
 * sera disponible dans tous les modules de l'application sans import explicite.
 *
 * providers: Liste des services fournis par ce module (PrismaService)
 * exports: Liste des services exportés (disponibles pour les autres modules)
 */
@Global()
@Module({
  providers: [PrismaService], // PrismaService est créé et géré par NestJS
  exports: [PrismaService], // PrismaService est exporté pour être utilisé ailleurs
})
export class PrismaModule {}

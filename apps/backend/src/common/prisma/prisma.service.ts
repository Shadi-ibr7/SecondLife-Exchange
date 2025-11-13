import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Intercepter toutes les requêtes pour gérer les erreurs P1010
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    // Wrapper pour toutes les opérations Prisma
    const originalQuery = (this as any).$queryRaw;
    if (originalQuery) {
      (this as any).$queryRaw = async (...args: any[]) => {
        try {
          return await originalQuery.apply(this, args);
        } catch (error: any) {
          if (error.code === 'P1010') {
            this.logger.error(`❌ Erreur Prisma P1010: ${error.message}`);
            throw new Error(
              `Erreur de connexion à la base de données: ${error.message}`,
            );
          }
          throw error;
        }
      };
    }
  }

  async onModuleInit() {
    // Connexion lazy - Prisma se connectera automatiquement au premier usage
    // Ne pas appeler $connect() ici pour éviter de bloquer le démarrage
    this.logger.log('⏳ Prisma initialisé - connexion lazy activée');
    this.logger.warn(
      '⚠️  Note: Si vous voyez des erreurs P1010, vérifiez les permissions PostgreSQL',
    );
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      // Ignorer les erreurs de déconnexion
    }
  }
}

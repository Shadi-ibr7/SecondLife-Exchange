/**
 * FICHIER: health.service.ts
 *
 * DESCRIPTION:
 * Service pour les health checks. Vérifie l'état des services externes
 * (base de données, Redis, Cloudinary).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

export interface HealthResponse {
  status: 'ok' | 'error';
  uptime: number;
  version: string;
  timestamp: string;
}

export interface ReadyResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      message?: string;
    };
    redis?: {
      status: 'ok' | 'error' | 'disabled';
      message?: string;
    };
    cloudinary?: {
      status: 'ok' | 'error' | 'not_configured';
      message?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private readonly version: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Récupérer la version depuis package.json ou variable d'environnement
    // En prod, on peut utiliser une variable d'environnement pour la version
    this.version = process.env.APP_VERSION || '1.0.0';
  }

  /**
   * GET /health
   *
   * Vérifie que le process tourne.
   * Retourne toujours 200 si le serveur répond.
   *
   * Format standardisé: { status, uptime, version, timestamp }
   */
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // Uptime en secondes
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /ready
   *
   * Vérifie que tous les services requis sont disponibles.
   * Retourne 200 seulement si:
   * - DB est connectable (requis)
   * - Redis est disponible (optionnel, mais signalé)
   * - Cloudinary est configuré (optionnel, mais signalé)
   */
  async getReady(): Promise<ReadyResponse> {
    const checks: ReadyResponse['checks'] = {
      database: await this.checkDatabase(),
    };

    // Vérifier Redis (optionnel)
    const redisCheck = await this.checkRedis();
    if (redisCheck) {
      checks.redis = redisCheck;
    }

    // Vérifier Cloudinary (optionnel)
    const cloudinaryCheck = this.checkCloudinary();
    if (cloudinaryCheck) {
      checks.cloudinary = cloudinaryCheck;
    }

    // Déterminer le statut global
    const isReady =
      checks.database.status === 'ok' &&
      (!checks.redis || checks.redis.status === 'ok' || checks.redis.status === 'disabled');

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Vérifie la connexion à la base de données.
   * REQUIS: Si la DB n'est pas accessible, l'application n'est pas prête.
   */
  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      // Requête simple pour vérifier la connexion
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error: any) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'error',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Vérifie la connexion Redis.
   * OPTIONNEL: Si Redis n'est pas configuré ou indisponible, ce n'est pas bloquant.
   */
  private async checkRedis(): Promise<{
    status: 'ok' | 'error' | 'disabled';
    message?: string;
  } | null> {
    // Si Redis n'est pas configuré, ne pas inclure dans les checks
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return null; // Redis non configuré, ne pas inclure dans les checks
    }

    try {
      if (this.redis.isAvailable()) {
        // Tester la connexion avec un ping
        const client = this.redis.getClient();
        await client.ping();
        return { status: 'ok' };
      } else {
        return {
          status: 'error',
          message: 'Redis client not available',
        };
      }
    } catch (error: any) {
      this.logger.warn(`Redis health check failed: ${error.message}`);
      return {
        status: 'error',
        message: `Redis connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Vérifie la configuration Cloudinary.
   * OPTIONNEL: Si Cloudinary n'est pas configuré, ce n'est pas bloquant.
   */
  private checkCloudinary(): {
    status: 'ok' | 'error' | 'not_configured';
    message?: string;
  } | null {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    // Si Cloudinary n'est pas configuré du tout, ne pas inclure dans les checks
    if (!cloudName && !apiKey && !apiSecret) {
      return null; // Cloudinary non configuré, ne pas inclure dans les checks
    }

    // Vérifier que tous les paramètres requis sont présents
    if (cloudName && apiKey && apiSecret) {
      return { status: 'ok' };
    }

    // Configuration partielle (erreur)
    const missing = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');

    return {
      status: 'error',
      message: `Cloudinary configuration incomplete. Missing: ${missing.join(', ')}`,
    };
  }
}

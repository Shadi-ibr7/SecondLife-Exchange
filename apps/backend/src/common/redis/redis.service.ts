/**
 * FICHIER: redis.service.ts
 *
 * DESCRIPTION:
 * Service pour gérer la connexion Redis et fournir des méthodes utilitaires.
 * Utilisé pour le cache, les sessions, et le rate limiting.
 *
 * SÉCURITÉ:
 * - Gestion des erreurs de connexion
 * - Reconnexion automatique
 * - TTL natif pour les clés
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.warn('REDIS_URL non configuré, Redis désactivé');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        this.logger.log('Connexion Redis établie');
      });

      this.client.on('error', (error) => {
        this.logger.error(`Erreur Redis: ${error.message}`);
      });

      // Test de connexion
      await this.client.ping();
      this.logger.log('Redis prêt');
    } catch (error) {
      this.logger.error(`Échec de connexion Redis: ${error.message}`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Connexion Redis fermée');
    }
  }

  /**
   * Vérifie si Redis est disponible
   */
  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * Obtient le client Redis
   * @throws Error si Redis n'est pas disponible
   */
  getClient(): Redis {
    if (!this.isAvailable()) {
      throw new Error('Redis non disponible');
    }
    return this.client!;
  }

  /**
   * Incrémente une clé et définit un TTL
   */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('Redis non disponible');
    }

    const client = this.getClient();
    const count = await client.incr(key);
    
    // Définir TTL seulement si c'est la première fois (count === 1)
    if (count === 1) {
      await client.expire(key, ttlSeconds);
    }

    return count;
  }

  /**
   * Obtient la valeur d'une clé
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    return this.getClient().get(key);
  }

  /**
   * Définit une clé avec une valeur et un TTL
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Redis non disponible');
    }

    await this.getClient().setex(key, ttlSeconds, value);
  }

  /**
   * Supprime une clé
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    await this.getClient().del(key);
  }

  /**
   * Obtient le TTL restant d'une clé
   */
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -2; // Clé n'existe pas
    }

    return this.getClient().ttl(key);
  }
}

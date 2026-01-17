/**
 * FICHIER: login-attempt.service.ts
 *
 * DESCRIPTION:
 * Service pour gérer les tentatives de connexion et les blocages anti-bruteforce.
 *
 * FONCTIONNALITÉS:
 * - Compte les échecs de connexion par (email + IP) ou par email
 * - Bloque temporairement après 10 échecs (15 minutes)
 * - Ne révèle jamais si un email existe
 * - Logging sécurisé (email hashé, IP, userAgent partiel)
 *
 * SÉCURITÉ:
 * - Utilise Redis avec TTL automatique
 * - Fallback sur PostgreSQL si Redis indisponible
 * - Messages d'erreur génériques pour éviter l'enumeration
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/redis/redis.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import * as crypto from 'crypto';

interface LoginAttemptKey {
  emailKey: string; // Clé par email uniquement
  emailIpKey: string; // Clé par email + IP
}

interface BlockedInfo {
  isBlocked: boolean;
  remainingSeconds?: number;
}

@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);
  
  // Configuration
  private readonly maxAttempts = 10;
  private readonly blockDurationSeconds = 15 * 60; // 15 minutes
  private readonly attemptWindowSeconds = 15 * 60; // Fenêtre de 15 minutes pour compter les tentatives

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Génère les clés Redis/DB pour une tentative de login
   */
  private generateKeys(email: string, ip: string): LoginAttemptKey {
    // Normaliser l'email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Hasher l'email pour les clés (évite de stocker l'email en clair)
    const emailHash = crypto
      .createHash('sha256')
      .update(normalizedEmail)
      .digest('hex')
      .substring(0, 16); // 16 premiers caractères suffisent

    return {
      emailKey: `login:attempts:email:${emailHash}`,
      emailIpKey: `login:attempts:emailip:${emailHash}:${ip}`,
    };
  }

  /**
   * Hash partiel d'un email pour les logs (sécurité)
   */
  private hashEmailForLog(email: string): string {
    const normalized = email.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return `${normalized.substring(0, 2)}***${hash.substring(0, 8)}`;
  }

  /**
   * Vérifie si un email/IP est bloqué
   */
  async isBlocked(email: string, ip: string): Promise<BlockedInfo> {
    const keys = this.generateKeys(email, ip);

    // Essayer Redis d'abord
    if (this.redisService.isAvailable()) {
      try {
        const attempts = await this.redisService.get(keys.emailKey);
        if (attempts && parseInt(attempts) >= this.maxAttempts) {
          const ttl = await this.redisService.ttl(keys.emailKey);
          return {
            isBlocked: true,
            remainingSeconds: Math.max(0, ttl),
          };
        }
      } catch (error) {
        this.logger.warn(`Erreur Redis lors de la vérification de blocage: ${error.message}`);
      }
    }

    // Fallback sur PostgreSQL
    try {
      const cutoff = new Date(Date.now() - this.blockDurationSeconds * 1000);
      const attempts = await this.prisma.loginAttempt.count({
        where: {
          email: email.toLowerCase().trim(),
          createdAt: { gte: cutoff },
          blocked: true,
        },
      });

      if (attempts > 0) {
        // Trouver le dernier blocage pour calculer le temps restant
        const lastBlock = await this.prisma.loginAttempt.findFirst({
          where: {
            email: email.toLowerCase().trim(),
            blocked: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (lastBlock) {
          const elapsed = Math.floor(
            (Date.now() - lastBlock.createdAt.getTime()) / 1000,
          );
          const remaining = Math.max(0, this.blockDurationSeconds - elapsed);
          return {
            isBlocked: true,
            remainingSeconds: remaining,
          };
        }
      }
    } catch (error) {
      this.logger.error(`Erreur DB lors de la vérification de blocage: ${error.message}`);
    }

    return { isBlocked: false };
  }

  /**
   * Enregistre un échec de connexion
   */
  async recordFailure(
    email: string,
    ip: string,
    userAgent?: string,
  ): Promise<{ isBlocked: boolean; attempts: number; remainingSeconds?: number }> {
    const keys = this.generateKeys(email, ip);
    const normalizedEmail = email.toLowerCase().trim();
    let attempts = 0;
    let isBlocked = false;
    let remainingSeconds: number | undefined;

    // Essayer Redis d'abord
    if (this.redisService.isAvailable()) {
      try {
        attempts = await this.redisService.increment(
          keys.emailKey,
          this.attemptWindowSeconds,
        );

        if (attempts >= this.maxAttempts) {
          // Bloquer pour 15 minutes
          await this.redisService.set(
            keys.emailKey,
            attempts.toString(),
            this.blockDurationSeconds,
          );
          isBlocked = true;
          remainingSeconds = this.blockDurationSeconds;

          // Logger le blocage
          this.logSecurityEvent('BLOCKED', normalizedEmail, ip, userAgent, attempts);
        }
      } catch (error) {
        this.logger.warn(`Erreur Redis lors de l'enregistrement: ${error.message}`);
      }
    }

    // Fallback sur PostgreSQL
    if (!this.redisService.isAvailable() || attempts === 0) {
      try {
        // Créer ou mettre à jour l'enregistrement
        const cutoff = new Date(Date.now() - this.attemptWindowSeconds * 1000);
        
        // Compter les tentatives récentes
        const recentAttempts = await this.prisma.loginAttempt.count({
          where: {
            email: normalizedEmail,
            ip,
            createdAt: { gte: cutoff },
          },
        });

        attempts = recentAttempts + 1;

        // Créer la nouvelle tentative
        await this.prisma.loginAttempt.create({
          data: {
            email: normalizedEmail,
            ip,
            userAgent: userAgent?.substring(0, 200) || null, // Limiter la taille
            success: false,
            blocked: attempts >= this.maxAttempts,
          },
        });

        if (attempts >= this.maxAttempts) {
          isBlocked = true;
          remainingSeconds = this.blockDurationSeconds;
          this.logSecurityEvent('BLOCKED', normalizedEmail, ip, userAgent, attempts);
        }
      } catch (error) {
        this.logger.error(`Erreur DB lors de l'enregistrement: ${error.message}`);
      }
    }

    return { isBlocked, attempts, remainingSeconds };
  }

  /**
   * Réinitialise les tentatives après un login réussi
   */
  async recordSuccess(email: string, ip: string): Promise<void> {
    const keys = this.generateKeys(email, ip);
    const normalizedEmail = email.toLowerCase().trim();

    // Réinitialiser dans Redis
    if (this.redisService.isAvailable()) {
      try {
        await this.redisService.del(keys.emailKey);
        await this.redisService.del(keys.emailIpKey);
      } catch (error) {
        this.logger.warn(`Erreur Redis lors de la réinitialisation: ${error.message}`);
      }
    }

    // Enregistrer le succès dans la DB (pour audit)
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email: normalizedEmail,
          ip,
          success: true,
          blocked: false,
        },
      });
    } catch (error) {
      this.logger.error(`Erreur DB lors de l'enregistrement du succès: ${error.message}`);
    }
  }

  /**
   * Vérifie et lance une exception si bloqué
   */
  async checkAndThrowIfBlocked(email: string, ip: string): Promise<void> {
    const blocked = await this.isBlocked(email, ip);
    
    if (blocked.isBlocked) {
      const minutes = Math.ceil((blocked.remainingSeconds || 0) / 60);
      throw new ForbiddenException(
        `Trop de tentatives de connexion. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      );
    }
  }

  /**
   * Log un événement de sécurité
   */
  private logSecurityEvent(
    event: string,
    email: string,
    ip: string,
    userAgent?: string,
    attempts?: number,
  ): void {
    const emailHash = this.hashEmailForLog(email);
    const userAgentPartial = userAgent
      ? userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '')
      : 'unknown';

    this.logger.warn(
      `[SECURITY] ${event} - Email: ${emailHash} | IP: ${ip} | UserAgent: ${userAgentPartial} | Attempts: ${attempts || 'N/A'}`,
    );
  }
}

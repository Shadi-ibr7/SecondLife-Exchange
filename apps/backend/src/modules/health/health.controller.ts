/**
 * FICHIER: health.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de health check (/health et /ready).
 * Utilisé par les orchestrateurs (PM2, Kubernetes, Docker, etc.) pour vérifier
 * l'état de l'application.
 *
 * ENDPOINTS:
 * - GET /health: Vérifie que le process tourne (simple check)
 * - GET /ready: Vérifie que l'application est prête (DB, Redis, Cloudinary)
 */

import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthResponse, ReadyResponse } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /health
   *
   * Endpoint simple pour vérifier que le process tourne.
   * Retourne toujours 200 si le serveur répond.
   *
   * Utilisé par:
   * - PM2 (health check)
   * - Load balancers (vérification basique)
   * - Monitoring simple
   */
  @Get()
  @ApiOperation({ summary: 'Health check simple (process running)' })
  @ApiResponse({ status: 200, description: 'Application en cours d\'exécution' })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  /**
   * GET /ready
   *
   * Endpoint pour vérifier que l'application est prête à recevoir du trafic.
   * Vérifie:
   * - Connexion à la base de données (requis)
   * - Connexion Redis (optionnel, mais signalé si indisponible)
   * - Configuration Cloudinary (optionnel, mais signalé si manquant)
   *
   * Utilisé par:
   * - Kubernetes (readiness probe)
   * - Docker healthcheck
   * - Load balancers (vérification complète)
   *
   * Retourne 200 seulement si tous les services requis sont disponibles.
   * Retourne 503 si un service requis est indisponible.
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (services disponibles)' })
  @ApiResponse({ status: 200, description: 'Application prête à recevoir du trafic' })
  @ApiResponse({ status: 503, description: 'Service requis indisponible' })
  async getReady(@Res() res: Response): Promise<void> {
    const response = await this.healthService.getReady();
    const statusCode = response.status === 'ready' ? 200 : 503;
    res.status(statusCode).json(response);
  }
}

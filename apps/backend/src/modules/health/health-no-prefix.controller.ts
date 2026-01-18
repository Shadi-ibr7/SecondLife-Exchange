/**
 * FICHIER: health-no-prefix.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de health check SANS préfixe /api/v1.
 * Permet d'accéder aux health checks directement via /health et /health/ready
 * pour faciliter l'intégration avec les orchestrateurs (PM2, Kubernetes, Nginx, etc.)
 *
 * ENDPOINTS:
 * - GET /health: Vérifie que le process tourne (simple check)
 * - GET /health/ready: Vérifie que l'application est prête (DB, Redis, Cloudinary)
 */

import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthResponse, ReadyResponse } from './health.service';

@Controller() // Pas de préfixe, routes accessibles directement
export class HealthNoPrefixController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /health
   *
   * Endpoint simple pour vérifier que le process tourne.
   * Accessible directement sans préfixe /api/v1
   */
  @Get('health')
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  /**
   * GET /health/ready
   *
   * Endpoint pour vérifier que l'application est prête à recevoir du trafic.
   * Accessible directement sans préfixe /api/v1
   */
  @Get('health/ready')
  async getReady(): Promise<ReadyResponse> {
    return this.healthService.getReady();
  }
}

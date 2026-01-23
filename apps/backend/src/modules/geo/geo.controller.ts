/**
 * FICHIER: geo.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de géolocalisation.
 * Fournit l'autocomplétion des villes françaises via l'API Adresse Etalab.
 *
 * ROUTES:
 * - GET /api/v1/geo/cities?q=<query> - Recherche de villes avec autocomplétion
 *
 * SÉCURITÉ:
 * - Endpoint public (pas d'authentification requise)
 * - Rate limiting via ThrottlerGuard (protection contre les abus)
 * - Validation des paramètres via DTO
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { GeoService } from './geo.service';
import { SearchCitiesDto } from './dtos/search-cities.dto';
import { CitySuggestion } from './geo.types';

/**
 * CONTRÔLEUR: GeoController
 *
 * Contrôleur pour les opérations de géolocalisation.
 * Préfixe: /geo (donc les routes sont /api/v1/geo/...)
 */
@ApiTags('Geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  // ============================================
  // ROUTE: GET /geo/cities
  // ============================================

  /**
   * Recherche des villes françaises avec autocomplétion.
   *
   * UTILISATION:
   * - Champ de saisie "Ville" avec autocomplétion
   * - Retourne une liste de suggestions normalisées
   *
   * EXEMPLE:
   * GET /api/v1/geo/cities?q=Paris&limit=5
   *
   * RÉPONSE:
   * [
   *   {
   *     "label": "Paris (75000)",
   *     "city": "Paris",
   *     "postalCode": "75000",
   *     "department": "75",
   *     "region": "Île-de-France",
   *     "latitude": 48.8566,
   *     "longitude": 2.3522
   *   },
   *   ...
   * ]
   *
   * RATE LIMITING:
   * - 30 requêtes par minute par IP
   * - Évite les abus et protège l'API Etalab
   */
  @Get('cities')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requêtes par minute
  @ApiOperation({
    summary: 'Recherche de villes avec autocomplétion',
    description: 'Recherche des communes françaises via l\'API Adresse Etalab',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Terme de recherche (min 2 caractères)',
    example: 'Paris',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre maximum de résultats (1-20, défaut: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des suggestions de villes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', example: 'Paris (75000)' },
          city: { type: 'string', example: 'Paris' },
          postalCode: { type: 'string', example: '75000' },
          department: { type: 'string', example: '75' },
          region: { type: 'string', example: 'Île-de-France' },
          latitude: { type: 'number', example: 48.8566 },
          longitude: { type: 'number', example: 2.3522 },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides (query trop courte, limit hors limites)',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de requêtes (rate limit atteint)',
  })
  async searchCities(@Query() query: SearchCitiesDto): Promise<CitySuggestion[]> {
    return this.geoService.searchCities(query.q, query.limit);
  }
}

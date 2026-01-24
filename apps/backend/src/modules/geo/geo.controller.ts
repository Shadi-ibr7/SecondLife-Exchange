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

  // ============================================
  // ROUTE: GET /geo/regions
  // ============================================

  /**
   * Retourne la liste des régions françaises.
   *
   * COMPORTEMENT:
   * - Si fromDb=true, retourne uniquement les régions présentes dans les items de la DB
   * - Sinon, retourne la liste complète des régions françaises (par défaut)
   *
   * EXEMPLE:
   * GET /api/v1/geo/regions
   * GET /api/v1/geo/regions?fromDb=true
   */
  @Get('regions')
  @ApiOperation({
    summary: 'Liste des régions françaises',
    description: 'Retourne la liste des régions. Par défaut toutes les régions, ou seulement celles présentes en DB.',
  })
  @ApiQuery({
    name: 'fromDb',
    required: false,
    type: Boolean,
    description: 'Si true, retourne uniquement les régions ayant des items en DB',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des régions',
    schema: {
      type: 'array',
      items: { type: 'string', example: 'Île-de-France' },
    },
  })
  async getRegions(@Query('fromDb') fromDb?: string): Promise<string[]> {
    if (fromDb === 'true') {
      return this.geoService.getRegionsFromDB();
    }
    return this.geoService.getAllRegions();
  }

  // ============================================
  // ROUTE: GET /geo/departments
  // ============================================

  /**
   * Retourne la liste des départements français.
   *
   * COMPORTEMENT:
   * - Si region est spécifiée, filtre par cette région
   * - Si fromDb=true, retourne uniquement les départements présents dans les items de la DB
   * - Sinon, retourne la liste statique des départements (par défaut)
   *
   * EXEMPLE:
   * GET /api/v1/geo/departments
   * GET /api/v1/geo/departments?region=Île-de-France
   * GET /api/v1/geo/departments?region=Île-de-France&fromDb=true
   */
  @Get('departments')
  @ApiOperation({
    summary: 'Liste des départements français',
    description: 'Retourne la liste des départements. Peut être filtré par région.',
  })
  @ApiQuery({
    name: 'region',
    required: false,
    type: String,
    description: 'Filtrer par région',
    example: 'Île-de-France',
  })
  @ApiQuery({
    name: 'fromDb',
    required: false,
    type: Boolean,
    description: 'Si true, retourne uniquement les départements ayant des items en DB',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des départements',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', example: '75' },
          name: { type: 'string', example: 'Paris' },
        },
      },
    },
  })
  async getDepartments(
    @Query('region') region?: string,
    @Query('fromDb') fromDb?: string,
  ): Promise<{ code: string; name: string }[]> {
    if (fromDb === 'true') {
      return this.geoService.getDepartmentsFromDB(region);
    }
    if (region) {
      return this.geoService.getDepartmentsByRegion(region);
    }
    // Retourner tous les départements de toutes les régions
    const allRegions = this.geoService.getAllRegions();
    const allDepartments: { code: string; name: string }[] = [];
    for (const r of allRegions) {
      allDepartments.push(...this.geoService.getDepartmentsByRegion(r));
    }
    // Trier par code
    return allDepartments.sort((a, b) => a.code.localeCompare(b.code, 'fr'));
  }
}

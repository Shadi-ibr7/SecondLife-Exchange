/**
 * FICHIER: matching.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour le système de recommandations.
 * Toutes les routes nécessitent une authentification JWT.
 *
 * ROUTES:
 * - GET /api/v1/matching/recommendations - Récupérer les recommandations personnalisées
 * - POST /api/v1/matching/preferences - Sauvegarder les préférences de matching
 * - GET /api/v1/matching/preferences - Récupérer les préférences de matching
 *
 * SÉCURITÉ:
 * - Toutes les routes sont protégées par JwtAccessGuard
 * - Rate limiting sur les recommandations (10 requêtes par minute)
 * - L'ID de l'utilisateur est extrait automatiquement du token JWT
 */

// Import des décorateurs NestJS
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';

// Import des décorateurs Swagger
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

// Import du guard de rate limiting
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

// Import du service
import { MatchingService } from './matching.service';

// Import des DTOs
import { RecommendationsQueryDto } from './dtos/recommendations.dto';
import { SavePreferencesDto } from './dtos/preferences.dto';

// Import des guards et intercepteurs
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * CONTRÔLEUR: MatchingController
 *
 * Contrôleur pour le système de recommandations.
 * Toutes les routes nécessitent une authentification JWT.
 * Le préfixe 'matching' signifie que les routes commencent par /api/v1/matching
 */
@ApiTags('Matching')
@Controller('matching')
@UseGuards(JwtAccessGuard, ThrottlerGuard) // Protection globale: JWT + rate limiting
@UseInterceptors(LoggingInterceptor) // Logger toutes les requêtes
@ApiBearerAuth() // Indique que l'authentification Bearer est requise
export class MatchingController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service de matching
   */
  constructor(private readonly matchingService: MatchingService) {}

  // ============================================
  // ROUTE: GET /api/v1/matching/recommendations
  // ============================================

  /**
   * Endpoint pour récupérer les recommandations d'items personnalisées.
   *
   * FONCTIONNEMENT:
   * - Utilise les préférences de l'utilisateur pour calculer des scores
   * - Exclut les items déjà possédés ou déjà échangés
   * - Applique des filtres de diversité
   * - Retourne les meilleures recommandations avec scores et raisons
   *
   * @param req - La requête HTTP (contient req.user)
   * @param query - Paramètres de requête (limit)
   * @returns Recommandations avec scores et préférences utilisateur
   *
   * Code HTTP: 200 (OK)
   *
   * SÉCURITÉ:
   * - @Throttle: Limite à 10 requêtes par minute (protection contre abus)
   */
  @Get('recommendations')
  @Throttle({ recommendations: { limit: 10, ttl: 60000 } }) // 10 requêtes par minute
  @ApiOperation({
    summary: "Récupérer les recommandations d'items personnalisées",
    description:
      "Retourne une liste d'items recommandés basée sur les préférences de l'utilisateur et un algorithme de scoring",
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre maximum de recommandations (1-50, défaut: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Recommandations récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  condition: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  popularityScore: { type: 'number' },
                  owner: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      displayName: { type: 'string' },
                      avatarUrl: { type: 'string' },
                    },
                  },
                  photos: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        url: { type: 'string' },
                        width: { type: 'number' },
                        height: { type: 'number' },
                      },
                    },
                  },
                  createdAt: { type: 'string' },
                },
              },
              score: { type: 'number' },
              reasons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    score: { type: 'number' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        total: { type: 'number' },
        userPreferences: {
          type: 'object',
          properties: {
            preferredCategories: { type: 'array', items: { type: 'string' } },
            preferredConditions: { type: 'array', items: { type: 'string' } },
            country: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes' })
  async getRecommendations(
    @Request() req: any,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.matchingService.getRecommendations(req.user.id, query);
  }

  // ============================================
  // ROUTE: POST /api/v1/matching/preferences
  // ============================================

  /**
   * Endpoint pour sauvegarder les préférences de matching.
   *
   * PRÉFÉRENCES:
   * - preferredCategories: Catégories préférées
   * - dislikedCategories: Catégories détestées
   * - preferredConditions: États préférés (NEW, GOOD, etc.)
   * - locale: Langue préférée
   * - country: Pays préféré
   * - radiusKm: Rayon de recherche (kilomètres)
   *
   * @param req - La requête HTTP (contient req.user)
   * @param savePreferencesDto - Données des préférences
   * @returns Préférences sauvegardées
   *
   * Code HTTP: 200 (OK)
   */
  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sauvegarder les préférences de matching',
    description:
      "Crée ou met à jour les préférences de l'utilisateur pour le système de recommandations",
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences sauvegardées avec succès',
    schema: {
      type: 'object',
      properties: {
        preferences: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            preferredCategories: { type: 'array', items: { type: 'string' } },
            dislikedCategories: { type: 'array', items: { type: 'string' } },
            preferredConditions: { type: 'array', items: { type: 'string' } },
            locale: { type: 'string' },
            country: { type: 'string' },
            radiusKm: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async savePreferences(
    @Request() req: any,
    @Body() savePreferencesDto: SavePreferencesDto,
  ) {
    return this.matchingService.savePreferences(
      req.user.id,
      savePreferencesDto,
    );
  }

  // ============================================
  // ROUTE: GET /api/v1/matching/preferences
  // ============================================

  /**
   * Endpoint pour récupérer les préférences de matching de l'utilisateur.
   *
   * @param req - La requête HTTP (contient req.user)
   * @returns Préférences de l'utilisateur
   *
   * Code HTTP: 200 (OK)
   *
   * @throws NotFoundException si les préférences n'existent pas
   */
  @Get('preferences')
  @ApiOperation({
    summary: 'Récupérer les préférences de matching',
    description: "Retourne les préférences actuelles de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        preferences: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            preferredCategories: { type: 'array', items: { type: 'string' } },
            dislikedCategories: { type: 'array', items: { type: 'string' } },
            preferredConditions: { type: 'array', items: { type: 'string' } },
            locale: { type: 'string' },
            country: { type: 'string' },
            radiusKm: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Préférences non trouvées' })
  async getPreferences(@Request() req: any) {
    return this.matchingService.getPreferences(req.user.id);
  }
}

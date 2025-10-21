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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { MatchingService } from './matching.service';
import { RecommendationsQueryDto } from './dtos/recommendations.dto';
import { SavePreferencesDto } from './dtos/preferences.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@ApiTags('Matching')
@Controller('matching')
@UseGuards(JwtAccessGuard, ThrottlerGuard)
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('recommendations')
  @Throttle({ recommendations: { limit: 10, ttl: 60000 } })
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

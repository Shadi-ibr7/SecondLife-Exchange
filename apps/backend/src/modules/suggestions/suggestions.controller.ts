/**
 * FICHIER: suggestions.controller.ts
 * 
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour récupérer les suggestions d'objets.
 * Les suggestions sont associées aux thèmes hebdomadaires.
 * 
 * ROUTES:
 * - GET /api/v1/themes/:id/suggestions - Récupérer les suggestions d'un thème (public)
 * - GET /api/v1/themes/:id/suggestions/stats - Statistiques des suggestions (public)
 * 
 * NOTE:
 * Ce contrôleur est monté sur le préfixe 'themes' car les suggestions
 * sont toujours associées à un thème spécifique.
 */

// Import des décorateurs NestJS
import { Controller, Get, Param, Query } from '@nestjs/common';

// Import des décorateurs Swagger
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

// Import du service
import { SuggestionsService } from './suggestions.service';

/**
 * CONTRÔLEUR: SuggestionsController
 * 
 * Contrôleur pour la gestion des suggestions d'objets.
 * Monté sur le préfixe 'themes' car les suggestions sont liées aux thèmes.
 */
@ApiTags('Suggestions')
@Controller('themes')
export class SuggestionsController {
  /**
   * CONSTRUCTEUR
   * 
   * Injection du service de suggestions
   */
  constructor(private readonly suggestionsService: SuggestionsService) {}

  // ============================================
  // ROUTE: GET /api/v1/themes/:id/suggestions
  // ============================================
  
  /**
   * Endpoint pour récupérer les suggestions d'un thème avec pagination.
   * 
   * @param themeId - ID du thème
   * @param page - Numéro de page (défaut: 1)
   * @param limit - Nombre d'éléments par page (défaut: 20)
   * @param sort - Critère de tri (ex: -createdAt)
   * @returns Liste paginée de suggestions
   * 
   * Code HTTP: 200 (OK)
   * 
   * NOTE: Route publique, accessible sans authentification
   */
  @Get(':id/suggestions')
  @ApiOperation({ summary: "Récupérer les suggestions d'un thème" })
  @ApiResponse({
    status: 200,
    description: 'Suggestions récupérées avec succès',
  })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Éléments par page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Tri (ex: -createdAt)',
  })
  async getThemeSuggestions(
    @Param('id') themeId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ) {
    return this.suggestionsService.getThemeSuggestions(
      themeId,
      page,
      limit,
      sort,
    );
  }

  // ============================================
  // ROUTE: GET /api/v1/themes/:id/suggestions/stats
  // ============================================
  
  /**
   * Endpoint pour récupérer les statistiques des suggestions d'un thème.
   * 
   * @param themeId - ID du thème
   * @returns Statistiques (nombre total, par pays, par époque, etc.)
   * 
   * Code HTTP: 200 (OK)
   * 
   * NOTE: Route publique, accessible sans authentification
   */
  @Get(':id/suggestions/stats')
  @ApiOperation({
    summary: "Récupérer les statistiques des suggestions d'un thème",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async getThemeStats(@Param('id') themeId: string) {
    return this.suggestionsService.getThemeStats(themeId);
  }
}

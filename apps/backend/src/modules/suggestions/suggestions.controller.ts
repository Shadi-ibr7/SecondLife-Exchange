import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';

@ApiTags('Suggestions')
@Controller('api/v1')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get('themes/:id/suggestions')
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

  @Get('themes/:id/suggestions/stats')
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

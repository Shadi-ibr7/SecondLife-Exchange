/**
 * FICHIER: eco.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour la gestion des contenus éco-éducatifs.
 * Les routes de création/modification nécessitent une authentification JWT et des privilèges admin.
 *
 * ROUTES:
 * - GET /api/v1/eco - Lister les contenus (public)
 * - GET /api/v1/eco/stats - Statistiques des contenus (public)
 * - GET /api/v1/eco/tags - Tags populaires (public)
 * - GET /api/v1/eco/:id - Récupérer un contenu par ID (public)
 * - POST /api/v1/eco - Créer un contenu (admin)
 * - PATCH /api/v1/eco/:id - Mettre à jour un contenu (admin)
 * - DELETE /api/v1/eco/:id - Supprimer un contenu (admin)
 * - POST /api/v1/eco/:id/enrich - Enrichir un contenu avec IA (admin)
 *
 * SÉCURITÉ:
 * - Routes de création/modification nécessitent JwtAccessGuard + AdminGuard
 */

// Import des décorateurs NestJS
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
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
  ApiParam,
} from '@nestjs/swagger';

// Import du service
import { EcoService } from './eco.service';

// Import des DTOs
import {
  CreateEcoContentDto,
  UpdateEcoContentDto,
  ListEcoContentDto,
  EcoContentResponse,
  PaginatedEcoContentResponse,
  EnrichEcoContentResponse,
} from './dtos/eco-content.dto';

// Import des guards et intercepteurs
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * CONTRÔLEUR: EcoController
 *
 * Contrôleur pour la gestion des contenus éco-éducatifs.
 * Le préfixe 'eco' signifie que les routes commencent par /api/v1/eco
 */
@ApiTags('Eco Content')
@Controller('eco')
@UseInterceptors(LoggingInterceptor) // Logger toutes les requêtes
export class EcoController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service éco
   */
  constructor(private readonly ecoService: EcoService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les contenus éco-éducatifs',
    description:
      'Retourne une liste paginée de contenus éco-éducatifs avec filtres',
  })
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: ['ARTICLE', 'VIDEO', 'STAT'],
    description: 'Type de contenu',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    type: String,
    description: 'Filtrer par tag',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Filtrer par langue (fr, en, etc.)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Recherche textuelle',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des contenus éco-éducatifs',
  })
  async listEcoContent(
    @Query() query: ListEcoContentDto,
  ): Promise<PaginatedEcoContentResponse> {
    return this.ecoService.listEcoContent(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques des contenus éco',
    description: 'Retourne les statistiques des contenus éco-éducatifs',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des contenus',
  })
  async getEcoContentStats() {
    return this.ecoService.getEcoContentStats();
  }

  @Get('tags')
  @ApiOperation({
    summary: 'Tags populaires',
    description: 'Retourne la liste des tags les plus utilisés',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de tags à retourner (défaut: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tags populaires',
    type: [String],
  })
  async getPopularTags(@Query('limit') limit?: number): Promise<string[]> {
    return this.ecoService.getPopularTags(limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un contenu éco par ID',
    description: "Retourne les détails d'un contenu éco-éducatif",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contenu éco',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du contenu éco',
  })
  @ApiResponse({
    status: 404,
    description: 'Contenu éco non trouvé',
  })
  async getEcoContentById(
    @Param('id') id: string,
  ): Promise<EcoContentResponse> {
    return this.ecoService.getEcoContentById(id);
  }

  @Post()
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau contenu éco (Admin)',
    description: 'Crée un nouveau contenu éco-éducatif',
  })
  @ApiResponse({
    status: 201,
    description: 'Contenu éco créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (Admin requis)',
  })
  async createEcoContent(
    @Body() createEcoContentDto: CreateEcoContentDto,
  ): Promise<EcoContentResponse> {
    return this.ecoService.createEcoContent(createEcoContentDto);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mettre à jour un contenu éco (Admin)',
    description: 'Met à jour un contenu éco-éducatif existant',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contenu éco',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu éco mis à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (Admin requis)',
  })
  @ApiResponse({
    status: 404,
    description: 'Contenu éco non trouvé',
  })
  async updateEcoContent(
    @Param('id') id: string,
    @Body() updateEcoContentDto: UpdateEcoContentDto,
  ): Promise<EcoContentResponse> {
    return this.ecoService.updateEcoContent(id, updateEcoContentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un contenu éco (Admin)',
    description: 'Supprime un contenu éco-éducatif',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contenu éco',
  })
  @ApiResponse({
    status: 204,
    description: 'Contenu éco supprimé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (Admin requis)',
  })
  @ApiResponse({
    status: 404,
    description: 'Contenu éco non trouvé',
  })
  async deleteEcoContent(@Param('id') id: string): Promise<void> {
    return this.ecoService.deleteEcoContent(id);
  }

  @Post(':id/enrich')
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enrichir un contenu éco avec IA (Admin)',
    description:
      'Utilise Gemini pour enrichir un contenu avec résumé, tags et KPIs',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contenu éco',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu enrichi avec succès',
  })
  @ApiResponse({
    status: 400,
    description: "Échec de l'enrichissement",
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (Admin requis)',
  })
  @ApiResponse({
    status: 404,
    description: 'Contenu éco non trouvé',
  })
  async enrichEcoContent(
    @Param('id') id: string,
  ): Promise<EnrichEcoContentResponse> {
    return this.ecoService.enrichEcoContent(id);
  }
}

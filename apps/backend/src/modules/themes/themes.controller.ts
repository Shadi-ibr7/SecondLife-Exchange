/**
 * FICHIER: themes.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour la gestion des thèmes hebdomadaires.
 * Les routes de création/modification nécessitent une authentification JWT (admin).
 *
 * ROUTES:
 * - GET /api/v1/themes/active - Récupérer le thème actif (public)
 * - GET /api/v1/themes - Lister les thèmes avec pagination (public)
 * - GET /api/v1/themes/calendar - Calendrier des thèmes (public)
 * - GET /api/v1/themes/:id - Récupérer un thème par ID (public)
 * - POST /api/v1/themes - Créer un thème (admin)
 * - PATCH /api/v1/themes/:id - Mettre à jour un thème (admin)
 * - PATCH /api/v1/themes/:id/activate - Activer un thème (admin)
 * - DELETE /api/v1/themes/:id - Supprimer un thème (admin)
 *
 * SÉCURITÉ:
 * - Routes de création/modification nécessitent JwtAccessGuard
 * - Devrait également nécessiter AdminGuard (à ajouter si nécessaire)
 */

// Import des décorateurs NestJS
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

// Import des décorateurs Swagger
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

// Import du service
import { ThemesService } from './themes.service';

// Import des DTOs
import { CreateThemeDto } from './dtos/create-theme.dto';
import { UpdateThemeDto } from './dtos/update-theme.dto';

// Import des guards
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

/**
 * CONTRÔLEUR: ThemesController
 *
 * Contrôleur pour la gestion des thèmes hebdomadaires.
 * Le préfixe 'themes' signifie que les routes commencent par /api/v1/themes
 */
@ApiTags('Themes')
@Controller('themes')
export class ThemesController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service de thèmes
   */
  constructor(private readonly themesService: ThemesService) {}

  // ============================================
  // ROUTE: GET /api/v1/themes/active
  // ============================================

  /**
   * Endpoint pour récupérer le thème actuellement actif.
   *
   * @returns Thème actif avec ses suggestions, ou null si aucun thème n'est actif
   *
   * Code HTTP: 200 (OK)
   *
   * NOTE: Route publique, accessible sans authentification
   */
  @Get('active')
  @ApiOperation({ summary: 'Récupérer le thème actif' })
  @ApiResponse({ status: 200, description: 'Thème actif récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Aucun thème actif trouvé' })
  async getActiveTheme() {
    return this.themesService.getActiveTheme();
  }

  // ============================================
  // ROUTE: GET /api/v1/themes
  // ============================================

  /**
   * Endpoint pour lister les thèmes avec pagination et filtres de date.
   *
   * @param page - Numéro de page (défaut: 1)
   * @param limit - Nombre d'éléments par page (défaut: 20)
   * @param from - Date de début pour filtrer (ISO string)
   * @param to - Date de fin pour filtrer (ISO string)
   * @returns Liste paginée de thèmes
   *
   * Code HTTP: 200 (OK)
   *
   * NOTE: Route publique, accessible sans authentification
   */
  @Get()
  @ApiOperation({ summary: 'Lister les thèmes avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste des thèmes' })
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
    name: 'from',
    required: false,
    type: String,
    description: 'Date de début (ISO)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Date de fin (ISO)',
  })
  async listThemes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.themesService.listThemes(pageNum, limitNum, from, to);
  }

  // ============================================
  // ROUTE: GET /api/v1/themes/calendar
  // ============================================

  /**
   * Endpoint pour récupérer le calendrier des thèmes organisé par semaine.
   *
   * @param weeks - Nombre de semaines à inclure (défaut: 12)
   * @returns Calendrier avec les thèmes par semaine
   *
   * Code HTTP: 200 (OK)
   *
   * NOTE: Route publique, accessible sans authentification
   */
  @Get('calendar')
  @ApiOperation({
    summary: 'Récupérer le calendrier des thèmes',
    description: 'Retourne une grille de thèmes par semaine pour le calendrier',
  })
  @ApiQuery({
    name: 'weeks',
    required: false,
    type: Number,
    description: 'Nombre de semaines à récupérer (défaut: 12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendrier des thèmes',
  })
  async getCalendar(@Query('weeks') weeks?: string) {
    const weeksNum = weeks ? parseInt(weeks, 10) : 12;
    return this.themesService.getCalendar(weeksNum);
  }

  @Get('calendar/month')
  @ApiOperation({
    summary: 'Récupérer les 4 semaines du mois',
    description: 'Retourne les 4 semaines du mois actuel avec leurs thèmes',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'Mois au format YYYY-MM (défaut: mois actuel)',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendrier mensuel avec 4 semaines',
  })
  async getMonthCalendar(@Query('month') month?: string) {
    const monthDate = month ? new Date(month + '-01') : new Date();
    return this.themesService.getMonthCalendar(monthDate);
  }

  // ============================================
  // ROUTE: GET /api/v1/themes/:id
  // ============================================

  /**
   * Endpoint pour récupérer un thème par son ID.
   *
   * @param id - ID du thème
   * @returns Thème avec ses suggestions
   *
   * Code HTTP: 200 (OK)
   *
   * NOTE: Route publique, accessible sans authentification
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un thème par ID' })
  @ApiResponse({ status: 200, description: 'Thème récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async getThemeById(@Param('id') id: string) {
    return this.themesService.getThemeById(id);
  }

  // ============================================
  // ROUTE: POST /api/v1/themes
  // ============================================

  /**
   * Endpoint pour créer un nouveau thème hebdomadaire.
   *
   * @param createThemeDto - Données du thème à créer
   * @returns Thème créé
   *
   * Code HTTP: 201 (CREATED)
   *
   * SÉCURITÉ:
   * - Nécessite une authentification JWT
   * - Devrait nécessiter AdminGuard (à ajouter si nécessaire)
   */
  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau thème (Admin)' })
  @ApiResponse({ status: 201, description: 'Thème créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async createTheme(@Body() createThemeDto: CreateThemeDto) {
    return this.themesService.createTheme(createThemeDto);
  }

  // ============================================
  // ROUTE: PATCH /api/v1/themes/:id
  // ============================================

  /**
   * Endpoint pour mettre à jour un thème existant.
   *
   * @param id - ID du thème à mettre à jour
   * @param updateThemeDto - Données à mettre à jour
   * @returns Thème mis à jour
   *
   * Code HTTP: 200 (OK)
   *
   * SÉCURITÉ:
   * - Nécessite une authentification JWT
   * - Devrait nécessiter AdminGuard (à ajouter si nécessaire)
   */
  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un thème (Admin)' })
  @ApiResponse({ status: 200, description: 'Thème mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async updateTheme(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
  ) {
    return this.themesService.updateTheme(id, updateThemeDto);
  }

  // ============================================
  // ROUTE: PATCH /api/v1/themes/:id/activate
  // ============================================

  /**
   * Endpoint pour activer un thème spécifique.
   *
   * FONCTIONNEMENT:
   * - Active le thème spécifié
   * - Désactive automatiquement tous les autres thèmes
   *
   * @param id - ID du thème à activer
   * @returns Thème activé
   *
   * Code HTTP: 200 (OK)
   *
   * SÉCURITÉ:
   * - Nécessite une authentification JWT
   * - Devrait nécessiter AdminGuard (à ajouter si nécessaire)
   */
  @Patch(':id/activate')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer un thème (Admin)' })
  @ApiResponse({ status: 200, description: 'Thème activé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async activateTheme(@Param('id') id: string) {
    return this.themesService.activateTheme(id);
  }

  // ============================================
  // ROUTE: DELETE /api/v1/themes/:id
  // ============================================

  /**
   * Endpoint pour supprimer un thème.
   *
   * @param id - ID du thème à supprimer
   *
   * Code HTTP: 204 (NO_CONTENT)
   *
   * SÉCURITÉ:
   * - Nécessite une authentification JWT
   * - Devrait nécessiter AdminGuard (à ajouter si nécessaire)
   */
  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un thème (Admin)' })
  @ApiResponse({ status: 204, description: 'Thème supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async deleteTheme(@Param('id') id: string) {
    await this.themesService.deleteTheme(id);
  }
}

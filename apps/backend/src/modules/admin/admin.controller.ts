/**
 * FICHIER: admin.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur admin avec routes API fixes sur /admin.
 *
 * IMPORTANT:
 * - Routes API: /api/v1/admin/* (chemin fixe)
 * - ADMIN_BASE_PATH sert UNIQUEMENT au routing Next.js (UI)
 * - Tous les appels API utilisent strictement /api/v1/admin/...
 */

// --- IMPORTATIONS ---
// Ici, on importe tous les outils nécessaires depuis NestJS et d'autres bibliothèques.
import {
  Controller, // Décorateur pour définir que cette classe gère des routes (URLs)
  Get,        // Décorateur pour les requêtes HTTP GET (récupérer des données)
  Patch,      // Décorateur pour les requêtes HTTP PATCH (modifier une partie d'une donnée)
  Delete,     // Décorateur pour les requêtes HTTP DELETE (supprimer une donnée)
  Param,      // Pour récupérer un paramètre dans l'URL (ex: /users/:id)
  Query,      // Pour récupérer les paramètres de requête (ex: ?page=1&limit=10)
  Body,       // Pour récupérer les données envoyées dans le corps de la requête (JSON)
  UseGuards,  // Pour protéger les routes (sécurité)
  Request,    // Objet représentant la requête entrante
  Post,       // Décorateur pour les requêtes HTTP POST (créer une donnée)
  Req,        // Alias raccourci pour Request
  Logger,     // Outil pour afficher des messages dans la console du serveur
} from '@nestjs/common';

// Outils pour générer la documentation automatique de l'API (Swagger)
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Importation du service qui contient la logique métier (le "cerveau" de l'admin)
import { AdminService } from './admin.service';

// Importation des "Gardes" (Guards) pour la sécurité
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard'; // Vérifie le token de connexion
import { AdminRoleGuard } from '../../common/guards/admin-role.guard'; // Vérifie si l'utilisateur est bien un Admin

// Types et DTOs (Data Transfer Objects)
// Ce sont des modèles qui définissent la forme des données qu'on reçoit ou qu'on renvoie
import { Request as ExpressRequest } from 'express';
import { BanUserDto } from './dtos/user-admin.dto';
import { ResolveReportDto } from './dtos/report.dto';
import { CreateThemeDto } from '../themes/dtos/create-theme.dto';
import { UpdateThemeDto } from '../themes/dtos/update-theme.dto';
import { GenerateThemeSuggestionsDto } from './dtos/theme-admin.dto';
import {
  AdminGetUsersQueryDto,
  AdminGetItemsQueryDto,
  AdminGetReportsQueryDto,
  AdminGetThemeSuggestionsQueryDto,
  AdminGetEcoContentQueryDto,
  AdminGetExchangesQueryDto,
  AdminGetThreadsQueryDto,
  AdminGetPostsQueryDto,
  AdminGetAnalyticsQueryDto,
  AdminGetLogsQueryDto,
} from './dtos/admin-query.dto';
import {
  CreateEcoContentDto,
  UpdateEcoContentDto,
} from '../eco/dtos/eco-content.dto';
// Outils de validation pour vérifier que les données reçues sont correctes
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO: GenerateMonthlyThemesDto
 *
 * Paramètres pour générer les thèmes mensuels
 * C'est une petite classe définie ici pour structurer les données reçues pour la génération des thèmes.
 */
class GenerateMonthlyThemesDto {
  @IsOptional() // Ce champ n'est pas obligatoire
  @IsString()   // Si présent, ce doit être une chaîne de caractères
  month?: string;
}

// --- DÉFINITION DU CONTROLEUR ---

@ApiTags('Admin') // Étiquette pour regrouper ces routes sous "Admin" dans la documentation Swagger
@ApiBearerAuth()  // Indique dans la doc que ces routes nécessitent un token d'authentification
// IMPORTANT: Utiliser un chemin fixe 'admin' pour les routes API
// Cela signifie que toutes les routes ici commenceront par /admin
@Controller('admin')
// SÉCURITÉ : Ces deux gardes protègent TOUTES les routes de cette classe.
// 1. AdminJwtGuard : L'utilisateur doit être connecté.
// 2. AdminRoleGuard : L'utilisateur doit avoir le rôle 'admin'.
@UseGuards(AdminJwtGuard, AdminRoleGuard)
export class AdminController {
  // Création d'un logger pour afficher des infos dans la console avec le nom de cette classe
  private readonly logger = new Logger(AdminController.name);

  // Le constructeur est appelé quand NestJS crée cette classe.
  // Il "injecte" automatiquement le service AdminService pour qu'on puisse l'utiliser.
  constructor(private readonly adminService: AdminService) {}

  /**
   * Helper pour logger les erreurs avec requestId
   * Une petite fonction privée pour éviter de répéter le code de gestion d'erreur partout.
   */
  private logError(error: any, method: string, requestId: string, context: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = error?.message || 'Unknown error';
    // On masque les détails techniques (stack trace) en production pour la sécurité
    const errorStack = isProduction ? undefined : error?.stack;

    this.logger.error(
      JSON.stringify({
        requestId,
        method,
        context,
        error: errorMessage,
        ...(errorStack && { stack: errorStack }),
      }),
    );
  }

  /**
   * Helper pour logger les requêtes avec requestId
   * Sert à garder une trace de chaque appel reçu (surtout utile en production).
   */
  private logRequest(method: string, requestId: string, endpoint: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      this.logger.log(
        JSON.stringify({
          requestId,
          method,
          endpoint,
        }),
      );
    }
  }

  // --- ROUTE DASHBOARD ---

  @Get('dashboard') // Route: GET /admin/dashboard
  @ApiOperation({ summary: 'Statistiques du dashboard' }) // Description pour la doc
  // Réponses possibles documentées pour Swagger (succès, non autorisé, interdit, erreur serveur)
  @ApiResponse({ status: 200, description: 'Statistiques retournées avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé (pas admin)' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getDashboard(@Req() req: ExpressRequest) {
    // Récupération de l'ID de requête (utile pour le traçage des bugs)
    const requestId = (req as any).requestId || 'unknown';
    const method = req.method || 'GET';

    // On note que la requête est arrivée
    this.logRequest(method, requestId, '/admin/dashboard');

    try {
      // On demande au service de calculer les stats
      const stats = await this.adminService.getDashboardStats(requestId);
      return stats; // On renvoie le résultat au client
    } catch (error: any) {
      // Si ça plante, on log l'erreur proprement
      this.logError(error, method, requestId, 'AdminController.getDashboard');
      // On relance l'erreur pour que NestJS renvoie une réponse 500
      throw error;
    }
  }

  // --- ROUTES UTILISATEURS (Users) ---

  @Get('users') // Route: GET /admin/users
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  // Documentation des réponses HTTP possibles
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs retournée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé (pas admin)' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  // @Query permet de récupérer les filtres (page, limit, recherche) dans l'URL
  async getUsers(@Query() query: AdminGetUsersQueryDto, @Req() req: ExpressRequest) {
    const requestId = (req as any).requestId || 'unknown';
    const method = req.method || 'GET';

    this.logRequest(method, requestId, '/admin/users');

    try {
      // Appel au service pour récupérer la liste paginée
      const users = await this.adminService.getUsers(
        query.page || 1,   // Page 1 par défaut
        query.limit || 20, // 20 utilisateurs par défaut
        query.search,      // Terme de recherche optionnel
        requestId,
      );
      return users;
    } catch (error: any) {
      this.logError(error, method, requestId, 'AdminController.getUsers');
      throw error;
    }
  }

  @Get('users/:id') // Route: GET /admin/users/123 (où 123 est l'ID)
  @ApiOperation({ summary: 'Détails d\'un utilisateur' })
  async getUserById(@Param('id') id: string) { // @Param extrait l'ID de l'URL
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/ban') // Route: PATCH /admin/users/123/ban
  @ApiOperation({ summary: 'Bannir un utilisateur' })
  async banUser(
    @Param('id') id: string,
    @Body() banDto: BanUserDto, // @Body récupère la raison du ban envoyée en JSON
    @Request() req: any,
  ) {
    // req.user.id est disponible car l'utilisateur est connecté (grâce au Guard)
    return this.adminService.banUser(id, req.user.id, banDto.reason, req);
  }

  @Patch('users/:id/unban') // Route: PATCH /admin/users/123/unban
  @ApiOperation({ summary: 'Débannir un utilisateur' })
  async unbanUser(@Param('id') id: string, @Request() req: any) {
    return this.adminService.unbanUser(id, req.user.id, req);
  }

  @Delete('users/:id') // Route: DELETE /admin/users/123
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 403, description: 'Impossible de supprimer un admin' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    const requestId = (req as any).requestId || 'unknown';
    const method = req.method || 'DELETE';

    this.logRequest(method, requestId, `/admin/users/${id}`);

    try {
      return await this.adminService.deleteUser(id, req.user.id, req);
    } catch (error: any) {
      this.logError(error, method, requestId, 'AdminController.deleteUser');
      throw error;
    }
  }

  // --- ROUTES OBJETS (Items) ---

  @Get('items') // Route: GET /admin/items
  @ApiOperation({ summary: 'Liste des objets' })
  async getItems(@Query() query: AdminGetItemsQueryDto) {
    // Récupère les objets avec pagination et filtres (propriétaire, catégorie, statut)
    return this.adminService.getItems(
      query.page || 1,
      query.limit || 20,
      { ownerId: query.ownerId, category: query.category, status: query.status },
    );
  }

  @Get('items/:id') // Route: GET /admin/items/123
  @ApiOperation({ summary: "Détails d'un objet" })
  async getItemById(@Param('id') id: string) {
    return this.adminService.getItemById(id);
  }

  @Patch('items/:id/archive') // Route: PATCH /admin/items/123/archive
  @ApiOperation({ summary: 'Archiver un objet' })
  async archiveItem(@Param('id') id: string, @Request() req: any) {
    return this.adminService.archiveItem(id, req.user.id, req);
  }

  @Delete('items/:id') // Route: DELETE /admin/items/123
  @ApiOperation({ summary: 'Supprimer un objet' })
  async deleteItem(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteItem(id, req.user.id, req);
  }

  // --- ROUTES SIGNALEMENTS (Reports) ---

  @Get('reports') // Route: GET /admin/reports
  @ApiOperation({ summary: 'Liste des signalements' })
  async getReports(@Query() query: AdminGetReportsQueryDto) {
    return this.adminService.getReports(
      query.page || 1,
      query.limit || 20,
      query.resolved, // Filtre pour voir les résolus ou non
    );
  }

  @Get('reports/:id') // Route: GET /admin/reports/123
  @ApiOperation({ summary: "Détails d'un signalement" })
  async getReportById(@Param('id') id: string) {
    return this.adminService.getReportById(id);
  }

  @Patch('reports/:id/resolve') // Route: PATCH /admin/reports/123/resolve
  @ApiOperation({ summary: 'Résoudre un signalement' })
  async resolveReport(
    @Param('id') id: string,
    @Body() resolveDto: ResolveReportDto, // Contient les actions à prendre (bannir, supprimer item...)
    @Request() req: any,
  ) {
    return this.adminService.resolveReport(
      id,
      req.user.id,
      resolveDto.banUser || false,    // Par défaut, ne pas bannir si non spécifié
      resolveDto.deleteItem || false, // Par défaut, ne pas supprimer l'objet
      resolveDto.archive || false,    // Par défaut, ne pas archiver
      req,
    );
  }

  @Delete('reports/:id') // Route: DELETE /admin/reports/123
  @ApiOperation({ summary: 'Supprimer un signalement' })
  async deleteReport(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteReport(id, req.user.id, req);
  }

  // --- ROUTES THÈMES (Themes) ---

  @Get('themes') // Route: GET /admin/themes
  @ApiOperation({ summary: 'Liste des thèmes' })
  async getThemes() {
    return this.adminService.getThemes();
  }

  // IMPORTANT: Route spécifique AVANT les routes génériques pour éviter les conflits
  // Si on mettait :id avant, 'generate' serait pris pour un ID.
  @Post('themes/generate') // Route: POST /admin/themes/generate
  @ApiOperation({ summary: 'Générer un nouveau thème avec l\'IA' })
  async generateTheme(@Request() req: any) {
    // Appelle l'IA pour créer un thème automatiquement
    return this.adminService.generateTheme(req.user.id);
  }

  @Post('themes/generate-monthly') // Route: POST /admin/themes/generate-monthly
  @ApiOperation({ summary: 'Générer les 4 thèmes du mois avec l\'IA' })
  async generateMonthlyThemes(
    @Request() req: any,
    @Body() body?: GenerateMonthlyThemesDto, // Optionnel : spécifier le mois
  ) {
    // Si un mois est fourni, on crée une date, sinon undefined
    const monthDate = body?.month ? new Date(body.month + '-01') : undefined;
    return this.adminService.generateMonthlyThemes(req.user.id, monthDate);
  }

  @Get('themes/:id') // Route: GET /admin/themes/123
  @ApiOperation({ summary: "Détails d'un thème" })
  async getTheme(@Param('id') id: string) {
    return this.adminService.getThemeById(id);
  }

  @Post('themes') // Route: POST /admin/themes (Création manuelle)
  @ApiOperation({ summary: 'Créer un thème' })
  async createTheme(@Body() createThemeDto: CreateThemeDto, @Request() req: any) {
    return this.adminService.createTheme(createThemeDto, req.user.id);
  }

  @Patch('themes/:id') // Route: PATCH /admin/themes/123
  @ApiOperation({ summary: 'Mettre à jour un thème' })
  async updateTheme(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
    @Request() req: any,
  ) {
    return this.adminService.updateTheme(id, updateThemeDto, req.user.id);
  }

  @Patch('themes/:id/activate') // Route: PATCH /admin/themes/123/activate
  @ApiOperation({ summary: 'Activer un thème' })
  async activateTheme(@Param('id') id: string, @Request() req: any) {
    return this.adminService.activateTheme(id, req.user.id);
  }

  @Delete('themes/:id') // Route: DELETE /admin/themes/123
  @ApiOperation({ summary: 'Supprimer un thème' })
  async deleteTheme(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteTheme(id, req.user.id);
  }

  @Post('themes/:id/suggestions') // Route: POST /admin/themes/123/suggestions
  @ApiOperation({ summary: 'Générer des suggestions IA pour un thème' })
  async generateThemeSuggestions(
    @Param('id') id: string,
    @Body() body: GenerateThemeSuggestionsDto,
    @Request() req: any,
  ) {
    // Génère des idées basées sur le thème, pour les langues demandées
    return this.adminService.generateThemeSuggestions(id, req.user.id, body.locales);
  }

  @Get('themes/:id/suggestions') // Route: GET /admin/themes/123/suggestions
  @ApiOperation({ summary: 'Liste des suggestions pour un thème' })
  async getThemeSuggestions(
    @Param('id') id: string,
    @Query() query: AdminGetThemeSuggestionsQueryDto,
  ) {
    return this.adminService.getThemeSuggestions(
      id,
      query.page || 1,
      query.limit || 20,
      query.sort || '-createdAt', // Tri par défaut : du plus récent au plus ancien
    );
  }

  @Get('themes/:id/suggestions/stats') // Route: GET /admin/themes/123/suggestions/stats
  @ApiOperation({ summary: 'Statistiques des suggestions pour un thème' })
  async getThemeSuggestionStats(@Param('id') id: string) {
    return this.adminService.getThemeSuggestionStats(id);
  }

  // --- ROUTES CONTENU ÉCOLO (Eco Content) ---

  @Get('eco') // Route: GET /admin/eco
  @ApiOperation({ summary: 'Liste du contenu éco' })
  async getEcoContent(@Query() query: AdminGetEcoContentQueryDto) {
    return this.adminService.getEcoContent(
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get('eco/:id') // Route: GET /admin/eco/123
  @ApiOperation({ summary: "Détails d'un contenu éco" })
  async getEcoContentById(@Param('id') id: string) {
    return this.adminService.getEcoContentById(id);
  }

  @Post('eco') // Route: POST /admin/eco
  @ApiOperation({ summary: 'Créer un contenu éco' })
  async createEcoContent(
    @Body() createEcoContentDto: CreateEcoContentDto,
    @Request() req: any,
  ) {
    return this.adminService.createEcoContent(createEcoContentDto, req.user.id, req);
  }

  @Patch('eco/:id') // Route: PATCH /admin/eco/123
  @ApiOperation({ summary: 'Mettre à jour un contenu éco' })
  async updateEcoContent(
    @Param('id') id: string,
    @Body() updateEcoContentDto: UpdateEcoContentDto,
    @Request() req: any,
  ) {
    return this.adminService.updateEcoContent(
      id,
      updateEcoContentDto,
      req.user.id,
      req,
    );
  }

  @Delete('eco/:id') // Route: DELETE /admin/eco/123
  @ApiOperation({ summary: 'Supprimer un contenu éco' })
  async deleteEcoContent(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteEcoContent(id, req.user.id, req);
  }

  // --- ROUTES ÉCHANGES (Exchanges) ---

  @Get('exchanges') // Route: GET /admin/exchanges
  @ApiOperation({ summary: 'Liste des échanges' })
  async getExchanges(@Query() query: AdminGetExchangesQueryDto) {
    return this.adminService.getExchanges(
      query.page || 1,
      query.limit || 20,
      {
        status: query.status,
        requesterId: query.requesterId, // Filtrer par demandeur
        responderId: query.responderId, // Filtrer par répondeur
      },
    );
  }

  @Get('exchanges/:id') // Route: GET /admin/exchanges/123
  @ApiOperation({ summary: "Détails d'un échange" })
  async getExchangeById(@Param('id') id: string) {
    return this.adminService.getExchangeById(id);
  }

  @Delete('exchanges/:id') // Route: DELETE /admin/exchanges/123
  @ApiOperation({ summary: 'Supprimer un échange' })
  async deleteExchange(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteExchange(id, req.user.id, req);
  }

  // --- GESTION DE COMMUNAUTÉ (Threads/Posts) ---

  @Get('community/threads') // Route: GET /admin/community/threads
  @ApiOperation({ summary: 'Liste des threads' })
  async getThreads(@Query() query: AdminGetThreadsQueryDto) {
    return this.adminService.getThreads(
      query.page || 1,
      query.limit || 20,
      query.scope, // Filtrer par portée (public, privé, etc.)
    );
  }

  @Get('community/threads/:id') // Route: GET /admin/community/threads/123
  @ApiOperation({ summary: "Détails d'un thread" })
  async getThreadById(@Param('id') id: string) {
    return this.adminService.getThreadById(id);
  }

  @Delete('community/threads/:id') // Route: DELETE /admin/community/threads/123
  @ApiOperation({ summary: 'Supprimer un thread' })
  async deleteThread(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteThread(id, req.user.id, req);
  }

  @Get('community/posts') // Route: GET /admin/community/posts
  @ApiOperation({ summary: 'Liste des posts' })
  async getPosts(@Query() query: AdminGetPostsQueryDto) {
    return this.adminService.getPosts(
      query.page || 1,
      query.limit || 20,
      { threadId: query.threadId, authorId: query.authorId },
    );
  }

  @Get('community/posts/:id') // Route: GET /admin/community/posts/123
  @ApiOperation({ summary: "Détails d'un post" })
  async getPostById(@Param('id') id: string) {
    return this.adminService.getPostById(id);
  }

  @Delete('community/posts/:id') // Route: DELETE /admin/community/posts/123
  @ApiOperation({ summary: 'Supprimer un post' })
  async deletePost(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deletePost(id, req.user.id, req);
  }

  // --- ANALYTIQUES (Statistiques globales) ---

  @Get('analytics/overview') // Route: GET /admin/analytics/overview
  @ApiOperation({ summary: 'Statistiques avancées de la plateforme' })
  async getAnalyticsOverview(@Query() query: AdminGetAnalyticsQueryDto) {
    // Convertit les dates reçues en objets Date javascript si elles existent
    return this.adminService.getAnalyticsOverview(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  @Get('analytics/users') // Route: GET /admin/analytics/users
  @ApiOperation({ summary: 'Statistiques utilisateurs' })
  async getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @Get('analytics/items') // Route: GET /admin/analytics/items
  @ApiOperation({ summary: 'Statistiques objets' })
  async getItemAnalytics() {
    return this.adminService.getItemAnalytics();
  }

  @Get('analytics/exchanges') // Route: GET /admin/analytics/exchanges
  @ApiOperation({ summary: 'Statistiques échanges' })
  async getExchangeAnalytics() {
    return this.adminService.getExchangeAnalytics();
  }

  // --- LOGS (Historique des actions) ---
  // Ces routes servent d'audit : qui a fait quoi et quand.

  @Get('logs') // Route: GET /admin/logs
  @ApiOperation({ summary: 'Logs d\'audit des actions admin (avec filtres)' })
  async getLogs(@Query() query: AdminGetLogsQueryDto) {
    // Récupère l'historique avec de nombreux filtres possibles
    return this.adminService.getLogs(query.page || 1, query.limit || 50, {
      adminId: query.adminId,      // Filtrer par admin
      actionType: query.actionType,// Filtrer par type d'action
      targetType: query.targetType,// Filtrer par type de cible (user, item...)
      startDate: query.startDate,
      endDate: query.endDate,
      requestId: query.requestId,
    });
  }

  @Get('logs/:id') // Route: GET /admin/logs/123
  @ApiOperation({ summary: "Détails d'un log" })
  async getLogById(@Param('id') id: string) {
    return this.adminService.getLogById(id);
  }
}

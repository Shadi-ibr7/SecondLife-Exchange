/**
 * FICHIER: admin.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur admin avec routes secrètes basées sur ADMIN_BASE_PATH.
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
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
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO: GenerateMonthlyThemesDto
 *
 * Paramètres pour générer les thèmes mensuels
 */
class GenerateMonthlyThemesDto {
  @IsOptional()
  @IsString()
  month?: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller(process.env.ADMIN_BASE_PATH || 'admin') // Chemin secret depuis env
@UseGuards(AdminJwtGuard, AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Statistiques du dashboard' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // Users
  @Get('users')
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  async getUsers(@Query() query: AdminGetUsersQueryDto) {
    return this.adminService.getUsers(
      query.page || 1,
      query.limit || 20,
      query.search,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Détails d\'un utilisateur' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Bannir un utilisateur' })
  async banUser(
    @Param('id') id: string,
    @Body() banDto: BanUserDto,
    @Request() req: any,
  ) {
    return this.adminService.banUser(id, req.user.id, banDto.reason, req);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Débannir un utilisateur' })
  async unbanUser(@Param('id') id: string, @Request() req: any) {
    return this.adminService.unbanUser(id, req.user.id, req);
  }

  // Items
  @Get('items')
  @ApiOperation({ summary: 'Liste des objets' })
  async getItems(@Query() query: AdminGetItemsQueryDto) {
    return this.adminService.getItems(
      query.page || 1,
      query.limit || 20,
      { ownerId: query.ownerId, category: query.category, status: query.status },
    );
  }

  @Get('items/:id')
  @ApiOperation({ summary: "Détails d'un objet" })
  async getItemById(@Param('id') id: string) {
    return this.adminService.getItemById(id);
  }

  @Patch('items/:id/archive')
  @ApiOperation({ summary: 'Archiver un objet' })
  async archiveItem(@Param('id') id: string, @Request() req: any) {
    return this.adminService.archiveItem(id, req.user.id, req);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Supprimer un objet' })
  async deleteItem(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteItem(id, req.user.id, req);
  }

  // Reports
  @Get('reports')
  @ApiOperation({ summary: 'Liste des signalements' })
  async getReports(@Query() query: AdminGetReportsQueryDto) {
    return this.adminService.getReports(
      query.page || 1,
      query.limit || 20,
      query.resolved,
    );
  }

  @Get('reports/:id')
  @ApiOperation({ summary: "Détails d'un signalement" })
  async getReportById(@Param('id') id: string) {
    return this.adminService.getReportById(id);
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Résoudre un signalement' })
  async resolveReport(
    @Param('id') id: string,
    @Body() resolveDto: ResolveReportDto,
    @Request() req: any,
  ) {
    return this.adminService.resolveReport(id, req.user.id, resolveDto.banUser, req);
  }

  @Delete('reports/:id')
  @ApiOperation({ summary: 'Supprimer un signalement' })
  async deleteReport(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteReport(id, req.user.id, req);
  }

  // Themes
  @Get('themes')
  @ApiOperation({ summary: 'Liste des thèmes' })
  async getThemes() {
    return this.adminService.getThemes();
  }

  // IMPORTANT: Route spécifique AVANT les routes génériques pour éviter les conflits
  @Post('themes/generate')
  @ApiOperation({ summary: 'Générer un nouveau thème avec l\'IA' })
  async generateTheme(@Request() req: any) {
    return this.adminService.generateTheme(req.user.id);
  }

  @Post('themes/generate-monthly')
  @ApiOperation({ summary: 'Générer les 4 thèmes du mois avec l\'IA' })
  async generateMonthlyThemes(
    @Request() req: any,
    @Body() body?: GenerateMonthlyThemesDto,
  ) {
    const monthDate = body?.month ? new Date(body.month + '-01') : undefined;
    return this.adminService.generateMonthlyThemes(req.user.id, monthDate);
  }

  @Get('themes/:id')
  @ApiOperation({ summary: "Détails d'un thème" })
  async getTheme(@Param('id') id: string) {
    return this.adminService.getThemeById(id);
  }

  @Post('themes')
  @ApiOperation({ summary: 'Créer un thème' })
  async createTheme(@Body() createThemeDto: CreateThemeDto, @Request() req: any) {
    return this.adminService.createTheme(createThemeDto, req.user.id);
  }

  @Patch('themes/:id')
  @ApiOperation({ summary: 'Mettre à jour un thème' })
  async updateTheme(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
    @Request() req: any,
  ) {
    return this.adminService.updateTheme(id, updateThemeDto, req.user.id);
  }

  @Patch('themes/:id/activate')
  @ApiOperation({ summary: 'Activer un thème' })
  async activateTheme(@Param('id') id: string, @Request() req: any) {
    return this.adminService.activateTheme(id, req.user.id);
  }

  @Delete('themes/:id')
  @ApiOperation({ summary: 'Supprimer un thème' })
  async deleteTheme(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteTheme(id, req.user.id);
  }

  @Post('themes/:id/suggestions')
  @ApiOperation({ summary: 'Générer des suggestions IA pour un thème' })
  async generateThemeSuggestions(
    @Param('id') id: string,
    @Body() body: GenerateThemeSuggestionsDto,
    @Request() req: any,
  ) {
    return this.adminService.generateThemeSuggestions(id, req.user.id, body.locales);
  }

  @Get('themes/:id/suggestions')
  @ApiOperation({ summary: 'Liste des suggestions pour un thème' })
  async getThemeSuggestions(
    @Param('id') id: string,
    @Query() query: AdminGetThemeSuggestionsQueryDto,
  ) {
    return this.adminService.getThemeSuggestions(
      id,
      query.page || 1,
      query.limit || 20,
      query.sort || '-createdAt',
    );
  }

  @Get('themes/:id/suggestions/stats')
  @ApiOperation({ summary: 'Statistiques des suggestions pour un thème' })
  async getThemeSuggestionStats(@Param('id') id: string) {
    return this.adminService.getThemeSuggestionStats(id);
  }

  // Eco Content
  @Get('eco')
  @ApiOperation({ summary: 'Liste du contenu éco' })
  async getEcoContent(@Query() query: AdminGetEcoContentQueryDto) {
    return this.adminService.getEcoContent(
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get('eco/:id')
  @ApiOperation({ summary: "Détails d'un contenu éco" })
  async getEcoContentById(@Param('id') id: string) {
    return this.adminService.getEcoContentById(id);
  }

  @Post('eco')
  @ApiOperation({ summary: 'Créer un contenu éco' })
  async createEcoContent(
    @Body() createEcoContentDto: CreateEcoContentDto,
    @Request() req: any,
  ) {
    return this.adminService.createEcoContent(createEcoContentDto, req.user.id, req);
  }

  @Patch('eco/:id')
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

  @Delete('eco/:id')
  @ApiOperation({ summary: 'Supprimer un contenu éco' })
  async deleteEcoContent(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteEcoContent(id, req.user.id, req);
  }

  // Exchanges
  @Get('exchanges')
  @ApiOperation({ summary: 'Liste des échanges' })
  async getExchanges(@Query() query: AdminGetExchangesQueryDto) {
    return this.adminService.getExchanges(
      query.page || 1,
      query.limit || 20,
      {
        status: query.status,
        requesterId: query.requesterId,
        responderId: query.responderId,
      },
    );
  }

  @Get('exchanges/:id')
  @ApiOperation({ summary: "Détails d'un échange" })
  async getExchangeById(@Param('id') id: string) {
    return this.adminService.getExchangeById(id);
  }

  @Delete('exchanges/:id')
  @ApiOperation({ summary: 'Supprimer un échange' })
  async deleteExchange(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteExchange(id, req.user.id, req);
  }

  // Community Management
  @Get('community/threads')
  @ApiOperation({ summary: 'Liste des threads' })
  async getThreads(@Query() query: AdminGetThreadsQueryDto) {
    return this.adminService.getThreads(
      query.page || 1,
      query.limit || 20,
      query.scope,
    );
  }

  @Get('community/threads/:id')
  @ApiOperation({ summary: "Détails d'un thread" })
  async getThreadById(@Param('id') id: string) {
    return this.adminService.getThreadById(id);
  }

  @Delete('community/threads/:id')
  @ApiOperation({ summary: 'Supprimer un thread' })
  async deleteThread(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteThread(id, req.user.id, req);
  }

  @Get('community/posts')
  @ApiOperation({ summary: 'Liste des posts' })
  async getPosts(@Query() query: AdminGetPostsQueryDto) {
    return this.adminService.getPosts(
      query.page || 1,
      query.limit || 20,
      { threadId: query.threadId, authorId: query.authorId },
    );
  }

  @Get('community/posts/:id')
  @ApiOperation({ summary: "Détails d'un post" })
  async getPostById(@Param('id') id: string) {
    return this.adminService.getPostById(id);
  }

  @Delete('community/posts/:id')
  @ApiOperation({ summary: 'Supprimer un post' })
  async deletePost(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deletePost(id, req.user.id, req);
  }

  // Analytics
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Statistiques avancées de la plateforme' })
  async getAnalyticsOverview(@Query() query: AdminGetAnalyticsQueryDto) {
    return this.adminService.getAnalyticsOverview(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'Statistiques utilisateurs' })
  async getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @Get('analytics/items')
  @ApiOperation({ summary: 'Statistiques objets' })
  async getItemAnalytics() {
    return this.adminService.getItemAnalytics();
  }

  @Get('analytics/exchanges')
  @ApiOperation({ summary: 'Statistiques échanges' })
  async getExchangeAnalytics() {
    return this.adminService.getExchangeAnalytics();
  }

  // Logs (Audit Trail)
  @Get('logs')
  @ApiOperation({ summary: 'Logs d\'audit des actions admin (avec filtres)' })
  async getLogs(@Query() query: AdminGetLogsQueryDto) {
    return this.adminService.getLogs(query.page || 1, query.limit || 50, {
      adminId: query.adminId,
      actionType: query.actionType,
      targetType: query.targetType,
      startDate: query.startDate,
      endDate: query.endDate,
      requestId: query.requestId,
    });
  }

  @Get('logs/:id')
  @ApiOperation({ summary: "Détails d'un log" })
  async getLogById(@Param('id') id: string) {
    return this.adminService.getLogById(id);
  }
}


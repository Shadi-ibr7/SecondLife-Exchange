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
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
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
    return this.adminService.banUser(id, req.user.id, banDto.reason);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Débannir un utilisateur' })
  async unbanUser(@Param('id') id: string, @Request() req: any) {
    return this.adminService.unbanUser(id, req.user.id);
  }

  // Items
  @Get('items')
  @ApiOperation({ summary: 'Liste des objets' })
  async getItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('ownerId') ownerId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getItems(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { ownerId, category, status },
    );
  }

  @Patch('items/:id/archive')
  @ApiOperation({ summary: 'Archiver un objet' })
  async archiveItem(@Param('id') id: string, @Request() req: any) {
    return this.adminService.archiveItem(id, req.user.id);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Supprimer un objet' })
  async deleteItem(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteItem(id, req.user.id);
  }

  // Reports
  @Get('reports')
  @ApiOperation({ summary: 'Liste des signalements' })
  async getReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('resolved') resolved?: string,
  ) {
    return this.adminService.getReports(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    );
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Résoudre un signalement' })
  async resolveReport(
    @Param('id') id: string,
    @Body() resolveDto: ResolveReportDto,
    @Request() req: any,
  ) {
    return this.adminService.resolveReport(id, req.user.id, resolveDto.banUser);
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
    @Body() body?: { month?: string },
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminService.getThemeSuggestions(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      sort || '-createdAt',
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
  async getEcoContent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getEcoContent(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // Logs
  @Get('logs')
  @ApiOperation({ summary: 'Logs des actions admin' })
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('adminId') adminId?: string,
  ) {
    return this.adminService.getLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      adminId,
    );
  }
}


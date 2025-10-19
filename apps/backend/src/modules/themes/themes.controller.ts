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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ThemesService } from './themes.service';
import { CreateThemeDto } from './dtos/create-theme.dto';
import { UpdateThemeDto } from './dtos/update-theme.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

@ApiTags('Themes')
@Controller('api/v1/themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Récupérer le thème actif' })
  @ApiResponse({ status: 200, description: 'Thème actif récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Aucun thème actif trouvé' })
  async getActiveTheme() {
    return this.themesService.getActiveTheme();
  }

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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.themesService.listThemes(page, limit, from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un thème par ID' })
  @ApiResponse({ status: 200, description: 'Thème récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async getThemeById(@Param('id') id: string) {
    return this.themesService.getThemeById(id);
  }

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

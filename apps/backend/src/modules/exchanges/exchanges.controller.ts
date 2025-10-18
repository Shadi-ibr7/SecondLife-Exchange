import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExchangesService } from './exchanges.service';
import { CreateExchangeDto, UpdateExchangeDto } from './exchanges.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Exchanges')
@Controller('exchanges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExchangesController {
  constructor(private exchangesService: ExchangesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle proposition d\'échange' })
  @ApiResponse({ status: 201, description: 'Proposition d\'échange créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Objet non trouvé' })
  async create(@Request() req, @Body() createExchangeDto: CreateExchangeDto) {
    return this.exchangesService.create(req.user.id, createExchangeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir la liste des échanges de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des échanges' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exchangesService.findAll(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un échange' })
  @ApiResponse({ status: 200, description: 'Détails de l\'échange' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Échange non trouvé' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.exchangesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un échange' })
  @ApiResponse({ status: 200, description: 'Échange mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Échange non trouvé' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateExchangeDto: UpdateExchangeDto,
  ) {
    return this.exchangesService.update(id, req.user.id, updateExchangeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler un échange' })
  @ApiResponse({ status: 200, description: 'Échange annulé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Échange non trouvé' })
  async cancel(@Request() req, @Param('id') id: string) {
    return this.exchangesService.cancel(id, req.user.id);
  }
}

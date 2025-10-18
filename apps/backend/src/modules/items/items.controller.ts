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
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './items.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouvel objet' })
  @ApiResponse({ status: 201, description: 'Objet créé avec succès' })
  async create(@Request() req, @Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(req.user.id, createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir la liste des objets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des objets' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.itemsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      category,
      search,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtenir la liste des catégories' })
  @ApiResponse({ status: 200, description: 'Liste des catégories' })
  async getCategories() {
    return this.itemsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un objet par ID' })
  @ApiResponse({ status: 200, description: 'Détails de l\'objet' })
  @ApiResponse({ status: 404, description: 'Objet non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un objet' })
  @ApiResponse({ status: 200, description: 'Objet mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Objet non trouvé' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.itemsService.update(req.user.id, id, updateItemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un objet' })
  @ApiResponse({ status: 200, description: 'Objet supprimé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Objet non trouvé' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.itemsService.remove(req.user.id, id);
  }

  @Get('user/:ownerId')
  @ApiOperation({ summary: 'Obtenir les objets d\'un utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Objets de l\'utilisateur' })
  async findByOwner(
    @Param('ownerId') ownerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.itemsService.findByOwner(
      ownerId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}

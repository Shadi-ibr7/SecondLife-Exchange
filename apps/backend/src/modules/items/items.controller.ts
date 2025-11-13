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
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ItemsService, PaginatedItems, ItemWithPhotos } from './items.service';
import {
  UploadsService,
  SignedUploadParams,
  AttachPhotoDto,
} from './uploads/uploads.service';
import { CreateItemDto } from './dtos/create-item.dto';
import { UpdateItemDto } from './dtos/update-item.dto';
import { ListItemsQueryDto } from './dtos/list-items.query.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { ItemStatus } from '@prisma/client';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouvel item' })
  @ApiResponse({ status: 201, description: 'Item créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async createItem(
    @Request() req: any,
    @Body() createItemDto: CreateItemDto,
  ): Promise<ItemWithPhotos> {
    return this.itemsService.createItem(req.user.id, createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les items avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste des items' })
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
    name: 'q',
    required: false,
    type: String,
    description: 'Mot-clé de recherche',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: [
      'CLOTHING',
      'ELECTRONICS',
      'BOOKS',
      'HOME',
      'TOOLS',
      'TOYS',
      'SPORTS',
      'ART',
      'VINTAGE',
      'HANDCRAFT',
      'OTHER',
    ],
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['NEW', 'GOOD', 'FAIR', 'TO_REPAIR'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['AVAILABLE', 'PENDING', 'TRADED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    type: String,
    description: 'ID du propriétaire',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Tri (ex: -createdAt)',
  })
  async listItems(@Query() query: ListItemsQueryDto): Promise<PaginatedItems> {
    return this.itemsService.listItems(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un item par ID' })
  @ApiResponse({ status: 200, description: "Détails de l'item" })
  @ApiResponse({ status: 404, description: 'Item non trouvé' })
  async getItemById(@Param('id') id: string): Promise<ItemWithPhotos> {
    return this.itemsService.getItemById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un item (propriétaire uniquement)' })
  @ApiResponse({ status: 200, description: 'Item mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Item non trouvé' })
  async updateItem(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemWithPhotos> {
    return this.itemsService.updateItem(id, req.user.id, updateItemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un item (propriétaire uniquement)' })
  @ApiResponse({ status: 204, description: 'Item supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Item non trouvé' })
  async deleteItem(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.itemsService.deleteItem(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mettre à jour le statut d'un item" })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Item non trouvé' })
  async updateItemStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: ItemStatus,
  ): Promise<ItemWithPhotos> {
    return this.itemsService.updateItemStatus(id, req.user.id, status);
  }

  @Get('user/me')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Récupérer les items de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: "Items de l'utilisateur" })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getUserItems(
    @Request() req: any,
    @Query() query: Omit<ListItemsQueryDto, 'ownerId'>,
  ): Promise<PaginatedItems> {
    return this.itemsService.getUserItems(req.user.id, query);
  }

  // === Routes d'upload ===

  @Post('uploads/signature')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Générer une signature d'upload Cloudinary" })
  @ApiResponse({ status: 200, description: 'Signature générée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getUploadSignature(
    @Request() req: any,
    @Body('folder') folder: string,
    @Body('maxBytes') maxBytes?: number,
  ): Promise<SignedUploadParams> {
    return this.uploadsService.getSignedUploadParams(folder, maxBytes);
  }

  @Post(':id/photos')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attacher une photo à un item' })
  @ApiResponse({ status: 201, description: 'Photo attachée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Item non trouvé' })
  async attachPhoto(
    @Param('id') itemId: string,
    @Request() req: any,
    @Body('photos') photos: AttachPhotoDto[] | AttachPhotoDto,
  ): Promise<void> {
    // Vérifier que l'utilisateur est le propriétaire
    const item = await this.itemsService.getItemById(itemId);
    if (item.owner.id !== req.user.id) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // Accepter un tableau ou un seul objet pour compatibilité
    if (Array.isArray(photos)) {
      return this.uploadsService.attachPhotos(itemId, photos);
    }
    return this.uploadsService.attachPhoto(itemId, photos);
  }

  @Delete('photos/:photoId')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer une photo d'un item" })
  @ApiResponse({ status: 204, description: 'Photo supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Photo non trouvée' })
  async deletePhoto(
    @Param('photoId') photoId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.uploadsService.deletePhoto(photoId, req.user.id);
  }
}

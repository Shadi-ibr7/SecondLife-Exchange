/**
 * FICHIER: items.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour la gestion des items (objets à échanger).
 * Il gère les opérations CRUD (Create, Read, Update, Delete) et l'upload de photos.
 *
 * ROUTES:
 * - POST /api/v1/items - Créer un item (authentifié)
 * - GET /api/v1/items - Lister les items avec filtres (public)
 * - GET /api/v1/items/:id - Récupérer un item par ID (public)
 * - PATCH /api/v1/items/:id - Mettre à jour un item (propriétaire uniquement)
 * - DELETE /api/v1/items/:id - Supprimer un item (propriétaire uniquement)
 * - PATCH /api/v1/items/:id/status - Mettre à jour le statut (propriétaire uniquement)
 * - GET /api/v1/items/user/me - Mes items (authentifié)
 * - POST /api/v1/items/uploads/signature - Signature Cloudinary (authentifié)
 * - POST /api/v1/items/:id/photos - Attacher des photos (propriétaire uniquement)
 * - DELETE /api/v1/items/photos/:photoId - Supprimer une photo (propriétaire uniquement)
 *
 * SÉCURITÉ:
 * - Routes de création/modification nécessitent une authentification JWT
 * - Vérification que seul le propriétaire peut modifier ses items
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
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';

// Import des décorateurs Swagger pour la documentation API
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

// Import des services
import { ItemsService, PaginatedItems, ItemWithPhotos } from './items.service';
import {
  UploadsService,
  SignedUploadParams,
  AttachPhotoDto,
} from './uploads/uploads.service';

// Import des DTOs
import { CreateItemDto } from './dtos/create-item.dto';
import { UpdateItemDto } from './dtos/update-item.dto';
import { ListItemsQueryDto } from './dtos/list-items.query.dto';

// Import des guards
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

// Import des types Prisma
import { ItemStatus } from '@prisma/client';

/**
 * CONTRÔLEUR: ItemsController
 *
 * Contrôleur pour la gestion des items.
 * Le préfixe 'items' signifie que toutes les routes commencent par /api/v1/items
 *
 * @ApiTags('Items'): Groupe les routes dans la documentation Swagger
 */
@ApiTags('Items')
@Controller('items')
export class ItemsController {
  /**
   * CONSTRUCTEUR
   *
   * Injection des services nécessaires
   */
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
    /**
     * `req.user` est injecté par JwtAccessGuard; il contient les claims du token (id, roles...).
     * On transmet l'ID du propriétaire pour que le service associe correctement l'item.
     */
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
    /**
     * Le service renvoie un objet PaginatedItems => { items, total, page, limit, totalPages }.
     * Les contrôleurs restent fins pour se concentrer sur le transport HTTP et Swagger.
     */
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
    /**
     * Permet au frontend d'uploader directement sur Cloudinary sans transiter par le backend.
     * On pourrait ici vérifier que `folder` respecte certains patterns (ex: items/<userId>).
     */
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

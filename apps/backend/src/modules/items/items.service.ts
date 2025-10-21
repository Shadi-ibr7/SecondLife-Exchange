import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { CreateItemDto } from './dtos/create-item.dto';
import { UpdateItemDto } from './dtos/update-item.dto';
import { ListItemsQueryDto } from './dtos/list-items.query.dto';
import {
  Item,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Prisma,
} from '@prisma/client';

export interface ItemWithPhotos extends Item {
  photos: Array<{
    id: string;
    url: string;
    width?: number;
    height?: number;
    createdAt: Date;
  }>;
  owner: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface PaginatedItems {
  items: ItemWithPhotos[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Crée un nouvel item
   */
  async createItem(
    userId: string,
    createItemDto: CreateItemDto,
  ): Promise<ItemWithPhotos> {
    const { aiAuto, ...itemData } = createItemDto;

    // Analyse IA si demandée
    let aiAnalysis = null;
    if (aiAuto) {
      console.log('🔍 Début analyse IA pour:', itemData.title);
      aiAnalysis = await this.geminiService.analyzeItem({
        title: itemData.title,
        description: itemData.description,
      });
      console.log('🤖 Résultat analyse IA:', aiAnalysis);
    }

    // Utiliser l'analyse IA si disponible
    const finalItemData = {
      ...itemData,
      ownerId: userId,
      category: aiAnalysis?.category || itemData.category || 'OTHER', // Fallback par défaut
      tags: aiAnalysis?.tags || itemData.tags || [],
      aiSummary: aiAnalysis?.aiSummary,
      aiRepairTip: aiAnalysis?.aiRepairTip,
    };

    // Vérifier que la catégorie est définie et valide
    if (!finalItemData.category) {
      throw new BadRequestException(
        'Catégorie requise (spécifiez category ou utilisez aiAuto=true)',
      );
    }

    // Vérifier que la catégorie est valide
    const validCategories = [
      'ELECTRONICS', 'CLOTHING', 'BOOKS', 'FURNITURE', 'SPORTS', 'TOYS', 'OTHER'
    ];
    if (!validCategories.includes(finalItemData.category)) {
      throw new BadRequestException(
        `Catégorie invalide. Catégories valides: ${validCategories.join(', ')}`,
      );
    }

    const item = await this.prisma.item.create({
      data: finalItemData,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return item;
  }

  /**
   * Liste les items avec filtres et pagination
   */
  async listItems(query: ListItemsQueryDto): Promise<PaginatedItems> {
    const {
      page = 1,
      limit = 20,
      q,
      category,
      condition,
      status,
      ownerId,
      sort = '-createdAt',
    } = query;
    
    // Convertir en numbers pour éviter les erreurs Prisma
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where: Prisma.ItemWhereInput = {
      status: status || ItemStatus.AVAILABLE, // Par défaut, seulement les items disponibles
    };

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.condition = condition;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Recherche full-text
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    // Construire l'ordre de tri
    const orderBy: Prisma.ItemOrderByWithRelationInput = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    // Requêtes parallèles
    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          photos: {
            select: {
              id: true,
              url: true,
              width: true,
              height: true,
              createdAt: true,
            },
          },
          owner: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Récupère un item par ID
   */
  async getItemById(id: string): Promise<ItemWithPhotos> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    return item;
  }

  /**
   * Met à jour un item (propriétaire uniquement)
   */
  async updateItem(
    id: string,
    userId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemWithPhotos> {
    // Vérifier que l'item existe et que l'utilisateur est le propriétaire
    const existingItem = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Item non trouvé');
    }

    if (existingItem.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres items',
      );
    }

    // Analyse IA si demandée et si les données ont changé
    let aiAnalysis = null;
    if (
      updateItemDto.aiAuto &&
      (updateItemDto.title || updateItemDto.description)
    ) {
      aiAnalysis = await this.geminiService.analyzeItem({
        title: updateItemDto.title || existingItem.title,
        description: updateItemDto.description || existingItem.description,
      });
    }

    // Préparer les données de mise à jour
    const { aiAuto, ...updateData } = updateItemDto;

    if (aiAnalysis) {
      updateData.category = aiAnalysis.category;
      updateData.tags = aiAnalysis.tags;
      (updateData as any).aiSummary = aiAnalysis.aiSummary;
      (updateData as any).aiRepairTip = aiAnalysis.aiRepairTip;
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedItem;
  }

  /**
   * Supprime un item (propriétaire uniquement)
   */
  async deleteItem(id: string, userId: string): Promise<void> {
    // Vérifier que l'item existe et que l'utilisateur est le propriétaire
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    if (item.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres items',
      );
    }

    // Supprimer l'item (les photos seront supprimées en cascade)
    await this.prisma.item.delete({
      where: { id },
    });
  }

  /**
   * Récupère les items d'un utilisateur
   */
  async getUserItems(
    userId: string,
    query: Omit<ListItemsQueryDto, 'ownerId'>,
  ): Promise<PaginatedItems> {
    return this.listItems({ ...query, ownerId: userId });
  }

  /**
   * Met à jour le statut d'un item
   */
  async updateItemStatus(
    id: string,
    userId: string,
    status: ItemStatus,
  ): Promise<ItemWithPhotos> {
    // Vérifier que l'item existe et que l'utilisateur est le propriétaire
    const existingItem = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Item non trouvé');
    }

    if (existingItem.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres items',
      );
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: { status },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedItem;
  }

  /**
   * Recherche d'items par tags
   */
  async searchByTags(
    tags: string[],
    limit: number = 20,
  ): Promise<ItemWithPhotos[]> {
    return this.prisma.item.findMany({
      where: {
        status: ItemStatus.AVAILABLE,
        tags: {
          hasSome: tags,
        },
      },
      take: limit,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

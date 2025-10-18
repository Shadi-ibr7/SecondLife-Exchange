import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateItemDto, UpdateItemDto } from './items.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createItemDto: CreateItemDto) {
    return this.prisma.item.create({
      data: {
        ...createItemDto,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20, category?: string, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      isAvailable: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            location: true,
            createdAt: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Objet non trouvé');
    }

    return item;
  }

  async update(userId: string, id: string, updateItemDto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Objet non trouvé');
    }

    if (item.ownerId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cet objet');
    }

    return this.prisma.item.update({
      where: { id },
      data: updateItemDto,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Objet non trouvé');
    }

    if (item.ownerId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cet objet');
    }

    await this.prisma.item.delete({
      where: { id },
    });

    return { message: 'Objet supprimé avec succès' };
  }

  async findByOwner(ownerId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where: { ownerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.item.count({ where: { ownerId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCategories() {
    const categories = await this.prisma.item.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { isAvailable: true },
    });

    return categories.map(c => c.category);
  }
}

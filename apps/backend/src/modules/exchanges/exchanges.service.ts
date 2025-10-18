import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExchangeDto, UpdateExchangeDto } from './exchanges.dto';
import { ExchangeStatus } from '@prisma/client';

@Injectable()
export class ExchangesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createExchangeDto: CreateExchangeDto) {
    const { itemId, message } = createExchangeDto;

    // Vérifier que l'objet existe et est disponible
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { owner: true },
    });

    if (!item) {
      throw new NotFoundException('Objet non trouvé');
    }

    if (!item.isAvailable) {
      throw new BadRequestException('Cet objet n\'est plus disponible');
    }

    if (item.ownerId === userId) {
      throw new BadRequestException('Vous ne pouvez pas proposer un échange pour votre propre objet');
    }

    // Vérifier qu'il n'y a pas déjà un échange en cours pour cet objet
    const existingExchange = await this.prisma.exchange.findFirst({
      where: {
        itemId,
        status: { in: [ExchangeStatus.PENDING, ExchangeStatus.ACCEPTED] },
      },
    });

    if (existingExchange) {
      throw new BadRequestException('Un échange est déjà en cours pour cet objet');
    }

    return this.prisma.exchange.create({
      data: {
        initiatorId: userId,
        receiverId: item.ownerId,
        itemId,
        message,
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
        item: {
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
        },
      },
    });
  }

  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [exchanges, total] = await Promise.all([
      this.prisma.exchange.findMany({
        where: {
          OR: [
            { initiatorId: userId },
            { receiverId: userId },
          ],
        },
        skip,
        take: limit,
        include: {
          initiator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              location: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              location: true,
            },
          },
          item: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exchange.count({
        where: {
          OR: [
            { initiatorId: userId },
            { receiverId: userId },
          ],
        },
      }),
    ]);

    return {
      exchanges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
        item: {
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
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Vérifier que l'utilisateur a accès à cet échange
    if (exchange.initiatorId !== userId && exchange.receiverId !== userId) {
      throw new ForbiddenException('Accès refusé à cet échange');
    }

    return exchange;
  }

  async update(id: string, userId: string, updateExchangeDto: UpdateExchangeDto) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Seul le receveur peut accepter/refuser un échange
    if (exchange.receiverId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cet échange');
    }

    if (exchange.status !== ExchangeStatus.PENDING) {
      throw new BadRequestException('Cet échange ne peut plus être modifié');
    }

    const updatedExchange = await this.prisma.exchange.update({
      where: { id },
      data: {
        status: updateExchangeDto.status,
        ...(updateExchangeDto.status === ExchangeStatus.COMPLETED && {
          completedAt: new Date(),
        }),
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            location: true,
          },
        },
        item: {
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
        },
      },
    });

    // Si l'échange est accepté, marquer l'objet comme non disponible
    if (updateExchangeDto.status === ExchangeStatus.ACCEPTED) {
      await this.prisma.item.update({
        where: { id: exchange.itemId },
        data: { isAvailable: false },
      });
    }

    return updatedExchange;
  }

  async cancel(id: string, userId: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Seul l'initiateur peut annuler un échange
    if (exchange.initiatorId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas annuler cet échange');
    }

    if (exchange.status !== ExchangeStatus.PENDING) {
      throw new BadRequestException('Cet échange ne peut plus être annulé');
    }

    await this.prisma.exchange.update({
      where: { id },
      data: { status: ExchangeStatus.CANCELLED },
    });

    return { message: 'Échange annulé avec succès' };
  }
}

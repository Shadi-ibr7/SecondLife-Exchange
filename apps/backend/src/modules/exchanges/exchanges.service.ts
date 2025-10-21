import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExchangeInput } from './dtos/create-exchange.dto';
import { UpdateExchangeStatusInput } from './dtos/update-exchange-status.dto';
import { PaginationInput } from '../../common/dtos/pagination.dto';

@Injectable()
export class ExchangesService {
  constructor(private prisma: PrismaService) {}

  async createExchange(requesterId: string, input: CreateExchangeInput) {
    const { responderId, requestedItemTitle, offeredItemTitle, message } =
      input;

    // Vérifier que le répondant existe
    const responder = await this.prisma.user.findUnique({
      where: { id: responderId },
    });

    if (!responder) {
      throw new NotFoundException('Utilisateur répondant non trouvé');
    }

    // Vérifier qu'on ne fait pas d'échange avec soi-même
    if (requesterId === responderId) {
      throw new BadRequestException(
        'Impossible de créer un échange avec soi-même',
      );
    }

    return this.prisma.exchange.create({
      data: {
        requesterId,
        responderId,
        requestedItemTitle,
        offeredItemTitle,
        message,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async updateExchangeStatus(
    exchangeId: string,
    userId: string,
    input: UpdateExchangeStatusInput,
  ) {
    const { status } = input;

    // Récupérer l'échange
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        requester: true,
        responder: true,
      },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Vérifier que l'utilisateur peut modifier cet échange
    if (exchange.requesterId !== userId && exchange.responderId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cet échange",
      );
    }

    // Vérifier que l'échange n'est pas déjà terminé
    if (exchange.status === 'COMPLETED' || exchange.status === 'CANCELLED') {
      throw new BadRequestException('Cet échange ne peut plus être modifié');
    }

    // Logique métier pour les changements de statut
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return this.prisma.exchange.update({
      where: { id: exchangeId },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getMyExchanges(
    userId: string,
    pagination: PaginationInput,
    status?: string,
  ) {
    const { page = 1, limit = 20, sort = '-createdAt' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ requesterId: userId }, { responderId: userId }],
    };

    if (status) {
      where.status = status;
    }

    // Gérer le tri
    let orderBy: any = { createdAt: 'desc' };
    if (sort) {
      if (sort.startsWith('-')) {
        const field = sort.substring(1);
        orderBy = { [field]: 'desc' };
      } else {
        orderBy = { [sort]: 'asc' };
      }
    }

    const [exchanges, total] = await Promise.all([
      this.prisma.exchange.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          responder: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.exchange.count({ where }),
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

  async getExchangeById(exchangeId: string, userId: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Vérifier que l'utilisateur peut voir cet échange
    if (exchange.requesterId !== userId && exchange.responderId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à voir cet échange",
      );
    }

    return exchange;
  }
}

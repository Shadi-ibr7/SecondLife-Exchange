import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMessageDto } from './chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });
  }

  async validateExchangeAccess(exchangeId: string, userId: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
    });

    if (!exchange) {
      return null;
    }

    if (exchange.initiatorId !== userId && exchange.receiverId !== userId) {
      return null;
    }

    return exchange;
  }

  async createMessage(createMessageDto: CreateMessageDto & { senderId: string; exchangeId: string }) {
    return this.prisma.message.create({
      data: createMessageDto,
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
    });
  }

  async getMessages(exchangeId: string, userId: string, page: number = 1, limit: number = 50) {
    // Vérifier l'accès à l'échange
    const exchange = await this.validateExchangeAccess(exchangeId, userId);
    if (!exchange) {
      throw new ForbiddenException('Accès refusé à cet échange');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { exchangeId },
        skip,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where: { exchangeId } }),
    ]);

    return {
      messages: messages.reverse(), // Inverser pour avoir les plus anciens en premier
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

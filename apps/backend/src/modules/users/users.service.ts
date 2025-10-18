import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto } from './users.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username, isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserStats(userId: string) {
    const [itemsCount, exchangesInitiated, exchangesReceived] = await Promise.all([
      this.prisma.item.count({
        where: { ownerId: userId, isAvailable: true },
      }),
      this.prisma.exchange.count({
        where: { initiatorId: userId },
      }),
      this.prisma.exchange.count({
        where: { receiverId: userId },
      }),
    ]);

    return {
      itemsCount,
      exchangesInitiated,
      exchangesReceived,
    };
  }
}

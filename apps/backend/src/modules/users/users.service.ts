import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileInput } from './dtos/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roles: [user.roles],
      createdAt: user.createdAt,
      profile: user.profile,
    };
  }

  async updateMe(userId: string, input: UpdateProfileInput) {
    const { displayName, avatarUrl, bio, location, preferencesJson } = input;

    return this.prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(displayName && { displayName }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          roles: true,
          createdAt: true,
        },
      });

      // Mettre à jour le profil
      await tx.userProfile.upsert({
        where: { userId },
        update: {
          ...(bio !== undefined && { bio }),
          ...(location !== undefined && { location }),
          ...(preferencesJson !== undefined && { preferencesJson }),
        },
        create: {
          userId,
          bio,
          location,
          preferencesJson,
        },
      });

      // Récupérer le profil mis à jour
      const profile = await tx.userProfile.findUnique({
        where: { userId },
      });

      return {
        ...user,
        roles: [user.roles],
        profile,
      };
    });
  }

  async deleteMe(userId: string) {
    // Suppression en cascade : RefreshToken + UserProfile + User
    await this.prisma.$transaction(async (tx) => {
      // Supprimer les refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Supprimer le profil
      await tx.userProfile.deleteMany({
        where: { userId },
      });

      // Supprimer l'utilisateur
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}

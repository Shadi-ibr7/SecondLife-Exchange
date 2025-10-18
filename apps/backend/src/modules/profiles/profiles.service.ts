import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      bio?: string | null;
      location?: string | null;
      preferencesJson?: Record<string, any> | null;
    },
  ) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async deleteProfile(userId: string) {
    return this.prisma.userProfile.delete({
      where: { userId },
    });
  }
}

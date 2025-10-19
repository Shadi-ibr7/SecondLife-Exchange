import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateThemeDto } from './dtos/create-theme.dto';
import { UpdateThemeDto } from './dtos/update-theme.dto';
import { WeeklyTheme, Prisma } from '@prisma/client';

export interface ThemeWithSuggestions extends WeeklyTheme {
  suggestions: Array<{
    id: string;
    name: string;
    category: string;
    country: string;
    era: string | null;
    popularity: number | null;
    createdAt: Date;
  }>;
}

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un nouveau thème hebdomadaire
   */
  async createTheme(createThemeDto: CreateThemeDto): Promise<WeeklyTheme> {
    // Vérifier que le slug est unique
    const existingTheme = await this.prisma.weeklyTheme.findUnique({
      where: { slug: createThemeDto.slug },
    });

    if (existingTheme) {
      throw new BadRequestException('Un thème avec ce slug existe déjà');
    }

    // Si on active ce thème, désactiver les autres
    if (createThemeDto.isActive) {
      await this.prisma.weeklyTheme.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.weeklyTheme.create({
      data: createThemeDto,
    });
  }

  /**
   * Met à jour un thème
   */
  async updateTheme(
    id: string,
    updateThemeDto: UpdateThemeDto,
  ): Promise<WeeklyTheme> {
    const existingTheme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
    });

    if (!existingTheme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Vérifier l'unicité du slug si modifié
    if (updateThemeDto.slug && updateThemeDto.slug !== existingTheme.slug) {
      const slugExists = await this.prisma.weeklyTheme.findUnique({
        where: { slug: updateThemeDto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Un thème avec ce slug existe déjà');
      }
    }

    // Si on active ce thème, désactiver les autres
    if (updateThemeDto.isActive) {
      await this.prisma.weeklyTheme.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.weeklyTheme.update({
      where: { id },
      data: updateThemeDto,
    });
  }

  /**
   * Récupère le thème actif
   */
  async getActiveTheme(): Promise<ThemeWithSuggestions | null> {
    return this.prisma.weeklyTheme.findFirst({
      where: { isActive: true },
      include: {
        suggestions: {
          select: {
            id: true,
            name: true,
            category: true,
            country: true,
            era: true,
            popularity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Récupère un thème par ID
   */
  async getThemeById(id: string): Promise<ThemeWithSuggestions> {
    const theme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
      include: {
        suggestions: {
          select: {
            id: true,
            name: true,
            category: true,
            country: true,
            era: true,
            popularity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    return theme;
  }

  /**
   * Liste les thèmes avec pagination
   */
  async listThemes(
    page: number = 1,
    limit: number = 20,
    from?: string,
    to?: string,
  ): Promise<{
    themes: WeeklyTheme[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: Prisma.WeeklyThemeWhereInput = {};

    if (from || to) {
      where.startOfWeek = {};
      if (from) {
        where.startOfWeek.gte = new Date(from);
      }
      if (to) {
        where.startOfWeek.lte = new Date(to);
      }
    }

    const [themes, total] = await Promise.all([
      this.prisma.weeklyTheme.findMany({
        where,
        orderBy: { startOfWeek: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.weeklyTheme.count({ where }),
    ]);

    return {
      themes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Active un thème (désactive les autres)
   */
  async activateTheme(id: string): Promise<WeeklyTheme> {
    const theme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Désactiver tous les autres thèmes
    await this.prisma.weeklyTheme.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activer le thème sélectionné
    return this.prisma.weeklyTheme.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Supprime un thème
   */
  async deleteTheme(id: string): Promise<void> {
    const theme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    await this.prisma.weeklyTheme.delete({
      where: { id },
    });
  }

  /**
   * Trouve ou crée le thème actif pour une date donnée
   */
  async findOrCreateActiveThemeForDate(date: Date): Promise<WeeklyTheme> {
    // Trouver le lundi de la semaine
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    // Chercher un thème pour cette semaine
    let theme = await this.prisma.weeklyTheme.findFirst({
      where: {
        startOfWeek: {
          gte: monday,
          lt: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Si aucun thème trouvé, créer un thème par défaut
    if (!theme) {
      const defaultTitle = `Thème de la semaine du ${monday.toLocaleDateString('fr-FR')}`;
      const defaultSlug = `theme-${monday.toISOString().split('T')[0]}`;

      theme = await this.prisma.weeklyTheme.create({
        data: {
          title: defaultTitle,
          slug: defaultSlug,
          startOfWeek: monday,
          impactText:
            "Thème généré automatiquement pour encourager l'échange d'objets écoresponsables.",
          isActive: true,
        },
      });

      // Désactiver les autres thèmes
      await this.prisma.weeklyTheme.updateMany({
        where: {
          isActive: true,
          id: { not: theme.id },
        },
        data: { isActive: false },
      });
    }

    return theme;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from './gemini.service';
import {
  CreateEcoContentInput,
  UpdateEcoContentInput,
  ListEcoContentInput,
  EcoContentResponse,
  PaginatedEcoContentResponse,
  EnrichEcoContentResponse,
} from './dtos/eco-content.dto';

@Injectable()
export class EcoService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Liste les contenus éco avec filtres et pagination
   */
  async listEcoContent(
    query: ListEcoContentInput,
  ): Promise<PaginatedEcoContentResponse> {
    const { page = 1, limit = 20, kind, tag, locale, q } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtres
    if (kind) {
      where.kind = kind;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (locale) {
      where.locale = locale;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { source: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.ecoContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.ecoContent.count({ where }),
    ]);

    return {
      items: items.map(this.mapToResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère un contenu éco par ID
   */
  async getEcoContentById(id: string): Promise<EcoContentResponse> {
    const item = await this.prisma.ecoContent.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    return this.mapToResponse(item);
  }

  /**
   * Crée un nouveau contenu éco
   */
  async createEcoContent(
    input: CreateEcoContentInput,
  ): Promise<EcoContentResponse> {
    const item = await this.prisma.ecoContent.create({
      data: {
        kind: input.kind,
        title: input.title,
        url: input.url,
        locale: input.locale,
        tags: input.tags || [],
        source: input.source,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      },
    });

    return this.mapToResponse(item);
  }

  /**
   * Met à jour un contenu éco
   */
  async updateEcoContent(
    id: string,
    input: UpdateEcoContentInput,
  ): Promise<EcoContentResponse> {
    const existingItem = await this.prisma.ecoContent.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    const updateData: any = {};

    if (input.kind !== undefined) updateData.kind = input.kind;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.url !== undefined) updateData.url = input.url;
    if (input.locale !== undefined) updateData.locale = input.locale;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.publishedAt !== undefined) {
      updateData.publishedAt = input.publishedAt
        ? new Date(input.publishedAt)
        : null;
    }

    const item = await this.prisma.ecoContent.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(item);
  }

  /**
   * Supprime un contenu éco
   */
  async deleteEcoContent(id: string): Promise<void> {
    const existingItem = await this.prisma.ecoContent.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    await this.prisma.ecoContent.delete({
      where: { id },
    });
  }

  /**
   * Enrichit un contenu éco avec Gemini
   */
  async enrichEcoContent(id: string): Promise<EnrichEcoContentResponse> {
    const item = await this.prisma.ecoContent.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    try {
      // Appeler Gemini pour enrichir le contenu
      const enrichment = await this.geminiService.enrichEcoContent({
        title: item.title,
        url: item.url,
      });

      // Mettre à jour le contenu avec les données enrichies
      await this.prisma.ecoContent.update({
        where: { id },
        data: {
          summary: enrichment.summary,
          tags: enrichment.tags,
          kpis: enrichment.kpis,
        },
      });

      return enrichment;
    } catch (error) {
      throw new BadRequestException(
        `Échec de l'enrichissement: ${error.message}`,
      );
    }
  }

  /**
   * Récupère les tags populaires
   */
  async getPopularTags(limit: number = 20): Promise<string[]> {
    const result = await this.prisma.ecoContent.findMany({
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();

    result.forEach((item) => {
      item.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  /**
   * Récupère les statistiques des contenus
   */
  async getEcoContentStats(): Promise<{
    total: number;
    byKind: Record<string, number>;
    byLocale: Record<string, number>;
  }> {
    const [total, items] = await Promise.all([
      this.prisma.ecoContent.count(),
      this.prisma.ecoContent.findMany({
        select: { kind: true, locale: true },
      }),
    ]);

    const byKind: Record<string, number> = {};
    const byLocale: Record<string, number> = {};

    items.forEach((item) => {
      byKind[item.kind] = (byKind[item.kind] || 0) + 1;
      if (item.locale) {
        byLocale[item.locale] = (byLocale[item.locale] || 0) + 1;
      }
    });

    return { total, byKind, byLocale };
  }

  /**
   * Mappe un item Prisma vers la réponse API
   */
  private mapToResponse(item: any): EcoContentResponse {
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      url: item.url,
      locale: item.locale,
      tags: item.tags,
      source: item.source,
      summary: item.summary,
      kpis: item.kpis,
      publishedAt: item.publishedAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }
}

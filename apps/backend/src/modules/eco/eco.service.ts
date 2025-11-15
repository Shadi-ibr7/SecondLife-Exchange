/**
 * FICHIER: eco.service.ts
 *
 * DESCRIPTION:
 * Ce service gère les contenus éco-éducatifs de l'application.
 * Il permet de créer, lister, mettre à jour et enrichir des contenus
 * qui éduquent les utilisateurs sur l'impact écologique de l'échange d'objets.
 *
 * FONCTIONNALITÉS:
 * - Création de contenus éco-éducatifs (articles, vidéos, statistiques)
 * - Liste paginée avec filtres (type, tag, langue, recherche textuelle)
 * - Mise à jour et suppression de contenus (admin uniquement)
 * - Enrichissement automatique avec IA (résumé, tags, KPIs)
 * - Statistiques des contenus (tags populaires, etc.)
 *
 * TYPES DE CONTENUS:
 * - ARTICLE: Articles éducatifs
 * - VIDEO: Vidéos éducatives
 * - STAT: Statistiques et données
 */

// Import des exceptions NestJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

// Import des services
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from './gemini.service';

// Import des DTOs
import {
  CreateEcoContentInput,
  UpdateEcoContentInput,
  ListEcoContentInput,
  EcoContentResponse,
  PaginatedEcoContentResponse,
  EnrichEcoContentResponse,
} from './dtos/eco-content.dto';

/**
 * SERVICE: EcoService
 *
 * Service pour la gestion des contenus éco-éducatifs.
 */
@Injectable()
export class EcoService {
  /**
   * CONSTRUCTEUR
   *
   * Injection des dépendances.
   */
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  // ============================================
  // MÉTHODE: listEcoContent (Lister les contenus)
  // ============================================

  /**
   * Liste les contenus éco-éducatifs avec filtres et pagination.
   *
   * FILTRES DISPONIBLES:
   * - kind: Type de contenu (ARTICLE, VIDEO, STAT)
   * - tag: Filtrer par tag
   * - locale: Filtrer par langue
   * - q: Recherche textuelle (titre, résumé, source)
   *
   * @param query - Paramètres de filtrage et pagination
   * @returns Liste paginée de contenus éco
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

  // ============================================
  // MÉTHODE: getEcoContentById (Récupérer un contenu)
  // ============================================

  /**
   * Récupère un contenu éco-éducatif par son ID.
   *
   * @param id - ID du contenu
   * @returns Contenu éco avec toutes ses informations
   * @throws NotFoundException si le contenu n'existe pas
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

  // ============================================
  // MÉTHODE: createEcoContent (Créer un contenu)
  // ============================================

  /**
   * Crée un nouveau contenu éco-éducatif.
   *
   * @param input - Données du contenu à créer
   * @returns Contenu créé
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

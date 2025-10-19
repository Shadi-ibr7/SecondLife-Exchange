import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService, SuggestedItemWithMetadata } from '../ai/gemini.service';
import { HashUtil } from '../../common/utils/hash.util';
import { ConfigService } from '@nestjs/config';

export interface SuggestionStats {
  created: number;
  ignored: number;
  errors: number;
  duplicates: number;
  diversityFiltered: number;
}

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly scheduleConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly configService: ConfigService,
  ) {
    this.scheduleConfig = this.configService.get('schedule');
  }

  /**
   * Génère et sauvegarde des suggestions pour un thème
   */
  async generateAndSaveSuggestions(
    themeId: string,
    themeTitle: string,
    locale: string[] = ['FR', 'MA', 'JP', 'US', 'BR'],
  ): Promise<SuggestionStats> {
    const stats: SuggestionStats = {
      created: 0,
      ignored: 0,
      errors: 0,
      duplicates: 0,
      diversityFiltered: 0,
    };

    try {
      this.logger.log(
        `Début génération suggestions pour le thème: ${themeTitle}`,
      );

      // Générer les suggestions via l'IA
      const rawSuggestions = await this.geminiService.generateSuggestions({
        themeTitle,
        locale,
      });

      if (rawSuggestions.length === 0) {
        this.logger.warn("Aucune suggestion générée par l'IA");
        return stats;
      }

      this.logger.log(`${rawSuggestions.length} suggestions brutes générées`);

      // Appliquer les règles de diversité et déduplication
      const filteredSuggestions = await this.applyDiversityAndDeduplication(
        themeId,
        rawSuggestions,
        stats,
      );

      // Sauvegarder les suggestions filtrées
      for (const suggestion of filteredSuggestions) {
        try {
          await this.prisma.suggestedItem.create({
            data: {
              themeId,
              name: suggestion.name,
              category: suggestion.category,
              country: suggestion.country,
              era: suggestion.era,
              materials: suggestion.materials,
              ecoReason: suggestion.ecoReason,
              repairDifficulty: suggestion.repairDifficulty,
              popularity: suggestion.popularity,
              tags: suggestion.tags,
              photoRef: suggestion.photoRef,
              aiModel: suggestion.aiModel,
              aiPromptHash: suggestion.aiPromptHash,
              aiRaw: suggestion.aiRaw,
            },
          });
          stats.created++;
        } catch (error) {
          this.logger.error(`Erreur sauvegarde suggestion: ${error.message}`);
          stats.errors++;
        }
      }

      this.logger.log(
        `Génération terminée: ${stats.created} créées, ${stats.ignored} ignorées, ${stats.errors} erreurs`,
      );
      return stats;
    } catch (error) {
      this.logger.error(`Erreur génération suggestions: ${error.message}`);
      stats.errors++;
      return stats;
    }
  }

  /**
   * Applique les règles de diversité et déduplication
   */
  private async applyDiversityAndDeduplication(
    themeId: string,
    suggestions: SuggestedItemWithMetadata[],
    stats: SuggestionStats,
  ): Promise<SuggestedItemWithMetadata[]> {
    const filtered: SuggestedItemWithMetadata[] = [];
    const countryCounts = new Map<string, number>();
    const eraCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    // Récupérer les suggestions existantes pour la déduplication
    const existingHashes = await this.getExistingHashes(themeId);

    for (const suggestion of suggestions) {
      // Nettoyer et normaliser
      const cleaned = this.cleanSuggestion(suggestion);

      // Vérifier la déduplication
      const hash = HashUtil.canonicalHash(
        cleaned.name,
        cleaned.country,
        cleaned.era,
        cleaned.category,
      );

      if (existingHashes.has(hash)) {
        stats.duplicates++;
        continue;
      }

      // Vérifier les limites de diversité
      const countryCount = countryCounts.get(cleaned.country) || 0;
      const eraCount = cleaned.era ? eraCounts.get(cleaned.era) || 0 : 0;
      const categoryCount = categoryCounts.get(cleaned.category) || 0;

      if (countryCount >= this.scheduleConfig.maxSuggestionsPerCountry) {
        stats.diversityFiltered++;
        continue;
      }

      if (cleaned.era && eraCount >= this.scheduleConfig.maxSuggestionsPerEra) {
        stats.diversityFiltered++;
        continue;
      }

      // Ajouter la suggestion
      filtered.push(cleaned);

      // Mettre à jour les compteurs
      countryCounts.set(cleaned.country, countryCount + 1);
      if (cleaned.era) {
        eraCounts.set(cleaned.era, eraCount + 1);
      }
      categoryCounts.set(cleaned.category, categoryCount + 1);
    }

    return filtered;
  }

  /**
   * Récupère les hashes des suggestions existantes pour la déduplication
   */
  private async getExistingHashes(themeId: string): Promise<Set<string>> {
    const lookbackDate = new Date();
    lookbackDate.setDate(
      lookbackDate.getDate() - this.scheduleConfig.lookbackWeeks * 7,
    );

    const existingSuggestions = await this.prisma.suggestedItem.findMany({
      where: {
        createdAt: {
          gte: lookbackDate,
        },
      },
      select: {
        name: true,
        country: true,
        era: true,
        category: true,
      },
    });

    const hashes = new Set<string>();
    for (const suggestion of existingSuggestions) {
      const hash = HashUtil.canonicalHash(
        suggestion.name,
        suggestion.country,
        suggestion.era,
        suggestion.category,
      );
      hashes.add(hash);
    }

    return hashes;
  }

  /**
   * Nettoie et normalise une suggestion
   */
  private cleanSuggestion(
    suggestion: SuggestedItemWithMetadata,
  ): SuggestedItemWithMetadata {
    return {
      ...suggestion,
      name: suggestion.name.trim().substring(0, 120),
      category: suggestion.category.trim().substring(0, 50),
      country: suggestion.country.trim().substring(0, 50),
      era: suggestion.era ? suggestion.era.trim().substring(0, 50) : null,
      materials: suggestion.materials
        ? suggestion.materials.trim().substring(0, 200)
        : null,
      ecoReason: suggestion.ecoReason.trim().substring(0, 240),
      tags: suggestion.tags
        .map((tag) => tag.trim().substring(0, 30))
        .filter((tag) => tag.length > 0)
        .slice(0, 8),
      photoRef: suggestion.photoRef
        ? suggestion.photoRef.trim().substring(0, 200)
        : null,
    };
  }

  /**
   * Récupère les suggestions d'un thème avec pagination
   */
  async getThemeSuggestions(
    themeId: string,
    page: number = 1,
    limit: number = 20,
    sort: string = '-createdAt',
  ): Promise<{
    suggestions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    // Construire l'ordre de tri
    const orderBy: any = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [suggestions, total] = await Promise.all([
      this.prisma.suggestedItem.findMany({
        where: { themeId },
        orderBy,
        skip,
        take: maxLimit,
        select: {
          id: true,
          name: true,
          category: true,
          country: true,
          era: true,
          materials: true,
          ecoReason: true,
          repairDifficulty: true,
          popularity: true,
          tags: true,
          photoRef: true,
          createdAt: true,
        },
      }),
      this.prisma.suggestedItem.count({ where: { themeId } }),
    ]);

    return {
      suggestions,
      total,
      page,
      limit: maxLimit,
      totalPages: Math.ceil(total / maxLimit),
    };
  }

  /**
   * Récupère les statistiques des suggestions pour un thème
   */
  async getThemeStats(themeId: string): Promise<{
    total: number;
    byCountry: Record<string, number>;
    byCategory: Record<string, number>;
    byEra: Record<string, number>;
  }> {
    const suggestions = await this.prisma.suggestedItem.findMany({
      where: { themeId },
      select: {
        country: true,
        category: true,
        era: true,
      },
    });

    const stats = {
      total: suggestions.length,
      byCountry: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byEra: {} as Record<string, number>,
    };

    for (const suggestion of suggestions) {
      stats.byCountry[suggestion.country] =
        (stats.byCountry[suggestion.country] || 0) + 1;
      stats.byCategory[suggestion.category] =
        (stats.byCategory[suggestion.category] || 0) + 1;
      if (suggestion.era) {
        stats.byEra[suggestion.era] = (stats.byEra[suggestion.era] || 0) + 1;
      }
    }

    return stats;
  }
}

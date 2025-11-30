/**
 * FICHIER: matching.service.ts
 *
 * DESCRIPTION:
 * Ce service gère le système de recommandations d'items personnalisées.
 * Il utilise un algorithme de scoring basé sur les préférences utilisateur,
 * l'historique d'échanges, et la popularité des items.
 *
 * FONCTIONNALITÉS:
 * - Génération de recommandations personnalisées pour un utilisateur
 * - Calcul de scores basés sur plusieurs critères (catégorie, état, popularité, etc.)
 * - Application de filtres de diversité (évite les recommandations trop similaires)
 * - Gestion des préférences utilisateur (catégories préférées/détestées, conditions, etc.)
 * - Exclusion des items déjà possédés ou déjà échangés
 *
 * ALGORITHME DE SCORING:
 * - Score de catégorie: +10 si catégorie préférée, -5 si détestée
 * - Score d'état: +5 si condition préférée
 * - Score de popularité: basé sur popularityScore de l'item
 * - Score d'historique: -10 si déjà échangé avec cet utilisateur
 * - Diversité: pénalise les items trop similaires
 */

// Import des exceptions NestJS
import { Injectable, NotFoundException } from '@nestjs/common';

// Import du service Prisma
import { PrismaService } from '../../common/prisma/prisma.service';

// Import des DTOs
import {
  RecommendationsQueryInput,
  Recommendation,
  RecommendationReason,
} from './dtos/recommendations.dto';
import { SavePreferencesInput } from './dtos/preferences.dto';

/**
 * SERVICE: MatchingService
 *
 * Service dédié au moteur de recommandations personnalisées.
 * Il orchestre les lectures Prisma (preferences, items, historiques) puis calcule
 * un score pour chaque item avant de renvoyer une liste diversifiée.
 */
@Injectable()
export class MatchingService {
  /**
   * CONSTRUCTEUR
   *
   * Prisma est la seule dépendance: tout le scoring se fait en mémoire dans ce service.
   */
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MÉTHODE: getRecommendations
  // ============================================

  /**
   * Récupère les recommandations d'items personnalisées pour un utilisateur.
   *
   * PROCESSUS:
   * 1. Récupère les préférences de l'utilisateur
   * 2. Récupère les items de l'utilisateur (pour exclusion)
   * 3. Récupère l'historique d'échanges (pour exclusion)
   * 4. Récupère les candidats items avec filtres de préférences
   * 5. Calcule les scores pour chaque candidat
   * 6. Applique les filtres de diversité
   * 7. Retourne les meilleures recommandations
   *
   * @param userId - ID de l'utilisateur
   * @param query - Paramètres de requête (limit, etc.)
   * @returns Recommandations avec scores et raisons
   */
  async getRecommendations(
    userId: string,
    query: RecommendationsQueryInput,
  ): Promise<{
    recommendations: Recommendation[];
    total: number;
    userPreferences?: any;
  }> {
    const { limit = 20 } = query;

    // Récupérer les préférences de l'utilisateur
    const preferences = await this.prisma.preference.findUnique({
      where: { userId },
    });

    // Récupérer les items de l'utilisateur pour les exclure
    const userItems = await this.prisma.item.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const userItemIds = userItems.map((item) => item.id);

    // Récupérer les échanges historiques pour éviter les doublons
    const historicalExchanges = await this.prisma.exchange.findMany({
      where: {
        OR: [{ requesterId: userId }, { responderId: userId }],
      },
      select: {
        requestedItemTitle: true,
        offeredItemTitle: true,
      },
    });

    // Construire la requête de base pour les candidats
    const whereClause: any = {
      status: 'AVAILABLE',
      ownerId: { not: userId }, // Exclure les items de l'utilisateur
    };

    // Appliquer les filtres de préférences
    if (preferences) {
      if (preferences.dislikedCategories.length > 0) {
        whereClause.category = { notIn: preferences.dislikedCategories };
      }
      if (preferences.preferredConditions.length > 0) {
        whereClause.condition = { in: preferences.preferredConditions };
      }
    }

    // Récupérer les candidats
    const candidates = await this.prisma.item.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
          },
        },
      },
      orderBy: { popularityScore: 'desc' },
      take: limit * 3, // On prend plus d'items que nécessaire pour pouvoir filtrer ensuite (diversité)
    });

    // Calculer les scores et appliquer les filtres de diversité
    const scoredRecommendations = await this.calculateScores(
      candidates,
      preferences,
      historicalExchanges,
      userId,
    );

    // Appliquer les filtres de diversité
    const diversifiedRecommendations = this.applyDiversityFilters(
      scoredRecommendations,
      limit,
    );

    return {
      recommendations: diversifiedRecommendations,
      total: diversifiedRecommendations.length,
      userPreferences: preferences
        ? {
            preferredCategories: preferences.preferredCategories,
            preferredConditions: preferences.preferredConditions,
            country: preferences.country,
          }
        : undefined,
    };
  }

  /**
   * Calcule les scores pour chaque candidat
   */
  private async calculateScores(
    candidates: any[],
    preferences: any,
    historicalExchanges: any[],
    userId: string,
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const item of candidates) {
      const reasons: RecommendationReason[] = [];
      let score = 0;

      // Score catégorie (+20 si préférée)
      if (preferences?.preferredCategories.includes(item.category)) {
        score += 20;
        reasons.push({
          type: 'category',
          score: 20,
          description: `Catégorie préférée: ${item.category}`,
        });
      }

      // Score condition (+10 si compatible)
      if (preferences?.preferredConditions.includes(item.condition)) {
        score += 10;
        reasons.push({
          type: 'condition',
          score: 10,
          description: `Condition préférée: ${item.condition}`,
        });
      }

      // Score tags communs (+10 par tag commun)
      if (preferences?.preferredCategories.length > 0) {
        const commonTags = item.tags.filter((tag: string) =>
          preferences.preferredCategories.some(
            (cat: string) =>
              cat.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(cat.toLowerCase()),
          ),
        );
        if (commonTags.length > 0) {
          const tagScore = Math.min(commonTags.length * 5, 10);
          score += tagScore;
          reasons.push({
            type: 'tags',
            score: tagScore,
            description: `Tags communs: ${commonTags.join(', ')}`,
          });
        }
      }

      // Score popularité (+15 normalisé)
      const popularityScore = Math.min((item.popularityScore / 100) * 15, 15);
      if (popularityScore > 0) {
        score += popularityScore;
        reasons.push({
          type: 'popularity',
          score: popularityScore,
          description: `Popularité: ${item.popularityScore}`,
        });
      }

      // Score rareté (+15 inverse fréquence)
      const rarityScore = await this.calculateRarityScore(item.category);
      if (rarityScore > 0) {
        score += rarityScore;
        reasons.push({
          type: 'rarity',
          score: rarityScore,
          description: `Rareté de la catégorie: ${item.category}`,
        });
      }

      // Score proximité pays (+10 si même pays)
      if (preferences?.country && item.owner.country === preferences.country) {
        score += 10;
        reasons.push({
          type: 'location',
          score: 10,
          description: `Même pays: ${preferences.country}`,
        });
      }

      // Score affinité historique (+20 si catégorie échangée)
      const historyScore = this.calculateHistoryScore(
        item,
        historicalExchanges,
      );
      if (historyScore > 0) {
        score += historyScore;
        reasons.push({
          type: 'history',
          score: historyScore,
          description: `Affinité historique avec cette catégorie`,
        });
      }

      // Vérifier que l'item n'est pas dans l'historique d'échanges
      const isInHistory = historicalExchanges.some(
        (exchange) =>
          exchange.requestedItemTitle
            .toLowerCase()
            .includes(item.title.toLowerCase()) ||
          exchange.offeredItemTitle
            .toLowerCase()
            .includes(item.title.toLowerCase()),
      );

      if (!isInHistory && score > 0) {
        recommendations.push({
          item: {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition,
            tags: item.tags,
            popularityScore: item.popularityScore,
            owner: item.owner,
            photos: item.photos,
            createdAt: item.createdAt.toISOString(),
          },
          score: Math.round(score),
          reasons,
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calcule le score de rareté basé sur la fréquence de la catégorie
   */
  private async calculateRarityScore(category: string): Promise<number> {
    const totalItems = await this.prisma.item.count();
    const categoryItems = await this.prisma.item.count({
      where: { category: category as any },
    });

    if (totalItems === 0) return 0;

    const frequency = categoryItems / totalItems;
    // Plus la catégorie est rare, plus le score est élevé
    const rarityScore = Math.max(0, (1 - frequency) * 15);
    return Math.round(rarityScore * 10) / 10;
  }

  /**
   * Calcule le score d'affinité historique
   */
  private calculateHistoryScore(item: any, historicalExchanges: any[]): number {
    const categoryKeywords = item.category.toLowerCase().split(' ');
    const titleKeywords = item.title.toLowerCase().split(' ');

    let historyScore = 0;
    for (const exchange of historicalExchanges) {
      const requestedKeywords = exchange.requestedItemTitle
        .toLowerCase()
        .split(' ');
      const offeredKeywords = exchange.offeredItemTitle
        .toLowerCase()
        .split(' ');

      // Vérifier les mots-clés communs
      const commonKeywords = [...categoryKeywords, ...titleKeywords].filter(
        (keyword) =>
          requestedKeywords.includes(keyword) ||
          offeredKeywords.includes(keyword),
      );

      if (commonKeywords.length > 0) {
        historyScore += Math.min(commonKeywords.length * 5, 20);
      }
    }

    return Math.min(historyScore, 20);
  }

  /**
   * Applique les filtres de diversité
   */
  private applyDiversityFilters(
    recommendations: Recommendation[],
    limit: number,
  ): Recommendation[] {
    const diversified: Recommendation[] = [];
    const ownerCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const rec of recommendations) {
      if (diversified.length >= limit) break;

      const ownerId = rec.item.owner.id;
      const category = rec.item.category;

      // Max 2 par propriétaire
      if ((ownerCounts.get(ownerId) || 0) >= 2) continue;

      // Max 3 par catégorie
      if ((categoryCounts.get(category) || 0) >= 3) continue;

      diversified.push(rec);
      ownerCounts.set(ownerId, (ownerCounts.get(ownerId) || 0) + 1);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    return diversified;
  }

  /**
   * Sauvegarde ou met à jour les préférences d'un utilisateur
   */
  async savePreferences(
    userId: string,
    input: SavePreferencesInput,
  ): Promise<any> {
    const preferences = await this.prisma.preference.upsert({
      where: { userId },
      update: {
        preferredCategories: input.preferredCategories || [],
        dislikedCategories: input.dislikedCategories || [],
        preferredConditions: input.preferredConditions || [],
        locale: input.locale,
        country: input.country,
        radiusKm: input.radiusKm,
      },
      create: {
        userId,
        preferredCategories: input.preferredCategories || [],
        dislikedCategories: input.dislikedCategories || [],
        preferredConditions: input.preferredConditions || [],
        locale: input.locale,
        country: input.country,
        radiusKm: input.radiusKm,
      },
    });

    return { preferences };
  }

  /**
   * Récupère les préférences d'un utilisateur
   */
  async getPreferences(userId: string): Promise<any> {
    const preferences = await this.prisma.preference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException('Préférences non trouvées');
    }

    return { preferences };
  }
}

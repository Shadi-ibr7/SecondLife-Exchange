/**
 * FICHIER: ai.controller.ts
 *
 * DESCRIPTION:
 * Controller pour les endpoints IA publics.
 * Gère les suggestions automatiques pour les items.
 *
 * ENDPOINTS:
 * - POST /api/v1/ai/items/suggest - Suggère category, tags et summary pour un item
 *
 * SÉCURITÉ:
 * - Auth JWT requise
 * - Quota: 3 appels/jour/utilisateur
 * - Rate limiting via Throttler
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { AiItemSuggestDto, AiItemSuggestResponse, QuotaInfo } from './dtos/ai-item-suggest.dto';
import { ItemCategory } from '@prisma/client';

// Constantes
const DAILY_QUOTA = 3;
const ACTION_ITEM_SUGGEST = 'ITEM_SUGGEST';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAccessGuard)
@ApiBearerAuth()
export class AiItemsController {
  private readonly logger = new Logger(AiItemsController.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /api/v1/ai/items/suggest
   *
   * Suggère automatiquement la catégorie, les tags et un résumé pour un item.
   *
   * QUOTA: 3 appels/jour/utilisateur (reset à minuit UTC)
   */
  @Post('items/suggest')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 par minute max (protection burst)
  @ApiOperation({ summary: 'Suggérer category, tags et summary pour un item' })
  @ApiResponse({ status: 200, description: 'Suggestions générées' })
  @ApiResponse({ status: 429, description: 'Quota journalier atteint' })
  @ApiResponse({ status: 502, description: 'Service IA indisponible' })
  async suggestItemFields(
    @Request() req: any,
    @Body() dto: AiItemSuggestDto,
  ): Promise<AiItemSuggestResponse & { quota: QuotaInfo }> {
    const userId = req.user.id;
    const requestId = req.requestId || 'unknown';
    const startTime = Date.now();

    this.logger.log(
      `AI_SUGGEST_START: userId=${userId}, requestId=${requestId}`,
    );

    // Vérifier le quota
    const quotaInfo = await this.checkAndIncrementQuota(userId);

    if (quotaInfo.remaining < 0) {
      this.logger.warn(
        `AI_SUGGEST_QUOTA_EXCEEDED: userId=${userId}, used=${quotaInfo.used}/${quotaInfo.max}`,
      );
      throw new HttpException(
        {
          code: 'QUOTA_EXCEEDED',
          message: 'Quota journalier atteint (3 générations/jour). Réessayez demain.',
          quota: quotaInfo,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      // Tronquer la description à 2000 caractères pour économiser les tokens
      const truncatedDescription =
        dto.description.length > 2000
          ? dto.description.substring(0, 2000) + '...'
          : dto.description;

      // Appeler Gemini
      const result = await this.geminiService.analyzeItem({
        title: dto.title,
        description: truncatedDescription,
        locale: 'fr',
      });

      if (!result) {
        this.logger.error(
          `AI_SUGGEST_GEMINI_FAILED: userId=${userId}, requestId=${requestId}`,
        );
        throw new HttpException(
          {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: "Le service IA est temporairement indisponible. Réessayez plus tard.",
          },
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Enregistrer l'usage après succès
      await this.recordUsage(userId, ACTION_ITEM_SUGGEST);

      // Recalculer le quota après enregistrement
      const updatedQuota = await this.getQuotaInfo(userId);

      const durationMs = Date.now() - startTime;
      this.logger.log(
        `AI_SUGGEST_SUCCESS: userId=${userId}, requestId=${requestId}, category=${result.category}, quotaUsed=${updatedQuota.used}/${updatedQuota.max}, durationMs=${durationMs}`,
      );

      // Formater la réponse
      return {
        category: result.category,
        tags: this.sanitizeTags(result.tags),
        summary: this.sanitizeSummary(result.aiSummary),
        quota: updatedQuota,
      };
    } catch (error) {
      // Si c'est déjà une HttpException, la propager
      if (error instanceof HttpException) {
        throw error;
      }

      const durationMs = Date.now() - startTime;
      this.logger.error(
        `AI_SUGGEST_ERROR: userId=${userId}, requestId=${requestId}, error=${error.message}, durationMs=${durationMs}`,
      );

      throw new HttpException(
        {
          code: 'AI_SERVICE_ERROR',
          message: "Une erreur est survenue avec le service IA. Réessayez plus tard.",
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Vérifie le quota et retourne les infos.
   * Ne crée PAS encore l'entrée de quota (fait après succès).
   */
  private async checkAndIncrementQuota(userId: string): Promise<QuotaInfo> {
    const { startOfDay, endOfDay } = this.getDayBounds();

    // Compter les usages du jour
    const usedToday = await this.prisma.aiUsage.count({
      where: {
        userId,
        action: ACTION_ITEM_SUGGEST,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    return {
      used: usedToday,
      max: DAILY_QUOTA,
      remaining: DAILY_QUOTA - usedToday - 1, // -1 car on va consommer une après
      resetAt: endOfDay.toISOString(),
    };
  }

  /**
   * Retourne les infos de quota actuelles.
   */
  private async getQuotaInfo(userId: string): Promise<QuotaInfo> {
    const { startOfDay, endOfDay } = this.getDayBounds();

    const usedToday = await this.prisma.aiUsage.count({
      where: {
        userId,
        action: ACTION_ITEM_SUGGEST,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    return {
      used: usedToday,
      max: DAILY_QUOTA,
      remaining: DAILY_QUOTA - usedToday,
      resetAt: endOfDay.toISOString(),
    };
  }

  /**
   * Enregistre une utilisation IA.
   */
  private async recordUsage(userId: string, action: string): Promise<void> {
    await this.prisma.aiUsage.create({
      data: {
        userId,
        action,
      },
    });
  }

  /**
   * Retourne les bornes du jour courant (UTC).
   */
  private getDayBounds(): { startOfDay: Date; endOfDay: Date } {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    return { startOfDay, endOfDay };
  }

  /**
   * Nettoie et valide les tags.
   */
  private sanitizeTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];

    return tags
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length >= 2 && tag.length <= 24)
      .filter((tag, index, self) => self.indexOf(tag) === index) // Déduplique
      .slice(0, 8); // Max 8 tags
  }

  /**
   * Nettoie le summary.
   */
  private sanitizeSummary(summary: string): string {
    if (!summary) return '';

    // Supprimer HTML basique
    let clean = summary.replace(/<[^>]*>/g, '');
    // Trim et limiter
    clean = clean.trim();
    if (clean.length > 400) {
      clean = clean.substring(0, 397) + '...';
    }
    return clean;
  }
}

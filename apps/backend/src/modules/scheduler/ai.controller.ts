/**
 * FICHIER: ai.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour déclencher manuellement
 * la génération de suggestions via l'IA.
 *
 * ROUTES:
 * - POST /api/v1/ai/themes/:id/generate - Déclencher la génération de suggestions (authentifié)
 *
 * UTILISATION:
 * - Tests et développement
 * - Régénération de suggestions pour un thème spécifique
 * - Appelée par les administrateurs pour forcer la génération
 *
 * SÉCURITÉ:
 * - Nécessite une authentification JWT
 * - Devrait nécessiter AdminGuard (à ajouter si nécessaire)
 */

// Import des décorateurs NestJS
import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';

// Import des décorateurs Swagger
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Import du service
import { WeeklyCronService } from './weekly-cron.service';

// Import des guards
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

/**
 * CONTRÔLEUR: AiController
 *
 * Contrôleur pour déclencher manuellement la génération de suggestions.
 * Le préfixe 'ai' signifie que les routes commencent par /api/v1/ai
 */
@ApiTags('AI')
@Controller('ai')
export class AiController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service de cron
   */
  constructor(private readonly weeklyCronService: WeeklyCronService) {}

  // ============================================
  // ROUTE: POST /api/v1/ai/themes/:id/generate
  // ============================================

  /**
   * Endpoint pour déclencher manuellement la génération de suggestions.
   *
   * FONCTIONNEMENT:
   * - Génère des suggestions pour le thème spécifié
   * - Utilise les locales fournies dans le body (ou locales par défaut)
   * - Retourne les statistiques de génération
   *
   * @param themeId - ID du thème pour lequel générer les suggestions
   * @param body - Body optionnel avec locales (ex: { locale: ['FR', 'MA'] })
   * @returns Résultat de la génération avec statistiques
   *
   * Code HTTP: 200 (OK)
   *
   * SÉCURITÉ:
   * - Nécessite une authentification JWT
   * - Devrait nécessiter AdminGuard (à ajouter si nécessaire)
   */
  @Post('themes/:id/generate')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déclencher manuellement la génération de suggestions (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Génération déclenchée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async generateSuggestions(
    @Param('id') themeId: string,
    @Body() body?: { locale?: string[] },
  ) {
    // Déclencher la génération manuelle
    const result =
      await this.weeklyCronService.triggerManualGeneration(themeId);

    // Retourner le résultat avec un message descriptif
    return {
      success: result.success,
      themeId: result.themeId,
      stats: result.stats,
      message: `Génération terminée: ${result.stats.created} suggestions créées`,
    };
  }
}

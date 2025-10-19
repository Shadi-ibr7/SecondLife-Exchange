import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ThemesService } from '../themes/themes.service';
import { SuggestionsService } from '../suggestions/suggestions.service';

@Injectable()
export class WeeklyCronService {
  private readonly logger = new Logger(WeeklyCronService.name);
  private readonly scheduleConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly themesService: ThemesService,
    private readonly suggestionsService: SuggestionsService,
  ) {
    this.scheduleConfig = this.configService.get('schedule');
  }

  /**
   * Job cron hebdomadaire pour générer les suggestions
   * Exécuté le dimanche à 23h par défaut
   */
  @Cron('0 23 * * 0', {
    name: 'weekly-suggestions-generation',
    timeZone: 'Europe/Paris',
  })
  async generateWeeklySuggestions(): Promise<void> {
    this.logger.log(
      '🚀 Début du job hebdomadaire de génération de suggestions',
    );

    try {
      // Trouver ou créer le thème actif pour cette semaine
      const now = new Date();
      const activeTheme =
        await this.themesService.findOrCreateActiveThemeForDate(now);

      this.logger.log(
        `Thème actif: ${activeTheme.title} (ID: ${activeTheme.id})`,
      );

      // Vérifier si des suggestions existent déjà pour ce thème
      const existingSuggestions =
        await this.suggestionsService.getThemeSuggestions(activeTheme.id, 1, 1);

      if (existingSuggestions.total > 0) {
        this.logger.log(
          `Suggestions déjà générées pour ce thème (${existingSuggestions.total} items)`,
        );
        return;
      }

      // Générer les suggestions
      const stats = await this.suggestionsService.generateAndSaveSuggestions(
        activeTheme.id,
        activeTheme.title,
        ['FR', 'MA', 'JP', 'US', 'BR'], // Locales par défaut
      );

      // Logs de résultat
      this.logger.log('📊 Résultats de la génération:');
      this.logger.log(`  ✅ Suggestions créées: ${stats.created}`);
      this.logger.log(`  ⚠️  Suggestions ignorées: ${stats.ignored}`);
      this.logger.log(`  🔄 Doublons détectés: ${stats.duplicates}`);
      this.logger.log(`  🎯 Filtrage diversité: ${stats.diversityFiltered}`);
      this.logger.log(`  ❌ Erreurs: ${stats.errors}`);

      if (stats.created > 0) {
        this.logger.log(
          `🎉 Génération réussie: ${stats.created} nouvelles suggestions pour "${activeTheme.title}"`,
        );
      } else {
        this.logger.warn('⚠️  Aucune nouvelle suggestion générée');
      }
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la génération hebdomadaire: ${error.message}`,
      );
      this.logger.error(error.stack);
    }
  }

  /**
   * Job de nettoyage des anciennes suggestions (optionnel)
   * Exécuté le premier dimanche de chaque mois
   */
  @Cron('0 2 1-7 * 0', {
    name: 'cleanup-old-suggestions',
    timeZone: 'Europe/Paris',
  })
  async cleanupOldSuggestions(): Promise<void> {
    this.logger.log('🧹 Début du nettoyage des anciennes suggestions');

    try {
      // Supprimer les suggestions de plus de 6 mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Note: Cette fonctionnalité nécessiterait une méthode dans SuggestionsService
      // Pour l'instant, on log juste l'intention
      this.logger.log(
        `Nettoyage des suggestions antérieures à: ${sixMonthsAgo.toISOString()}`,
      );

      // TODO: Implémenter la suppression des anciennes suggestions
      // const deletedCount = await this.suggestionsService.deleteOldSuggestions(sixMonthsAgo);
      // this.logger.log(`🗑️  ${deletedCount} anciennes suggestions supprimées`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors du nettoyage: ${error.message}`);
    }
  }

  /**
   * Méthode pour déclencher manuellement la génération (utile pour les tests)
   */
  async triggerManualGeneration(themeId?: string): Promise<{
    success: boolean;
    themeId: string;
    stats: any;
  }> {
    this.logger.log('🔧 Déclenchement manuel de la génération de suggestions');

    try {
      let activeTheme;

      if (themeId) {
        activeTheme = await this.themesService.getThemeById(themeId);
      } else {
        const now = new Date();
        activeTheme =
          await this.themesService.findOrCreateActiveThemeForDate(now);
      }

      const stats = await this.suggestionsService.generateAndSaveSuggestions(
        activeTheme.id,
        activeTheme.title,
        ['FR', 'MA', 'JP', 'US', 'BR'],
      );

      return {
        success: true,
        themeId: activeTheme.id,
        stats,
      };
    } catch (error) {
      this.logger.error(`❌ Erreur génération manuelle: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie l'état du scheduler
   */
  async getSchedulerStatus(): Promise<{
    isConfigured: boolean;
    cronExpression: string;
    timezone: string;
    nextRun?: Date;
  }> {
    return {
      isConfigured: true,
      cronExpression: this.scheduleConfig.cron,
      timezone: this.scheduleConfig.timezone,
      // Note: Le calcul de la prochaine exécution nécessiterait une librairie comme node-cron
      // nextRun: this.calculateNextRun(),
    };
  }
}

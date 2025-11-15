/**
 * FICHIER: weekly-cron.service.ts
 *
 * DESCRIPTION:
 * Ce service gère les tâches planifiées (cron jobs) pour l'application.
 * Il exécute automatiquement la génération de suggestions hebdomadaires.
 *
 * TÂCHES PLANIFIÉES:
 * - generateWeeklySuggestions: Exécutée le dimanche à 23h (par défaut)
 *   Génère automatiquement des suggestions pour le thème actif de la semaine
 * - cleanupOldSuggestions: Exécutée le premier dimanche de chaque mois
 *   Nettoie les anciennes suggestions (plus de 6 mois)
 *
 * CONFIGURATION:
 * - Expression cron configurable via les variables d'environnement
 * - Fuseau horaire configurable (défaut: Europe/Paris)
 *
 * UTILISATION:
 * - Les tâches s'exécutent automatiquement selon l'expression cron
 * - Possibilité de déclencher manuellement via triggerManualGeneration()
 */

// Import des classes NestJS
import { Injectable, Logger } from '@nestjs/common';

// Import du module de scheduling
import { Cron, CronExpression } from '@nestjs/schedule';

// Import des services
import { ConfigService } from '@nestjs/config';
import { ThemesService } from '../themes/themes.service';
import { SuggestionsService } from '../suggestions/suggestions.service';

/**
 * SERVICE: WeeklyCronService
 *
 * Service pour les tâches planifiées (cron jobs).
 */
@Injectable()
export class WeeklyCronService {
  /**
   * Logger pour enregistrer les événements
   */
  private readonly logger = new Logger(WeeklyCronService.name);

  /**
   * Configuration du scheduler
   */
  private readonly scheduleConfig;

  /**
   * CONSTRUCTEUR
   *
   * Injection des dépendances.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly themesService: ThemesService,
    private readonly suggestionsService: SuggestionsService,
  ) {
    // Charger la configuration du scheduler
    this.scheduleConfig = this.configService.get('schedule');
  }

  // ============================================
  // TÂCHE CRON: generateWeeklySuggestions
  // ============================================

  /**
   * Job cron hebdomadaire pour générer les suggestions.
   *
   * EXPRESSION CRON: '0 23 * * 0'
   * - 0: minute 0
   * - 23: heure 23 (23:00)
   * - *: tous les jours du mois
   * - *: tous les mois
   * - 0: dimanche
   *
   * Résultat: Tous les dimanches à 23:00
   *
   * PROCESSUS:
   * 1. Trouve ou crée le thème actif pour cette semaine
   * 2. Vérifie si des suggestions existent déjà
   * 3. Génère les suggestions via l'IA
   * 4. Sauvegarde les suggestions dans la base de données
   * 5. Log les statistiques de génération
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

  // ============================================
  // TÂCHE CRON: cleanupOldSuggestions
  // ============================================

  /**
   * Job de nettoyage des anciennes suggestions.
   *
   * EXPRESSION CRON: '0 2 1-7 * 0'
   * - 0: minute 0
   * - 2: heure 2 (02:00)
   * - 1-7: jours 1 à 7 du mois
   * - *: tous les mois
   * - 0: dimanche
   *
   * Résultat: Le premier dimanche de chaque mois à 02:00
   *
   * FONCTIONNEMENT:
   * - Supprime les suggestions de plus de 6 mois
   * - Nettoie la base de données pour éviter l'accumulation
   *
   * NOTE: Cette fonctionnalité nécessiterait une méthode dans SuggestionsService
   * pour être complètement implémentée.
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

  // ============================================
  // MÉTHODE: triggerManualGeneration
  // ============================================

  /**
   * Déclenche manuellement la génération de suggestions.
   *
   * UTILISATION:
   * - Tests et développement
   * - Régénération de suggestions pour un thème spécifique
   * - Appelée via l'endpoint POST /api/v1/ai/themes/:id/generate
   *
   * @param themeId - ID du thème (optionnel, utilise le thème actif si non fourni)
   * @returns Résultat de la génération avec statistiques
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

  // ============================================
  // MÉTHODE: getSchedulerStatus
  // ============================================

  /**
   * Vérifie l'état du scheduler.
   *
   * @returns État du scheduler (configuré, expression cron, timezone)
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

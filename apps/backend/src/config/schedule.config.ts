/**
 * FICHIER: schedule.config.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la configuration pour les tâches planifiées (cron jobs).
 * Il configure la génération automatique de thèmes hebdomadaires et de suggestions.
 *
 * CRON:
 * Format: minute heure jour mois jour-semaine
 * Exemple: '0 23 * * 0' = Dimanche à 23:00
 *
 * CONFIGURATION:
 * - cron: Expression cron pour définir quand exécuter les tâches
 * - timezone: Fuseau horaire pour les tâches planifiées
 * - Limites pour la génération de suggestions
 */

// Import de registerAs
import { registerAs } from '@nestjs/config';

/**
 * CONFIGURATION: schedule
 *
 * Configuration pour les tâches planifiées (cron jobs).
 */
export default registerAs('schedule', () => ({
  /**
   * Expression cron pour définir quand générer les nouveaux thèmes.
   *
   * FORMAT: minute heure jour mois jour-semaine
   *
   * EXEMPLE: '0 23 * * 0'
   * - 0: minute 0
   * - 23: heure 23 (23:00)
   * - *: tous les jours du mois
   * - *: tous les mois
   * - 0: dimanche (0 = dimanche, 1 = lundi, etc.)
   *
   * Résultat: Tous les dimanches à 23:00
   */
  cron: process.env.SCHEDULE_CRON || '0 23 * * 0', // Dimanche 23:00 par défaut

  /**
   * Fuseau horaire pour les tâches planifiées.
   * Utilisé pour interpréter l'heure dans l'expression cron.
   * Défaut: Europe/Paris
   */
  timezone: process.env.SCHEDULE_TZ || 'Europe/Paris',

  /**
   * Nombre maximum de suggestions à générer par exécution.
   * Défaut: 20 suggestions
   *
   * Limite le nombre de suggestions pour éviter de surcharger l'API Gemini.
   */
  maxSuggestionsPerRun: parseInt(process.env.SUGGESTIONS_MAX_PER_RUN || '20'),

  /**
   * Nombre maximum de suggestions par pays.
   * Défaut: 2 suggestions par pays
   *
   * Assure une diversité géographique dans les suggestions.
   */
  maxSuggestionsPerCountry: parseInt(
    process.env.SUGGESTIONS_MAX_PER_COUNTRY || '2',
  ),

  /**
   * Nombre maximum de suggestions par époque.
   * Défaut: 2 suggestions par époque
   *
   * Assure une diversité temporelle dans les suggestions.
   */
  maxSuggestionsPerEra: parseInt(process.env.SUGGESTIONS_MAX_PER_ERA || '2'),

  /**
   * Nombre de semaines à regarder en arrière pour analyser les tendances.
   * Défaut: 12 semaines (3 mois)
   *
   * Utilisé pour générer des suggestions basées sur les thèmes précédents.
   */
  lookbackWeeks: parseInt(process.env.SUGGESTIONS_LOOKBACK_WEEKS || '12'),
}));

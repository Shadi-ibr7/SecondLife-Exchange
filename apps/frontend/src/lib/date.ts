/**
 * FICHIER: date.ts
 *
 * DESCRIPTION:
 * Ce fichier contient des fonctions utilitaires pour la manipulation et le formatage de dates.
 * Il est spécialement conçu pour gérer les semaines (thèmes hebdomadaires) et les formats
 * de dates en français.
 *
 * FONCTIONNALITÉS:
 * - Calcul des dates de début de semaine (lundi)
 * - Navigation entre semaines (précédente, suivante, N semaines)
 * - Formatage de dates en différents formats (ISO, français, court)
 * - Formatage de plages de semaines
 * - Vérification si deux dates sont dans la même semaine
 * - Génération de plages de dates pour les thèmes
 * - Extraction de toutes les semaines dans une plage
 *
 * BIBLIOTHÈQUE:
 * Utilise date-fns pour toutes les opérations sur les dates.
 * La semaine commence le lundi (weekStartsOn: 1).
 */

// Import de date-fns pour les opérations sur les dates
import { format, startOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';

// Import de la locale française pour le formatage
import { fr } from 'date-fns/locale';

/**
 * FONCTION: getStartOfWeek
 *
 * Obtient le lundi de la semaine pour une date donnée.
 *
 * @param date - Date de référence (défaut: aujourd'hui)
 * @returns Date du lundi de la semaine
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = lundi
}

/**
 * FONCTION: getPreviousWeekStart
 *
 * Obtient le lundi de la semaine précédente.
 *
 * @param date - Date de référence (défaut: aujourd'hui)
 * @returns Date du lundi de la semaine précédente
 */
export function getPreviousWeekStart(date: Date = new Date()): Date {
  return subWeeks(getStartOfWeek(date), 1);
}

/**
 * FONCTION: getNextWeekStart
 *
 * Obtient le lundi de la semaine suivante.
 *
 * @param date - Date de référence (défaut: aujourd'hui)
 * @returns Date du lundi de la semaine suivante
 */
export function getNextWeekStart(date: Date = new Date()): Date {
  return addWeeks(getStartOfWeek(date), 1);
}

/**
 * FONCTION: getWeekStartNWeeksAgo
 *
 * Obtient le lundi de la semaine il y a N semaines.
 *
 * @param weeks - Nombre de semaines à reculer
 * @param date - Date de référence (défaut: aujourd'hui)
 * @returns Date du lundi de la semaine il y a N semaines
 */
export function getWeekStartNWeeksAgo(
  weeks: number,
  date: Date = new Date()
): Date {
  return subWeeks(getStartOfWeek(date), weeks);
}

/**
 * FONCTION: getWeekStartInNWeeks
 *
 * Obtient le lundi de la semaine dans N semaines.
 *
 * @param weeks - Nombre de semaines à avancer
 * @param date - Date de référence (défaut: aujourd'hui)
 * @returns Date du lundi de la semaine dans N semaines
 */
export function getWeekStartInNWeeks(
  weeks: number,
  date: Date = new Date()
): Date {
  return addWeeks(getStartOfWeek(date), weeks);
}

/**
 * FONCTION: formatDateISO
 *
 * Formate une date en format ISO (YYYY-MM-DD).
 * Utilisé pour les requêtes API et le stockage en base de données.
 *
 * @param date - Date à formater
 * @returns Date formatée en ISO (ex: "2024-01-15")
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * FONCTION: formatDateFrench
 *
 * Formate une date en format français complet (ex: "15 janvier 2024").
 *
 * @param date - Date à formater
 * @returns Date formatée en français
 */
export function formatDateFrench(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr });
}

/**
 * FONCTION: formatDateShort
 *
 * Formate une date en format court français (ex: "15/01/2024").
 *
 * @param date - Date à formater
 * @returns Date formatée en format court
 */
export function formatDateShort(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

/**
 * FONCTION: formatWeekRange
 *
 * Formate une plage de semaine en français (ex: "Semaine du 15 janvier").
 *
 * LOGIQUE:
 * - Si la semaine est dans le même mois, affiche "Semaine du [jour] [mois]"
 * - Si la semaine s'étend sur deux mois, affiche "Semaine du [jour] [mois] au [jour] [mois]"
 *
 * @param date - Date dans la semaine à formater
 * @returns Plage de semaine formatée en français
 */
export function formatWeekRange(date: Date): string {
  const start = getStartOfWeek(date);
  const end = addWeeks(start, 1);

  // Si la semaine est dans le même mois
  if (start.getMonth() === end.getMonth()) {
    return `Semaine du ${format(start, 'd MMMM', { locale: fr })}`;
  } else {
    // Si la semaine s'étend sur deux mois
    return `Semaine du ${format(start, 'd MMM', { locale: fr })} au ${format(end, 'd MMM', { locale: fr })}`;
  }
}

/**
 * FONCTION: isSameWeekRange
 *
 * Vérifie si deux dates sont dans la même semaine.
 *
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns true si les deux dates sont dans la même semaine, false sinon
 */
export function isSameWeekRange(date1: Date, date2: Date): boolean {
  return isSameWeek(date1, date2, { weekStartsOn: 1 });
}

/**
 * FONCTION: getThemeDateRange
 *
 * Génère une plage de dates pour les thèmes hebdomadaires.
 * Retourne 3 semaines avant et 5 semaines après la date centrale.
 *
 * UTILISATION:
 * Utilisé pour afficher le calendrier des thèmes dans l'interface.
 *
 * @param centerDate - Date centrale (défaut: aujourd'hui)
 * @returns Objet avec les dates de début et fin au format ISO
 */
export function getThemeDateRange(centerDate: Date = new Date()) {
  const start = getWeekStartNWeeksAgo(3, centerDate); // 3 semaines avant
  const end = getWeekStartInNWeeks(5, centerDate); // 5 semaines après

  return {
    from: formatDateISO(start), // Date de début au format ISO
    to: formatDateISO(end), // Date de fin au format ISO
  };
}

/**
 * FONCTION: getWeeksInRange
 *
 * Obtient toutes les semaines (lundis) dans une plage de dates donnée.
 *
 * PROCESSUS:
 * 1. Convertit les strings ISO en objets Date
 * 2. Calcule le lundi de chaque date
 * 3. Parcourt toutes les semaines entre les deux dates
 * 4. Retourne un tableau de dates (lundis)
 *
 * @param from - Date de début (format ISO: "YYYY-MM-DD")
 * @param to - Date de fin (format ISO: "YYYY-MM-DD")
 * @returns Tableau de dates représentant tous les lundis dans la plage
 */
export function getWeeksInRange(from: string, to: string): Date[] {
  const startDate = new Date(from);
  const endDate = new Date(to);
  const weeks: Date[] = [];

  // Commencer au lundi de la date de début
  let currentWeek = getStartOfWeek(startDate);
  const endWeek = getStartOfWeek(endDate);

  // Parcourir toutes les semaines jusqu'à la date de fin
  while (currentWeek <= endWeek) {
    weeks.push(new Date(currentWeek)); // Créer une nouvelle instance pour éviter les mutations
    currentWeek = addWeeks(currentWeek, 1); // Passer à la semaine suivante
  }

  return weeks;
}

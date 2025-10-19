import { format, startOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Obtient le lundi de la semaine pour une date donnée
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = lundi
}

/**
 * Obtient le lundi de la semaine précédente
 */
export function getPreviousWeekStart(date: Date = new Date()): Date {
  return subWeeks(getStartOfWeek(date), 1);
}

/**
 * Obtient le lundi de la semaine suivante
 */
export function getNextWeekStart(date: Date = new Date()): Date {
  return addWeeks(getStartOfWeek(date), 1);
}

/**
 * Obtient le lundi de la semaine il y a N semaines
 */
export function getWeekStartNWeeksAgo(
  weeks: number,
  date: Date = new Date()
): Date {
  return subWeeks(getStartOfWeek(date), weeks);
}

/**
 * Obtient le lundi de la semaine dans N semaines
 */
export function getWeekStartInNWeeks(
  weeks: number,
  date: Date = new Date()
): Date {
  return addWeeks(getStartOfWeek(date), weeks);
}

/**
 * Formate une date en format ISO (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formate une date en format français
 */
export function formatDateFrench(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr });
}

/**
 * Formate une date en format court français
 */
export function formatDateShort(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

/**
 * Formate une date en format semaine (ex: "Semaine du 15 janvier")
 */
export function formatWeekRange(date: Date): string {
  const start = getStartOfWeek(date);
  const end = addWeeks(start, 1);

  if (start.getMonth() === end.getMonth()) {
    return `Semaine du ${format(start, 'd MMMM', { locale: fr })}`;
  } else {
    return `Semaine du ${format(start, 'd MMM', { locale: fr })} au ${format(end, 'd MMM', { locale: fr })}`;
  }
}

/**
 * Vérifie si deux dates sont dans la même semaine
 */
export function isSameWeekRange(date1: Date, date2: Date): boolean {
  return isSameWeek(date1, date2, { weekStartsOn: 1 });
}

/**
 * Génère une plage de dates pour les thèmes (3 semaines avant, 5 semaines après)
 */
export function getThemeDateRange(centerDate: Date = new Date()) {
  const start = getWeekStartNWeeksAgo(3, centerDate);
  const end = getWeekStartInNWeeks(5, centerDate);

  return {
    from: formatDateISO(start),
    to: formatDateISO(end),
  };
}

/**
 * Obtient toutes les semaines dans une plage donnée
 */
export function getWeeksInRange(from: string, to: string): Date[] {
  const startDate = new Date(from);
  const endDate = new Date(to);
  const weeks: Date[] = [];

  let currentWeek = getStartOfWeek(startDate);
  const endWeek = getStartOfWeek(endDate);

  while (currentWeek <= endWeek) {
    weeks.push(new Date(currentWeek));
    currentWeek = addWeeks(currentWeek, 1);
  }

  return weeks;
}

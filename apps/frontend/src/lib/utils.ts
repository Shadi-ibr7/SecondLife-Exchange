/**
 * FICHIER: utils.ts
 *
 * DESCRIPTION:
 * Ce fichier contient des fonctions utilitaires réutilisables dans toute l'application.
 * Il inclut des fonctions pour le formatage de dates, la manipulation de classes CSS,
 * et la transformation de texte.
 *
 * FONCTIONNALITÉS:
 * - Fusion de classes CSS (cn) pour Tailwind
 * - Formatage de dates (formatDate, formatDateTime, formatRelativeTime)
 * - Génération d'initiales et de noms d'affichage
 * - Troncature de texte
 * - Génération de slugs (URL-friendly)
 */

// Import de clsx pour fusionner les classes CSS
import { type ClassValue, clsx } from 'clsx';

// Import de tailwind-merge pour fusionner les classes Tailwind
import { twMerge } from 'tailwind-merge';

/**
 * FONCTION: cn
 *
 * Fusionne les classes CSS de manière intelligente.
 * Combine clsx (pour gérer les conditions) et twMerge (pour résoudre les conflits Tailwind).
 *
 * UTILISATION:
 * cn('px-2 py-1', isActive && 'bg-blue-500', 'px-4')
 * -> 'py-1 bg-blue-500 px-4' (px-2 est écrasé par px-4)
 *
 * @param inputs - Classes CSS à fusionner (string, objet, tableau, etc.)
 * @returns Chaîne de classes CSS fusionnées
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * FONCTION: formatDate
 *
 * Formate une date en français (ex: "20 janvier 2024").
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @returns Date formatée en français
 */
export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long', // Nom complet du mois (janvier, février, etc.)
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * FONCTION: formatDateTime
 *
 * Formate une date avec l'heure en français (ex: "20 jan. 2024, 14:30").
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @returns Date et heure formatées en français
 */
export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short', // Nom abrégé du mois (jan., fév., etc.)
    day: 'numeric',
    hour: '2-digit', // Heure sur 2 chiffres (14, 09, etc.)
    minute: '2-digit', // Minutes sur 2 chiffres
  }).format(new Date(date));
}

/**
 * FONCTION: formatRelativeTime
 *
 * Formate une date en temps relatif (ex: "Il y a 5 minutes", "À l'instant").
 *
 * Si la date est récente (< 7 jours), retourne un temps relatif.
 * Sinon, retourne la date formatée avec formatDate().
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @returns Temps relatif ou date formatée
 */
export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  // Moins d'une minute: "À l'instant"
  if (diffInSeconds < 60) {
    return "À l'instant";
  }

  // Moins d'une heure: "Il y a X minute(s)"
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }

  // Moins de 24 heures: "Il y a X heure(s)"
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }

  // Moins de 7 jours: "Il y a X jour(s)"
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }

  // Plus de 7 jours: date formatée
  return formatDate(date);
}

/**
 * FONCTION: getInitials
 *
 * Génère les initiales d'un utilisateur à partir de son prénom, nom ou username.
 *
 * PRIORITÉ:
 * 1. Prénom + Nom (ex: "Jean Dupont" -> "JD")
 * 2. Prénom seul (ex: "Jean" -> "J")
 * 3. Username (ex: "jdupont" -> "J")
 * 4. "?" si rien n'est disponible
 *
 * @param firstName - Prénom de l'utilisateur
 * @param lastName - Nom de l'utilisateur
 * @param username - Nom d'utilisateur
 * @returns Initiales en majuscules
 */
export function getInitials(
  firstName?: string,
  lastName?: string,
  username?: string
) {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (username) {
    return username.charAt(0).toUpperCase();
  }
  return '?';
}

/**
 * FONCTION: getDisplayName
 *
 * Génère le nom d'affichage d'un utilisateur.
 *
 * PRIORITÉ:
 * 1. Prénom + Nom (ex: "Jean Dupont")
 * 2. Prénom seul (ex: "Jean")
 * 3. Username (ex: "jdupont")
 *
 * @param user - Objet utilisateur avec firstName, lastName, username
 * @returns Nom d'affichage
 */
export function getDisplayName(user: {
  firstName?: string;
  lastName?: string;
  username: string;
}) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.username;
}

/**
 * FONCTION: truncateText
 *
 * Tronque un texte à une longueur maximale et ajoute "..." si nécessaire.
 *
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @returns Texte tronqué avec "..." si nécessaire
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * FONCTION: generateSlug
 *
 * Génère un slug (URL-friendly) à partir d'un texte.
 *
 * PROCESSUS:
 * 1. Convertit en minuscules
 * 2. Normalise les caractères accentués (é -> e)
 * 3. Supprime les caractères non alphanumériques
 * 4. Remplace les espaces par des tirets
 * 5. Supprime les tirets multiples
 *
 * EXEMPLE:
 * "Café & Thé" -> "cafe-the"
 *
 * @param text - Texte à convertir en slug
 * @returns Slug URL-friendly
 */
export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués (é -> e + accent)
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères non alphanumériques (sauf espaces et tirets)
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets multiples
    .trim(); // Supprime les espaces en début/fin
}

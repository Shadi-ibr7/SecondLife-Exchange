/**
 * FICHIER: lib/utils.ts
 *
 * DESCRIPTION:
 * Ce fichier contient des fonctions utilitaires réutilisables dans toute l'application.
 * Il inclut des fonctions pour le formatage de dates, la manipulation de classes CSS,
 * et la transformation de texte. Ces fonctions sont utilisées dans de nombreux composants
 * pour garantir la cohérence et éviter la duplication de code.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Fusion intelligente de classes CSS (cn) pour Tailwind avec résolution des conflits
 * - Formatage de dates en français (formatDate, formatDateTime, formatRelativeTime)
 * - Génération d'initiales et de noms d'affichage pour les utilisateurs
 * - Troncature de texte avec ellipsis
 * - Génération de slugs URL-friendly pour les URLs
 *
 * UTILISATION:
 * Ces fonctions sont importées et utilisées dans les composants React, les pages,
 * et d'autres modules de l'application. Elles sont pure (pas d'effets de bord)
 * et peuvent être facilement testées.
 */

// Import de clsx pour fusionner les classes CSS de manière conditionnelle
// clsx permet de gérer les classes conditionnelles: clsx('base', isActive && 'active')
import { type ClassValue, clsx } from 'clsx';

// Import de tailwind-merge pour fusionner les classes Tailwind en résolvant les conflits
// twMerge résout les conflits entre classes Tailwind (ex: px-2 et px-4 -> px-4)
import { twMerge } from 'tailwind-merge';

/**
 * FONCTION: cn
 *
 * Fusionne les classes CSS de manière intelligente.
 * Combine clsx (pour gérer les conditions) et twMerge (pour résoudre les conflits Tailwind).
 *
 * Cette fonction est essentielle pour gérer les classes CSS dans les composants React,
 * surtout avec Tailwind CSS où les conflits de classes doivent être résolus intelligemment.
 *
 * FONCTIONNEMENT:
 * 1. clsx() fusionne toutes les classes (string, objets, tableaux, conditions)
 * 2. twMerge() résout les conflits Tailwind (ex: px-2 et px-4 -> px-4 seulement)
 *
 * EXEMPLES D'UTILISATION:
 * cn('px-2 py-1', isActive && 'bg-blue-500', 'px-4')
 * -> 'py-1 bg-blue-500 px-4' (px-2 est écrasé par px-4 car twMerge résout le conflit)
 *
 * cn('text-red-500', condition && 'text-blue-500')
 * -> 'text-blue-500' (si condition est true, sinon 'text-red-500')
 *
 * @param inputs - Classes CSS à fusionner (string, objet, tableau, conditions, etc.)
 * @returns Chaîne de classes CSS fusionnées et optimisées
 */
export function cn(...inputs: ClassValue[]) {
  /**
   * 1. clsx() fusionne toutes les classes en une seule chaîne
   *    - Gère les conditions (true/false)
   *    - Gère les objets ({ 'active': isActive })
   *    - Gère les tableaux
   * 2. twMerge() résout les conflits Tailwind
   *    - Si px-2 et px-4 sont présents, garde seulement px-4
   *    - Si text-red-500 et text-blue-500 sont présents, garde seulement text-blue-500
   */
  return twMerge(clsx(inputs));
}

/**
 * FONCTION: formatDate
 *
 * Formate une date en français avec le format complet (ex: "20 janvier 2024").
 * Utilise l'API Intl.DateTimeFormat pour un formatage localisé et cohérent.
 *
 * FORMAT:
 * - Jour: nombre (1-31)
 * - Mois: nom complet en français (janvier, février, mars, etc.)
 * - Année: nombre à 4 chiffres (2024)
 *
 * EXEMPLES:
 * formatDate('2024-01-20T10:30:00Z') -> "20 janvier 2024"
 * formatDate(new Date()) -> "15 mars 2024" (date actuelle)
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @returns Date formatée en français (ex: "20 janvier 2024")
 */
export function formatDate(date: string | Date) {
  /**
   * Intl.DateTimeFormat est l'API native JavaScript pour formater les dates
   * selon une locale spécifique. Elle est plus performante et fiable que
   * les solutions manuelles.
   *
   * 'fr-FR': locale française (France)
   * - year: 'numeric' -> année à 4 chiffres (2024)
   * - month: 'long' -> nom complet du mois (janvier, février, etc.)
   * - day: 'numeric' -> jour du mois (1-31)
   */
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric', // Année à 4 chiffres (2024)
    month: 'long', // Nom complet du mois (janvier, février, mars, etc.)
    day: 'numeric', // Jour du mois (1-31)
  }).format(new Date(date)); // Convertir en Date si c'est une string
}

/**
 * FONCTION: formatDateTime
 *
 * Formate une date avec l'heure en français (ex: "20 jan. 2024, 14:30").
 * Utilise l'API Intl.DateTimeFormat pour un formatage localisé et cohérent.
 *
 * FORMAT:
 * - Jour: nombre (1-31)
 * - Mois: nom abrégé en français (jan., fév., mars, etc.)
 * - Année: nombre à 4 chiffres (2024)
 * - Heure: format 24h sur 2 chiffres (00-23)
 * - Minutes: sur 2 chiffres (00-59)
 *
 * EXEMPLES:
 * formatDateTime('2024-01-20T14:30:00Z') -> "20 jan. 2024, 14:30"
 * formatDateTime(new Date()) -> "15 mars 2024, 10:45" (date et heure actuelles)
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @returns Date et heure formatées en français (ex: "20 jan. 2024, 14:30")
 */
export function formatDateTime(date: string | Date) {
  /**
   * Intl.DateTimeFormat avec options pour inclure l'heure
   * 'fr-FR': locale française (France)
   * - year: 'numeric' -> année à 4 chiffres (2024)
   * - month: 'short' -> nom abrégé du mois (jan., fév., mars, etc.)
   * - day: 'numeric' -> jour du mois (1-31)
   * - hour: '2-digit' -> heure sur 2 chiffres au format 24h (00-23)
   * - minute: '2-digit' -> minutes sur 2 chiffres (00-59)
   */
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric', // Année à 4 chiffres (2024)
    month: 'short', // Nom abrégé du mois (jan., fév., mars, etc.)
    day: 'numeric', // Jour du mois (1-31)
    hour: '2-digit', // Heure sur 2 chiffres au format 24h (14, 09, etc.)
    minute: '2-digit', // Minutes sur 2 chiffres (30, 05, etc.)
  }).format(new Date(date)); // Convertir en Date si c'est une string
}

/**
 * FONCTION: formatRelativeTime
 *
 * Formate une date en temps relatif en français (ex: "Il y a 5 minutes", "À l'instant").
 * Si la date est récente (< 7 jours), retourne un temps relatif.
 * Sinon, retourne la date formatée avec formatDate() pour une meilleure lisibilité.
 *
 * LOGIQUE DE FORMATAGE:
 * - < 1 minute: "À l'instant"
 * - < 1 heure: "Il y a X minute(s)"
 * - < 24 heures: "Il y a X heure(s)"
 * - < 7 jours: "Il y a X jour(s)"
 * - ≥ 7 jours: date formatée (ex: "20 janvier 2024")
 *
 * EXEMPLES:
 * formatRelativeTime(new Date()) -> "À l'instant"
 * formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000)) -> "Il y a 5 minutes"
 * formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000)) -> "Il y a 2 heures"
 * formatRelativeTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) -> "Il y a 3 jours"
 * formatRelativeTime(new Date('2024-01-01')) -> "1 janvier 2024" (si > 7 jours)
 *
 * @param date - Date à formater (string ISO ou objet Date)
 * @returns Temps relatif en français ou date formatée si > 7 jours
 */
export function formatRelativeTime(date: string | Date) {
  /**
   * Calculer la différence entre maintenant et la date cible
   * getTime() retourne le nombre de millisecondes depuis le 1er janvier 1970
   * On divise par 1000 pour obtenir les secondes
   * Math.floor() arrondit vers le bas pour avoir un nombre entier
   */
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000 // Différence en secondes
  );

  /**
   * CAS 1: Moins d'une minute (< 60 secondes)
   * Retourner "À l'instant" pour les événements très récents
   */
  if (diffInSeconds < 60) {
    return "À l'instant";
  }

  /**
   * CAS 2: Moins d'une heure (< 60 minutes)
   * Calculer le nombre de minutes et afficher "Il y a X minute(s)"
   * Gérer le pluriel correctement (minute vs minutes)
   */
  const diffInMinutes = Math.floor(diffInSeconds / 60); // Convertir en minutes
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }

  /**
   * CAS 3: Moins de 24 heures (< 24 heures)
   * Calculer le nombre d'heures et afficher "Il y a X heure(s)"
   * Gérer le pluriel correctement (heure vs heures)
   */
  const diffInHours = Math.floor(diffInMinutes / 60); // Convertir en heures
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }

  /**
   * CAS 4: Moins de 7 jours (< 7 jours)
   * Calculer le nombre de jours et afficher "Il y a X jour(s)"
   * Gérer le pluriel correctement (jour vs jours)
   */
  const diffInDays = Math.floor(diffInHours / 24); // Convertir en jours
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }

  /**
   * CAS 5: Plus de 7 jours (≥ 7 jours)
   * Retourner la date formatée avec formatDate() pour une meilleure lisibilité
   * (ex: "20 janvier 2024" au lieu de "Il y a 15 jours")
   */
  return formatDate(date);
}

/**
 * FONCTION: getInitials
 *
 * Génère les initiales d'un utilisateur à partir de son prénom, nom ou username.
 * Utilisée pour afficher les avatars avec initiales quand l'utilisateur n'a pas de photo.
 *
 * PRIORITÉ DE SÉLECTION:
 * 1. Prénom + Nom (ex: "Jean Dupont" -> "JD")
 * 2. Prénom seul (ex: "Jean" -> "J")
 * 3. Username (ex: "jdupont" -> "J")
 * 4. "?" si rien n'est disponible (fallback)
 *
 * EXEMPLES:
 * getInitials('Jean', 'Dupont', 'jdupont') -> "JD"
 * getInitials('Jean', undefined, 'jdupont') -> "J"
 * getInitials(undefined, undefined, 'jdupont') -> "J"
 * getInitials(undefined, undefined, undefined) -> "?"
 *
 * @param firstName - Prénom de l'utilisateur (optionnel)
 * @param lastName - Nom de l'utilisateur (optionnel)
 * @param username - Nom d'utilisateur (optionnel)
 * @returns Initiales en majuscules (1 ou 2 lettres, ou "?")
 */
export function getInitials(
  firstName?: string,
  lastName?: string,
  username?: string
) {
  /**
   * CAS 1: Prénom ET nom disponibles
   * Prendre la première lettre de chaque et les mettre en majuscules
   * charAt(0) récupère le premier caractère de la chaîne
   * toUpperCase() convertit en majuscules
   */
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * CAS 2: Seulement le prénom disponible
   * Prendre la première lettre du prénom et la mettre en majuscule
   */
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }

  /**
   * CAS 3: Seulement le username disponible
   * Prendre la première lettre du username et la mettre en majuscule
   */
  if (username) {
    return username.charAt(0).toUpperCase();
  }

  /**
   * CAS 4: Aucune information disponible
   * Retourner "?" comme fallback pour indiquer qu'il n'y a pas d'information
   */
  return '?';
}

/**
 * FONCTION: getDisplayName
 *
 * Génère le nom d'affichage d'un utilisateur selon une hiérarchie de priorité.
 * Utilisée pour afficher le nom de l'utilisateur dans l'interface de manière cohérente.
 *
 * PRIORITÉ DE SÉLECTION:
 * 1. Prénom + Nom (ex: "Jean Dupont") - le plus formel et complet
 * 2. Prénom seul (ex: "Jean") - plus personnel
 * 3. Username (ex: "jdupont") - fallback si aucune autre information
 *
 * EXEMPLES:
 * getDisplayName({ firstName: 'Jean', lastName: 'Dupont', username: 'jdupont' }) -> "Jean Dupont"
 * getDisplayName({ firstName: 'Jean', username: 'jdupont' }) -> "Jean"
 * getDisplayName({ username: 'jdupont' }) -> "jdupont"
 *
 * @param user - Objet utilisateur avec firstName (optionnel), lastName (optionnel), username (obligatoire)
 * @returns Nom d'affichage selon la priorité (prénom+nom, prénom, ou username)
 */
export function getDisplayName(user: {
  firstName?: string;
  lastName?: string;
  username: string;
}) {
  /**
   * CAS 1: Prénom ET nom disponibles
   * Retourner "Prénom Nom" (format le plus formel et complet)
   */
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * CAS 2: Seulement le prénom disponible
   * Retourner le prénom seul (plus personnel que le username)
   */
  if (user.firstName) {
    return user.firstName;
  }

  /**
   * CAS 3: Aucun prénom/nom disponible
   * Retourner le username comme fallback (toujours disponible car obligatoire)
   */
  return user.username;
}

/**
 * FONCTION: truncateText
 *
 * Tronque un texte à une longueur maximale et ajoute "..." (ellipsis) si nécessaire.
 * Utilisée pour limiter l'affichage de textes longs dans l'interface (ex: descriptions, titres).
 *
 * FONCTIONNEMENT:
 * - Si le texte est plus court ou égal à maxLength, retourner le texte tel quel
 * - Sinon, prendre les maxLength premiers caractères et ajouter "..."
 *
 * EXEMPLES:
 * truncateText('Bonjour', 10) -> "Bonjour" (pas de troncature)
 * truncateText('Bonjour le monde', 10) -> "Bonjour le..." (tronqué à 10 caractères)
 * truncateText('Un très long texte qui dépasse', 20) -> "Un très long texte q..." (tronqué à 20 caractères)
 *
 * NOTE:
 * Cette fonction tronque au niveau des caractères, pas des mots.
 * Pour une troncature au niveau des mots, il faudrait une fonction plus complexe.
 *
 * @param text - Texte à tronquer (string)
 * @param maxLength - Longueur maximale en caractères (nombre)
 * @returns Texte tronqué avec "..." si nécessaire, ou texte complet si plus court
 */
export function truncateText(text: string, maxLength: number) {
  /**
   * Si le texte est plus court ou égal à la longueur maximale,
   * retourner le texte tel quel sans modification
   */
  if (text.length <= maxLength) return text;

  /**
   * Si le texte est plus long que maxLength:
   * 1. slice(0, maxLength) prend les maxLength premiers caractères
   * 2. Ajouter "..." pour indiquer qu'il y a du texte en plus
   */
  return text.slice(0, maxLength) + '...';
}

/**
 * FONCTION: generateSlug
 *
 * Génère un slug (URL-friendly) à partir d'un texte.
 * Un slug est une version simplifiée d'un texte utilisable dans les URLs.
 * Il ne contient que des lettres minuscules, des chiffres et des tirets.
 *
 * PROCESSUS DE TRANSFORMATION (étape par étape):
 * 1. Convertit en minuscules (ex: "Café" -> "café")
 * 2. Normalise les caractères accentués (ex: "é" -> "e" + accent combiné)
 * 3. Supprime les accents (ex: "e" + accent -> "e")
 * 4. Supprime les caractères non alphanumériques (sauf espaces et tirets)
 * 5. Remplace les espaces (et séquences d'espaces) par un tiret
 * 6. Supprime les tirets multiples (ex: "---" -> "-")
 * 7. Supprime les espaces en début/fin
 *
 * EXEMPLES:
 * generateSlug("Café & Thé") -> "cafe-the"
 * generateSlug("Mon Super  Article!!!") -> "mon-super-article"
 * generateSlug("Électronique & Téléphonie") -> "electronique-telephonie"
 * generateSlug("  Espaces   multiples  ") -> "espaces-multiples"
 *
 * UTILISATION:
 * Généralement utilisé pour créer des URLs SEO-friendly à partir de titres ou noms.
 *
 * @param text - Texte à convertir en slug (string)
 * @returns Slug URL-friendly (ex: "cafe-the", "mon-super-article")
 */
export function generateSlug(text: string) {
  /**
   * ÉTAPE 1: Convertir en minuscules
   * "Café & Thé" -> "café & thé"
   */
  return (
    text
      .toLowerCase()

      /**
       * ÉTAPE 2: Normaliser les caractères accentués (décomposition Unicode)
       * normalize('NFD') décompose les caractères accentués en caractère de base + accent combiné
       * "café" -> "cafe" + accent combiné sur le "e"
       * Cela permet de supprimer facilement les accents à l'étape suivante
       */
      .normalize('NFD')

      /**
       * ÉTAPE 3: Supprimer les accents combinés
       * /[\u0300-\u036f]/g: regex qui match tous les caractères d'accent Unicode (combining diacritical marks)
       * "cafe" + accent -> "cafe"
       */
      .replace(/[\u0300-\u036f]/g, '')

      /**
       * ÉTAPE 4: Supprimer les caractères non alphanumériques (sauf espaces et tirets)
       * /[^a-z0-9\s-]/g: regex qui match tout sauf lettres minuscules, chiffres, espaces (\s) et tirets (-)
       * "cafe & the" -> "cafe  the" (le "&" est supprimé)
       */
      .replace(/[^a-z0-9\s-]/g, '')

      /**
       * ÉTAPE 5: Remplacer les espaces (et séquences d'espaces) par un tiret
       * /\s+/g: regex qui match une ou plusieurs espaces consécutives
       * "cafe  the" -> "cafe-the"
       */
      .replace(/\s+/g, '-')

      /**
       * ÉTAPE 6: Supprimer les tirets multiples
       * /-+/g: regex qui match un ou plusieurs tirets consécutifs
       * "cafe---the" -> "cafe-the"
       */
      .replace(/-+/g, '-')

      /**
       * ÉTAPE 7: Supprimer les espaces en début/fin
       * trim() supprime les espaces (et tirets) au début et à la fin
       * "  cafe-the  " -> "cafe-the"
       */
      .trim()
  );
}

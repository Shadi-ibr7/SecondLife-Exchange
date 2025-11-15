/**
 * FICHIER: constants.ts
 *
 * DESCRIPTION:
 * Ce fichier contient toutes les constantes utilisées dans l'application frontend.
 * Il définit les catégories, conditions, statuts d'items, options de tri,
 * et les labels traduits en français.
 *
 * FONCTIONNALITÉS:
 * - Définition des catégories d'items disponibles
 * - Définition des conditions d'items
 * - Définition des statuts d'items
 * - Options de tri pour les listes
 * - Labels traduits en français pour l'affichage
 * - Configuration des uploads de photos
 *
 * UTILISATION:
 * Ces constantes sont utilisées dans les formulaires, filtres, et affichages
 * pour garantir la cohérence des données dans toute l'application.
 */

/**
 * CONSTANTE: ITEM_CATEGORIES
 *
 * Liste de toutes les catégories d'items disponibles dans l'application.
 * Utilisée dans les formulaires et les filtres.
 */
export const ITEM_CATEGORIES = [
  'CLOTHING', // Vêtements
  'ELECTRONICS', // Électronique
  'BOOKS', // Livres
  'HOME', // Maison
  'TOOLS', // Outils
  'TOYS', // Jouets
  'SPORTS', // Sport
  'ART', // Art
  'VINTAGE', // Vintage
  'HANDCRAFT', // Artisanat
  'OTHER', // Autre
] as const;

/**
 * CONSTANTE: ITEM_CONDITIONS
 *
 * Liste de toutes les conditions possibles pour un item.
 * Utilisée dans les formulaires et les filtres.
 */
export const ITEM_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'TO_REPAIR'] as const;

/**
 * CONSTANTE: ITEM_STATUS
 *
 * Liste de tous les statuts possibles pour un item.
 * Utilisée pour filtrer les items selon leur disponibilité.
 */
export const ITEM_STATUS = [
  'AVAILABLE', // Disponible
  'PENDING', // En cours d'échange
  'TRADED', // Échangé
  'ARCHIVED', // Archivé
] as const;

/**
 * CONSTANTE: SORT_OPTIONS
 *
 * Options de tri disponibles pour les listes d'items.
 * Utilisée dans les filtres et les paramètres de requête.
 */
export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Plus récent' }, // Tri décroissant par date de création
  { value: 'createdAt', label: 'Plus ancien' }, // Tri croissant par date de création
  { value: 'title', label: 'Titre A-Z' }, // Tri croissant par titre
  { value: '-title', label: 'Titre Z-A' }, // Tri décroissant par titre
] as const;

/**
 * CONSTANTE: ITEM_CATEGORY_LABELS
 *
 * Dictionnaire des labels français pour les catégories d'items.
 * Utilisé pour afficher les catégories dans l'interface utilisateur.
 */
export const ITEM_CATEGORY_LABELS: Record<string, string> = {
  CLOTHING: 'Vêtements',
  ELECTRONICS: 'Électronique',
  BOOKS: 'Livres',
  HOME: 'Maison',
  TOOLS: 'Outils',
  TOYS: 'Jouets',
  SPORTS: 'Sport',
  ART: 'Art',
  VINTAGE: 'Vintage',
  HANDCRAFT: 'Artisanat',
  OTHER: 'Autre',
};

/**
 * CONSTANTE: ITEM_CONDITION_LABELS
 *
 * Dictionnaire des labels français pour les conditions d'items.
 * Utilisé pour afficher les conditions dans l'interface utilisateur.
 */
export const ITEM_CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon état',
  FAIR: 'État correct',
  TO_REPAIR: 'À réparer',
};

/**
 * CONSTANTE: ITEM_STATUS_LABELS
 *
 * Dictionnaire des labels français pour les statuts d'items.
 * Utilisé pour afficher les statuts dans l'interface utilisateur.
 */
export const ITEM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  PENDING: 'En cours',
  TRADED: 'Échangé',
  ARCHIVED: 'Archivé',
};

/**
 * CONSTANTE: UPLOAD_CONFIG
 *
 * Configuration pour les uploads de photos d'items.
 * Définit les limites de taille, types autorisés, et nombre maximum de fichiers.
 */
export const UPLOAD_CONFIG = {
  maxFileSize: 3 * 1024 * 1024, // 3MB en octets
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], // Types MIME autorisés
  maxFiles: 5, // Nombre maximum de photos par item
} as const;

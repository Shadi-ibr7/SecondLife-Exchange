/**
 * FICHIER: lib/constants.ts
 *
 * DESCRIPTION:
 * Ce fichier contient toutes les constantes utilisées dans l'application frontend.
 * Il définit les catégories, conditions, statuts d'items, options de tri,
 * et les labels traduits en français. Ces constantes centralisent toutes les valeurs
 * possibles pour garantir la cohérence et faciliter la maintenance.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Définition des catégories d'items disponibles (CLOTHING, ELECTRONICS, etc.)
 * - Définition des conditions d'items (NEW, GOOD, FAIR, TO_REPAIR)
 * - Définition des statuts d'items (AVAILABLE, PENDING, TRADED, ARCHIVED)
 * - Options de tri pour les listes d'items (date, titre, etc.)
 * - Labels traduits en français pour l'affichage dans l'interface
 * - Configuration des uploads de photos (taille max, types autorisés, nombre max)
 *
 * UTILISATION:
 * Ces constantes sont importées et utilisées dans:
 * - Les formulaires (ItemForm) pour les sélecteurs
 * - Les filtres (ItemFilters) pour les options de filtrage
 * - Les composants d'affichage (ItemCard, ItemGrid) pour les labels
 * - Les validations (Zod schemas) pour les valeurs autorisées
 *
 * AVANTAGES:
 * - Source unique de vérité pour toutes les valeurs possibles
 * - Facilite la maintenance (changement en un seul endroit)
 * - Garantit la cohérence dans toute l'application
 * - Type-safe avec TypeScript (as const)
 */

/**
 * CONSTANTE: ITEM_CATEGORIES
 *
 * Liste de toutes les catégories d'items disponibles dans l'application.
 * Utilisée dans les formulaires (ItemForm) et les filtres (ItemFilters).
 *
 * TYPE:
 * - as const: rend le tableau readonly et les valeurs littérales (type-safe)
 * - Permet à TypeScript d'inférer les types exacts au lieu de string[]
 *
 * UTILISATION:
 * - Dans les sélecteurs de catégorie (formulaires)
 * - Dans les filtres de recherche
 * - Pour valider les catégories dans les schémas Zod
 * - Pour mapper vers les labels français (ITEM_CATEGORY_LABELS)
 *
 * NOTE:
 * Ces valeurs doivent correspondre exactement aux catégories définies dans le backend.
 * Toute modification doit être synchronisée avec le backend.
 */
export const ITEM_CATEGORIES = [
  'CLOTHING', // Vêtements (vêtements, chaussures, accessoires)
  'ELECTRONICS', // Électronique (smartphones, ordinateurs, gadgets)
  'BOOKS', // Livres (romans, manuels, bandes dessinées)
  'HOME', // Maison (décoration, mobilier, ustensiles)
  'TOOLS', // Outils (bricolage, jardinage, professionnel)
  'TOYS', // Jouets (enfants, jeux de société, puzzles)
  'SPORTS', // Sport (équipement sportif, vêtements de sport)
  'ART', // Art (peintures, sculptures, objets d'art)
  'VINTAGE', // Vintage (objets rétro, collection)
  'HANDCRAFT', // Artisanat (objets faits main, créations)
  'OTHER', // Autre (catégorie fourre-tout pour les items non classés)
] as const;

/**
 * CONSTANTE: ITEM_CONDITIONS
 *
 * Liste de toutes les conditions possibles pour un item.
 * Utilisée dans les formulaires (ItemForm) et les filtres (ItemFilters).
 *
 * HIÉRARCHIE DES CONDITIONS (du meilleur au pire):
 * - NEW: Neuf (jamais utilisé, état parfait)
 * - GOOD: Bon état (utilisé mais en excellent état, peu de signes d'usure)
 * - FAIR: État correct (utilisé avec signes d'usure normaux, fonctionne bien)
 * - TO_REPAIR: À réparer (nécessite des réparations pour fonctionner correctement)
 *
 * TYPE:
 * - as const: rend le tableau readonly et les valeurs littérales (type-safe)
 *
 * UTILISATION:
 * - Dans les sélecteurs de condition (formulaires)
 * - Dans les filtres de recherche
 * - Pour valider les conditions dans les schémas Zod
 * - Pour mapper vers les labels français (ITEM_CONDITION_LABELS)
 *
 * NOTE:
 * Ces valeurs doivent correspondre exactement aux conditions définies dans le backend.
 */
export const ITEM_CONDITIONS = [
  'NEW', // Neuf (jamais utilisé, état parfait)
  'GOOD', // Bon état (utilisé mais en excellent état)
  'FAIR', // État correct (utilisé avec signes d'usure normaux)
  'TO_REPAIR', // À réparer (nécessite des réparations)
] as const;

/**
 * CONSTANTE: ITEM_STATUS
 *
 * Liste de tous les statuts possibles pour un item.
 * Utilisée pour filtrer les items selon leur disponibilité et leur état.
 *
 * STATUTS DISPONIBLES:
 * - AVAILABLE: Disponible (l'item peut être échangé, visible dans les recherches)
 * - PENDING: En cours d'échange (un échange est en cours, l'item est temporairement indisponible)
 * - TRADED: Échangé (l'item a été échangé avec succès, plus disponible)
 * - ARCHIVED: Archivé (l'item est masqué mais pas supprimé, peut être réactivé)
 *
 * TYPE:
 * - as const: rend le tableau readonly et les valeurs littérales (type-safe)
 *
 * UTILISATION:
 * - Dans les filtres de recherche (ItemFilters)
 * - Pour valider les statuts dans les schémas Zod
 * - Pour mapper vers les labels français (ITEM_STATUS_LABELS)
 * - Pour déterminer la visibilité des items dans les listes
 *
 * NOTE:
 * Ces valeurs doivent correspondre exactement aux statuts définis dans le backend.
 * Le statut est géré automatiquement par le système selon les échanges en cours.
 */
export const ITEM_STATUS = [
  'AVAILABLE', // Disponible (peut être échangé)
  'PENDING', // En cours d'échange (temporairement indisponible)
  'TRADED', // Échangé (plus disponible, échange terminé)
  'ARCHIVED', // Archivé (masqué mais pas supprimé)
] as const;

/**
 * CONSTANTE: SORT_OPTIONS
 *
 * Options de tri disponibles pour les listes d'items.
 * Utilisée dans les filtres (ItemFilters) et les paramètres de requête API.
 *
 * FORMAT DES VALEURS:
 * - Préfixe "-" = tri décroissant (du plus récent au plus ancien, Z à A)
 * - Pas de préfixe = tri croissant (du plus ancien au plus récent, A à Z)
 *
 * OPTIONS DISPONIBLES:
 * - '-createdAt': Plus récent (les items les plus récents en premier)
 * - 'createdAt': Plus ancien (les items les plus anciens en premier)
 * - 'title': Titre A-Z (tri alphabétique croissant)
 * - '-title': Titre Z-A (tri alphabétique décroissant)
 *
 * TYPE:
 * - as const: rend le tableau readonly et les valeurs littérales (type-safe)
 *
 * UTILISATION:
 * - Dans les sélecteurs de tri (ItemFilters)
 * - Comme paramètre de requête API (ex: ?sort=-createdAt)
 * - Pour mapper les valeurs vers les labels affichés à l'utilisateur
 *
 * NOTE:
 * Les valeurs (value) sont utilisées directement dans les requêtes API.
 * Le backend doit supporter ces formats de tri.
 */
export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Plus récent' }, // Tri décroissant par date de création (nouveaux d'abord)
  { value: 'createdAt', label: 'Plus ancien' }, // Tri croissant par date de création (anciens d'abord)
  { value: 'title', label: 'Titre A-Z' }, // Tri croissant par titre (alphabétique A-Z)
  { value: '-title', label: 'Titre Z-A' }, // Tri décroissant par titre (alphabétique Z-A)
] as const;

/**
 * CONSTANTE: ITEM_CATEGORY_LABELS
 *
 * Dictionnaire des labels français pour les catégories d'items.
 * Utilisé pour afficher les catégories dans l'interface utilisateur de manière lisible.
 *
 * STRUCTURE:
 * - Clé: valeur de catégorie (ex: 'CLOTHING')
 * - Valeur: label français affiché (ex: 'Vêtements')
 *
 * UTILISATION:
 * - Dans les composants d'affichage (ItemCard, ItemFilters)
 * - Pour traduire les valeurs techniques en labels compréhensibles
 * - Dans les badges et les sélecteurs de catégorie
 *
 * EXEMPLE:
 * ITEM_CATEGORY_LABELS['CLOTHING'] -> "Vêtements"
 * ITEM_CATEGORY_LABELS['ELECTRONICS'] -> "Électronique"
 *
 * NOTE:
 * Toutes les catégories de ITEM_CATEGORIES doivent avoir un label correspondant.
 * Si une catégorie n'a pas de label, elle sera affichée telle quelle (fallback).
 */
export const ITEM_CATEGORY_LABELS: Record<string, string> = {
  CLOTHING: 'Vêtements', // Vêtements, chaussures, accessoires de mode
  ELECTRONICS: 'Électronique', // Smartphones, ordinateurs, gadgets électroniques
  BOOKS: 'Livres', // Romans, manuels, bandes dessinées, magazines
  HOME: 'Maison', // Décoration, mobilier, ustensiles de cuisine
  TOOLS: 'Outils', // Outils de bricolage, jardinage, professionnels
  TOYS: 'Jouets', // Jouets pour enfants, jeux de société, puzzles
  SPORTS: 'Sport', // Équipement sportif, vêtements de sport
  ART: 'Art', // Peintures, sculptures, objets d'art
  VINTAGE: 'Vintage', // Objets rétro, collection, antiquités
  HANDCRAFT: 'Artisanat', // Objets faits main, créations artisanales
  OTHER: 'Autre', // Catégorie fourre-tout pour les items non classés
};

/**
 * CONSTANTE: ITEM_CONDITION_LABELS
 *
 * Dictionnaire des labels français pour les conditions d'items.
 * Utilisé pour afficher les conditions dans l'interface utilisateur de manière lisible.
 *
 * STRUCTURE:
 * - Clé: valeur de condition (ex: 'NEW')
 * - Valeur: label français affiché (ex: 'Neuf')
 *
 * UTILISATION:
 * - Dans les composants d'affichage (ItemCard, ItemFilters)
 * - Pour traduire les valeurs techniques en labels compréhensibles
 * - Dans les badges de condition
 *
 * EXEMPLE:
 * ITEM_CONDITION_LABELS['NEW'] -> "Neuf"
 * ITEM_CONDITION_LABELS['GOOD'] -> "Bon état"
 *
 * NOTE:
 * Toutes les conditions de ITEM_CONDITIONS doivent avoir un label correspondant.
 * Si une condition n'a pas de label, elle sera affichée telle quelle (fallback).
 */
export const ITEM_CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf', // Jamais utilisé, état parfait
  GOOD: 'Bon état', // Utilisé mais en excellent état, peu de signes d'usure
  FAIR: 'État correct', // Utilisé avec signes d'usure normaux, fonctionne bien
  TO_REPAIR: 'À réparer', // Nécessite des réparations pour fonctionner correctement
};

/**
 * CONSTANTE: ITEM_STATUS_LABELS
 *
 * Dictionnaire des labels français pour les statuts d'items.
 * Utilisé pour afficher les statuts dans l'interface utilisateur de manière lisible.
 *
 * STRUCTURE:
 * - Clé: valeur de statut (ex: 'AVAILABLE')
 * - Valeur: label français affiché (ex: 'Disponible')
 *
 * UTILISATION:
 * - Dans les composants d'affichage (ItemCard, ItemFilters)
 * - Pour traduire les valeurs techniques en labels compréhensibles
 * - Dans les badges de statut
 *
 * EXEMPLE:
 * ITEM_STATUS_LABELS['AVAILABLE'] -> "Disponible"
 * ITEM_STATUS_LABELS['PENDING'] -> "En cours"
 *
 * NOTE:
 * Tous les statuts de ITEM_STATUS doivent avoir un label correspondant.
 * Si un statut n'a pas de label, il sera affiché tel quel (fallback).
 */
export const ITEM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible', // L'item peut être échangé, visible dans les recherches
  PENDING: 'En cours', // Un échange est en cours, l'item est temporairement indisponible
  TRADED: 'Échangé', // L'item a été échangé avec succès, plus disponible
  ARCHIVED: 'Archivé', // L'item est masqué mais pas supprimé, peut être réactivé
};

/**
 * CONSTANTE: UPLOAD_CONFIG
 *
 * Configuration pour les uploads de photos d'items vers Cloudinary.
 * Définit les limites de taille, types autorisés, et nombre maximum de fichiers.
 * Ces limites sont appliquées côté client (validation) et côté serveur (sécurité).
 *
 * PROPRIÉTÉS:
 * - maxFileSize: Taille maximale d'un fichier en octets (3MB = 3 * 1024 * 1024)
 * - allowedTypes: Types MIME autorisés pour les images
 * - maxFiles: Nombre maximum de photos qu'un utilisateur peut uploader par item
 *
 * UTILISATION:
 * - Dans les composants d'upload (CloudinaryDropzone, AvatarUpload)
 * - Pour valider les fichiers avant l'upload
 * - Pour afficher les messages d'erreur appropriés
 *
 * LIMITES:
 * - maxFileSize: 3MB (3 145 728 octets)
 *   Raison: Équilibre entre qualité d'image et temps de chargement
 * - allowedTypes: JPEG, PNG, WebP uniquement
 *   Raison: Formats d'image supportés par tous les navigateurs et optimisés pour le web
 * - maxFiles: 5 photos par item
 *   Raison: Suffisant pour montrer l'item sous différents angles sans surcharger
 *
 * NOTE:
 * Ces limites doivent correspondre aux limites configurées dans Cloudinary.
 * Toute modification doit être synchronisée avec la configuration Cloudinary.
 *
 * TYPE:
 * - as const: rend l'objet readonly et les valeurs littérales (type-safe)
 */
export const UPLOAD_CONFIG = {
  /**
   * Taille maximale d'un fichier: 3MB
   * Calcul: 3 * 1024 (KB) * 1024 (B) = 3 145 728 octets
   * Cette limite équilibre la qualité d'image et le temps de chargement
   */
  maxFileSize: 3 * 1024 * 1024, // 3MB en octets (3 145 728 octets)

  /**
   * Types MIME autorisés pour les images
   * - image/jpeg: Format JPEG (photos, compression avec perte)
   * - image/png: Format PNG (graphiques, compression sans perte, transparence)
   * - image/webp: Format WebP (format moderne, meilleure compression que JPEG/PNG)
   *
   * Ces formats sont supportés par tous les navigateurs modernes et optimisés pour le web
   */
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], // Types MIME autorisés

  /**
   * Nombre maximum de photos par item: 5
   * Cette limite permet de montrer l'item sous différents angles sans surcharger
   * l'interface et les performances (chargement, stockage)
   */
  maxFiles: 5, // Nombre maximum de photos par item
} as const;

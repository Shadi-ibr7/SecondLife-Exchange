export const ITEM_CATEGORIES = [
  'CLOTHING',
  'ELECTRONICS',
  'BOOKS',
  'HOME',
  'TOOLS',
  'TOYS',
  'SPORTS',
  'ART',
  'VINTAGE',
  'HANDCRAFT',
  'OTHER',
] as const;

export const ITEM_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'TO_REPAIR'] as const;

export const ITEM_STATUS = [
  'AVAILABLE',
  'PENDING',
  'TRADED',
  'ARCHIVED',
] as const;

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Plus récent' },
  { value: 'createdAt', label: 'Plus ancien' },
  { value: 'title', label: 'Titre A-Z' },
  { value: '-title', label: 'Titre Z-A' },
] as const;

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

export const ITEM_CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon état',
  FAIR: 'État correct',
  TO_REPAIR: 'À réparer',
};

export const ITEM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  PENDING: 'En cours',
  TRADED: 'Échangé',
  ARCHIVED: 'Archivé',
};

export const UPLOAD_CONFIG = {
  maxFileSize: 3 * 1024 * 1024, // 3MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 5,
} as const;

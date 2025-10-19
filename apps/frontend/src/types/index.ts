export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category:
    | 'CLOTHING'
    | 'ELECTRONICS'
    | 'BOOKS'
    | 'HOME'
    | 'TOOLS'
    | 'TOYS'
    | 'SPORTS'
    | 'ART'
    | 'VINTAGE'
    | 'HANDCRAFT'
    | 'OTHER';
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'TO_REPAIR';
  status: 'AVAILABLE' | 'PENDING' | 'TRADED' | 'ARCHIVED';
  tags: string[];
  aiSummary?: string;
  aiRepairTip?: string;
  photos: ItemPhoto[];
  createdAt: string;
  updatedAt: string;
  owner: User;
}

export interface ItemPhoto {
  id: string;
  itemId: string;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  exchangeId: string;
  createdAt: string;
  sender: User;
}

export interface WeeklyTheme {
  id: string;
  title: string;
  slug: string;
  startOfWeek: string;
  impactText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  suggestions: SuggestedItem[];
}

export interface SuggestedItem {
  id: string;
  themeId: string;
  name: string;
  category: string;
  country: string;
  era?: string;
  materials?: string;
  ecoReason: string;
  repairDifficulty?: 'faible' | 'moyenne' | 'elevee';
  popularity?: number;
  tags: string[];
  photoRef?: string;
  aiModel?: string;
  aiPromptHash?: string;
  aiRaw?: any;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// DTOs pour les formulaires
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
}

export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

// Types pour les items
export type ItemCategory =
  (typeof import('../lib/constants').ITEM_CATEGORIES)[number];
export type ItemCondition =
  (typeof import('../lib/constants').ITEM_CONDITIONS)[number];
export type ItemStatus =
  (typeof import('../lib/constants').ITEM_STATUS)[number];

export interface ItemPhoto {
  id: string;
  itemId: string;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface CreateItemDto {
  title: string;
  description: string;
  category?: ItemCategory; // optionnel si aiAuto=true
  condition: ItemCondition;
  tags?: string[];
  aiAuto?: boolean;
}

export interface UpdateItemDto extends Partial<CreateItemDto> {
  status?: ItemStatus;
}

export interface ListItemsParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: ItemCategory;
  condition?: ItemCondition;
  status?: ItemStatus;
  ownerId?: string;
  sort?: string;
}

export interface UploadSignature {
  signature: string;
  timestamp: string;
  folder: string;
}

export interface PhotoMeta {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

// Types pour les échanges
export type ExchangeStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Exchange {
  id: string;
  requesterId: string;
  responderId: string;
  requestedItemTitle: string;
  offeredItemTitle: string;
  status: ExchangeStatus;
  createdAt: string;
  completedAt?: string;
  requester: User;
  responder: User;
  messages?: ChatMessage[];
}

// Types pour le chat
export interface ChatMessage {
  id?: string; // optionnel côté front (optimistic)
  exchangeId: string;
  senderId: string;
  content: string;
  createdAt?: string;
  sender?: User;
}

// Types pour les thèmes (mise à jour)
export interface WeeklyTheme {
  id: string;
  title: string;
  slug: string;
  startOfWeek: string;
  impactText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  suggestions: SuggestedItem[];
}

export interface SuggestedItem {
  id: string;
  themeId: string;
  name: string;
  category: string;
  country: string;
  era?: string;
  materials?: string;
  ecoReason: string;
  repairDifficulty?: 'faible' | 'moyenne' | 'elevee';
  popularity?: number;
  tags: string[];
  photoRef?: string;
  aiModel?: string;
  aiPromptHash?: string;
  aiRaw?: any;
  createdAt: string;
}

// DTOs pour les échanges
export interface CreateExchangeDto {
  responderId: string;
  requestedItemTitle: string;
  offeredItemTitle: string;
  message?: string;
}

export interface UpdateExchangeStatusDto {
  status: ExchangeStatus;
  message?: string;
}

export interface ListExchangesParams {
  page?: number;
  limit?: number;
  status?: ExchangeStatus;
  sort?: string;
}

// DTOs pour les thèmes
export interface ListThemesParams {
  from?: string;
  to?: string;
}

export interface ListSuggestionsParams {
  page?: number;
  limit?: number;
}

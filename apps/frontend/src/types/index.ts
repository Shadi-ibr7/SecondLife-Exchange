export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  roles: 'USER' | 'ADMIN';
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
  popularityScore: number;
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
  timestamp: number | string;
  folder: string;
  public_id?: string;
  allowed_formats?: string[];
  max_bytes?: number;
  transformation?: string;
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
  message?: string;
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
  images?: string[]; // URLs des images
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

// Types pour le matching
export interface RecommendationReason {
  type:
    | 'category'
    | 'condition'
    | 'tags'
    | 'popularity'
    | 'rarity'
    | 'location'
    | 'history';
  score: number;
  description: string;
}

export interface Recommendation {
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    tags: string[];
    popularityScore: number;
    owner: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
    photos: Array<{
      id: string;
      url: string;
      width?: number;
      height?: number;
    }>;
    createdAt: string;
  };
  score: number;
  reasons: RecommendationReason[];
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  userPreferences?: {
    preferredCategories: string[];
    preferredConditions: string[];
    country?: string;
  };
}

export interface SavePreferencesDto {
  preferredCategories?: string[];
  dislikedCategories?: string[];
  preferredConditions?: string[];
  locale?: string;
  country?: string;
  radiusKm?: number;
}

export interface PreferencesResponse {
  preferences: {
    userId: string;
    preferredCategories: string[];
    dislikedCategories: string[];
    preferredConditions: string[];
    locale?: string;
    country?: string;
    radiusKm?: number;
  };
}

export interface GetRecommendationsParams {
  limit?: number;
}

// Types pour le contenu éco
export interface EcoContent {
  id: string;
  kind: 'ARTICLE' | 'VIDEO' | 'STAT';
  title: string;
  url: string;
  locale?: string;
  tags: string[];
  source?: string;
  summary?: string;
  kpis?: any;
  publishedAt?: string;
  createdAt: string;
}

export interface PaginatedEcoContentResponse {
  items: EcoContent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListEcoContentParams {
  kind?: 'ARTICLE' | 'VIDEO' | 'STAT';
  tag?: string;
  locale?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateEcoContentDto {
  kind: 'ARTICLE' | 'VIDEO' | 'STAT';
  title: string;
  url: string;
  locale?: string;
  tags?: string[];
  source?: string;
  publishedAt?: string;
}

export interface UpdateEcoContentDto {
  kind?: 'ARTICLE' | 'VIDEO' | 'STAT';
  title?: string;
  url?: string;
  locale?: string;
  tags?: string[];
  source?: string;
  publishedAt?: string;
}

export interface EnrichEcoContentResponse {
  summary: string;
  tags: string[];
  kpis?: any;
}

export interface EcoContentStats {
  total: number;
  byKind: Record<string, number>;
  byLocale: Record<string, number>;
}

// Types pour la communauté
export interface Thread {
  id: string;
  scope: 'THEME' | 'CATEGORY' | 'ITEM' | 'GENERAL';
  scopeRef?: string;
  title: string;
  authorId: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  postsCount: number;
  lastPostAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  repliesTo?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  repliesCount: number;
  isEdited: boolean;
}

export interface PaginatedThreadsResponse {
  items: Thread[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPostsResponse {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListThreadsParams {
  scope?: 'THEME' | 'CATEGORY' | 'ITEM' | 'GENERAL';
  ref?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ListPostsParams {
  page?: number;
  limit?: number;
}

export interface CreateThreadDto {
  scope: 'THEME' | 'CATEGORY' | 'ITEM' | 'GENERAL';
  scopeRef?: string;
  title: string;
  contentFirst: string;
}

export interface CreatePostDto {
  content: string;
  repliesTo?: string;
}

export interface UpdatePostDto {
  content: string;
}

// Types pour les notifications
export interface NotificationToken {
  id: string;
  userId: string;
  provider: 'webpush' | 'fcm';
  token: string;
  createdAt: string;
}

export interface RegisterTokenDto {
  token: string;
  provider?: 'webpush' | 'fcm';
}

export interface SendTestNotificationDto {
  userId?: string;
  title?: string;
  body?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  sentCount: number;
}

// Types pour le calendrier des thèmes
export interface CalendarWeek {
  weekStart: string;
  weekEnd: string;
  title: string;
  isActive: boolean;
  themeId: string | null;
  theme: {
    id: string;
    title: string;
    description: string;
    startOfWeek: string;
    slug: string;
  } | null;
}

export interface CalendarResponse {
  weeks: CalendarWeek[];
  totalWeeks: number;
  currentWeek: number;
}

/**
 * FICHIER: admin.types.ts
 *
 * DESCRIPTION:
 * Types TypeScript pour les entités admin.
 */

// ============ Common Types ============

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ User Types ============

export type UserRole = 'USER' | 'ADMIN';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  roles: UserRole;
  createdAt: string;
  updatedAt: string;
  profile?: AdminUserProfile | null;
  preferences?: AdminUserPreferences | null;
  ban?: AdminUserBan | null;
  items?: AdminItem[];
  _count?: {
    items?: number;
    exchangesRequested?: number;
    exchangesResponded?: number;
  };
}

export interface AdminUserProfile {
  id: string;
  bio?: string | null;
  location?: string | null;
}

export interface AdminUserPreferences {
  id: string;
  locale?: string | null;
  country?: string | null;
  radiusKm?: number | null;
  preferredCategories?: string[];
}

export interface AdminUserBan {
  id: string;
  reason?: string | null;
  createdAt: string;
  bannedBy?: string | null;
}

export interface UsersListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserAnalytics {
  total: number;
  active: number;
  banned: number;
  newThisMonth: number;
}

// ============ Item Types ============

export type ItemStatus = 'AVAILABLE' | 'PENDING' | 'TRADED' | 'ARCHIVED';
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';

export interface AdminItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  condition: ItemCondition;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: AdminUser;
  photos?: AdminItemPhoto[];
  aiSummary?: string | null;
  repairTips?: string | null;
}

export interface AdminItemPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface ItemsListResponse {
  items: AdminItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ItemAnalytics {
  total: number;
  byStatus: { status: ItemStatus; count: number }[];
  byCategory: { category: string; count: number }[];
}

// ============ Exchange Types ============

export type ExchangeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface AdminExchange {
  id: string;
  status: ExchangeStatus;
  createdAt: string;
  updatedAt: string;
  requesterId: string;
  responderId: string;
  requester?: AdminUser;
  responder?: AdminUser;
  requesterItem?: AdminItem;
  responderItem?: AdminItem;
}

export interface ExchangesListResponse {
  exchanges: AdminExchange[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ Report Types ============

export type ReportType = 'SPAM' | 'INAPPROPRIATE' | 'FRAUD' | 'HARASSMENT' | 'OTHER';
export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AdminReport {
  id: string;
  type: ReportType;
  severity?: ReportSeverity;
  message: string;
  resolved: boolean;
  inProgress?: boolean;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  reporter?: AdminUser;
  targetUserId?: string | null;
  targetUser?: AdminUser;
  targetItemId?: string | null;
  targetItem?: AdminItem;
}

export interface ReportsListResponse {
  reports: AdminReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ Eco Content Types ============

export type EcoContentKind = 'ARTICLE' | 'VIDEO' | 'STATS' | 'INFOGRAPHIC';

export interface AdminEcoContent {
  id: string;
  title: string;
  url: string;
  kind?: EcoContentKind | string;
  locale?: string;
  summary?: string | null;
  source?: string | null;
  tags?: string[];
  published?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export interface EcoContentListResponse {
  content: AdminEcoContent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEcoContentPayload {
  title: string;
  url: string;
  kind?: string;
  locale?: string;
  summary?: string;
  source?: string;
  tags?: string[];
  published?: boolean;
}

export interface UpdateEcoContentPayload {
  title?: string;
  url?: string;
  kind?: string;
  locale?: string;
  summary?: string;
  source?: string;
  tags?: string[];
  published?: boolean;
}

// ============ Theme Types ============

export interface AdminTheme {
  id: string;
  title: string;
  slug: string;
  startOfWeek: string;
  impactText?: string | null;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    suggestions?: number;
  };
}

export interface CreateThemePayload {
  title: string;
  slug: string;
  startOfWeek: string;
  impactText?: string;
  isActive?: boolean;
}

export interface UpdateThemePayload {
  title?: string;
  slug?: string;
  startOfWeek?: string;
  impactText?: string;
  isActive?: boolean;
}

// ============ Community Types ============

export interface AdminThread {
  id: string;
  title: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: AdminUser;
  _count?: {
    posts?: number;
  };
}

export interface AdminPost {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  threadId: string;
  author?: AdminUser;
  thread?: AdminThread;
}

// ============ Log Types ============

export type LogAction = string;

export interface AdminLog {
  id: string;
  action: LogAction;
  resourceType?: string;
  resourceId?: string;
  adminId?: string;
  admin?: AdminUser;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface LogsListResponse {
  logs: AdminLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ Analytics Types ============

export interface AnalyticsOverview {
  users: {
    total: number;
    active: number;
    new: number;
  };
  items: {
    total: number;
    available: number;
    traded: number;
  };
  exchanges: {
    total: number;
    completed: number;
    pending: number;
  };
}

// ============ Dashboard Types ============

export interface DashboardStats {
  users: {
    total: number;
    new: number;
    active: number;
  };
  items: {
    total: number;
    available: number;
  };
  exchanges: {
    total: number;
    completed: number;
  };
  reports: {
    pending: number;
  };
}

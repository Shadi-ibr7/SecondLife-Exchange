/**
 * FICHIER: lib/notifications.api.ts
 *
 * DESCRIPTION:
 * Client API pour les notifications In-App et Push Web.
 * Utilise l'instance Axios partagée pour la gestion des tokens.
 *
 * ENDPOINTS:
 * - getNotifications: Liste paginée des notifications
 * - getUnreadCount: Nombre de notifications non lues
 * - markAsRead: Marquer une notification comme lue
 * - markAllAsRead: Marquer toutes les notifications comme lues
 * - subscribePush: S'abonner aux notifications push
 * - unsubscribePush: Se désabonner des notifications push
 */

import { apiClient } from './api';

// ============================================
// TYPES
// ============================================

export type NotificationType =
  | 'MESSAGE'
  | 'EXCHANGE_REQUEST'
  | 'EXCHANGE_STATUS'
  | 'ADMIN_ACTION'
  | 'ECO_CONTENT_PUBLISHED'
  | 'MATCH_FOUND'
  | 'WEEKLY_THEME'
  | 'SYSTEM'
  | 'POST_LIKED'
  | 'THREAD_REPLY'
  | 'POST_REPLY';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Récupère la liste paginée des notifications.
 *
 * @param params - Paramètres de pagination et filtrage
 * @returns Liste paginée des notifications
 */
export async function getNotifications(
  params: ListNotificationsParams = {}
): Promise<PaginatedNotifications> {
  const { page = 1, limit = 20, unreadOnly = false } = params;
  const response = await apiClient.client.get<PaginatedNotifications>(
    '/notifications',
    {
      params: { page, limit, unreadOnly },
    }
  );
  return response.data;
}

/**
 * Récupère le nombre de notifications non lues.
 *
 * @returns Compteur de notifications non lues
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.client.get<UnreadCountResponse>(
    '/notifications/unread-count'
  );
  return response.data.count;
}

/**
 * Marque une notification comme lue.
 *
 * @param id - ID de la notification
 * @returns Notification mise à jour
 */
export async function markAsRead(id: string): Promise<AppNotification> {
  const response = await apiClient.client.patch<AppNotification>(
    `/notifications/${id}/read`
  );
  return response.data;
}

/**
 * Marque toutes les notifications comme lues.
 *
 * @returns Nombre de notifications marquées comme lues
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await apiClient.client.patch<{ count: number }>(
    '/notifications/read-all'
  );
  return response.data;
}

/**
 * S'abonne aux notifications push.
 *
 * @param subscription - Données de la subscription WebPush
 * @returns Token enregistré
 */
export async function subscribePush(
  subscription: WebPushSubscription
): Promise<unknown> {
  const response = await apiClient.client.post(
    '/notifications/push/subscribe',
    subscription
  );
  return response.data;
}

/**
 * Se désabonne des notifications push.
 *
 * @param endpoint - URL de l'endpoint push
 * @returns Succès de la désabonnement
 */
export async function unsubscribePush(
  endpoint: string
): Promise<{ success: boolean }> {
  const response = await apiClient.client.post<{ success: boolean }>(
    '/notifications/push/unsubscribe',
    { endpoint }
  );
  return response.data;
}

// ============================================
// HELPERS
// ============================================

/**
 * Détermine l'URL de navigation à partir des données de la notification.
 *
 * @param notification - La notification
 * @returns URL de destination ou null
 */
export function getNotificationUrl(
  notification: AppNotification
): string | null {
  const { type, data } = notification;
  const d = (data ?? {}) as Record<string, unknown>;

  // Si une URL est explicitement fournie
  if (typeof d.url === 'string' && d.url.length > 0) {
    return d.url;
  }

  // Sinon, construire l'URL selon le type
  switch (type) {
    case 'MESSAGE':
    case 'EXCHANGE_REQUEST':
    case 'EXCHANGE_STATUS':
      // Routes app: /exchanges (liste) et /exchange/[id] (détail)
      return typeof d.exchangeId === 'string' && d.exchangeId
        ? `/exchange/${d.exchangeId}`
        : '/exchanges';

    case 'MATCH_FOUND':
      // Routes app: /item/[id]
      return typeof d.itemId === 'string' && d.itemId
        ? `/item/${d.itemId}`
        : '/matching';

    case 'WEEKLY_THEME':
      return typeof d.themeId === 'string' && d.themeId
        ? `/themes/${d.themeId}`
        : '/themes';

    case 'ECO_CONTENT_PUBLISHED':
      // Routes app: /discover/[id]
      return typeof d.contentId === 'string' && d.contentId
        ? `/discover/${d.contentId}`
        : '/discover';

    case 'ADMIN_ACTION':
      return '/profile';

    case 'POST_LIKED':
    case 'THREAD_REPLY':
    case 'POST_REPLY':
      // Forum: /thread/[id]
      return typeof d.threadId === 'string' && d.threadId
        ? `/thread/${d.threadId}`
        : '/community';

    case 'SYSTEM':
    default:
      return '/notifications';
  }
}

/**
 * Retourne l'icône associée au type de notification.
 *
 * @param type - Type de notification
 * @returns Nom de l'icône Lucide
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'MESSAGE':
      return 'MessageCircle';
    case 'EXCHANGE_REQUEST':
      return 'ArrowLeftRight';
    case 'EXCHANGE_STATUS':
      return 'CheckCircle';
    case 'ADMIN_ACTION':
      return 'ShieldAlert';
    case 'ECO_CONTENT_PUBLISHED':
      return 'Leaf';
    case 'MATCH_FOUND':
      return 'Sparkles';
    case 'WEEKLY_THEME':
      return 'Calendar';
    case 'SYSTEM':
    default:
      return 'Bell';
  }
}

/**
 * Formate la date de la notification de manière relative.
 *
 * @param dateString - Date ISO string
 * @returns Date formatée (ex: "il y a 5 min", "hier", etc.)
 */
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "à l'instant";
  } else if (diffMin < 60) {
    return `il y a ${diffMin} min`;
  } else if (diffHour < 24) {
    return `il y a ${diffHour}h`;
  } else if (diffDay === 1) {
    return 'hier';
  } else if (diffDay < 7) {
    return `il y a ${diffDay} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}

// ============================================
// LEGACY API OBJECT (pour compatibilité)
// ============================================

/**
 * Objet API pour la compatibilité avec le NotificationService existant.
 * @deprecated Utiliser les fonctions individuelles à la place.
 */
export const notificationsApi = {
  /**
   * Enregistre un token de notification.
   */
  registerToken: async (data: { token: string; provider: string }) => {
    const response = await apiClient.client.post(
      '/notifications/register',
      data
    );
    return response.data;
  },

  /**
   * Envoie une notification de test (admin uniquement).
   */
  sendTestNotification: async (data: { title: string; body: string }) => {
    const response = await apiClient.client.post('/notifications/test', data);
    return response.data as {
      success: boolean;
      message: string;
      sentCount: number;
    };
  },
};

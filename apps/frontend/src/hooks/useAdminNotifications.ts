/**
 * FICHIER: hooks/useAdminNotifications.ts
 *
 * DESCRIPTION:
 * Hook personnalisé pour la gestion des notifications admin.
 * Récupère les notifications via l'API admin.
 */

'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin.api';

// Intervalle de polling en millisecondes (30 secondes)
const POLLING_INTERVAL = 30000;

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}


export function useAdminNotifications() {
  // Récupérer le compteur de non lues
  // IMPORTANT: retry: false et retryOnMount: false pour éviter les boucles infinies
  // Si les notifications échouent (401), on ne bloque pas la page
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: async () => {
      try {
        return await adminApi.getUnreadCount();
      } catch (error: any) {
        // Si erreur 401, retourner 0 sans déclencher de refresh
        if (error?.response?.status === 401) {
          console.debug('[Admin Notifications] 401 sur unread-count, retour 0');
          return 0;
        }
        throw error;
      }
    },
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
    retry: false, // Ne pas retry automatiquement
    retryOnMount: false, // Ne pas retry au mount
  });

  // Récupérer les notifications récentes (5 dernières non lues)
  const { data: recentNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-notifications-recent'],
    queryFn: async () => {
      try {
        return await adminApi.getNotifications({ page: 1, limit: 5, unreadOnly: true });
      } catch (error: any) {
        // Si erreur 401, retourner une liste vide sans déclencher de refresh
        if (error?.response?.status === 401) {
          console.debug('[Admin Notifications] 401 sur notifications, retour liste vide');
          return { items: [], total: 0, page: 1, limit: 5, totalPages: 0, unreadCount: 0 };
        }
        throw error;
      }
    },
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
    retry: false, // Ne pas retry automatiquement
    retryOnMount: false, // Ne pas retry au mount
  });

  /**
   * Marque une notification comme lue.
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      await adminApi.markNotificationAsRead(id);
      // Invalider les queries pour rafraîchir
      await Promise.all([
        refetchUnreadCount(),
        refetchNotifications(),
      ]);
    } catch (error) {
      console.error('Erreur mark as read:', error);
      throw error;
    }
  }, [refetchUnreadCount, refetchNotifications]);

  /**
   * Marque toutes les notifications comme lues.
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await adminApi.markAllNotificationsAsRead();
      // Invalider les queries pour rafraîchir
      await Promise.all([
        refetchUnreadCount(),
        refetchNotifications(),
      ]);
    } catch (error) {
      console.error('Erreur mark all as read:', error);
      throw error;
    }
  }, [refetchUnreadCount, refetchNotifications]);

  /**
   * Force un refetch.
   */
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchUnreadCount(),
      refetchNotifications(),
    ]);
  }, [refetchUnreadCount, refetchNotifications]);

  return {
    unreadCount,
    recentNotifications: recentNotifications?.items || [],
    markAsRead,
    markAllAsRead,
    refetch,
  };
}

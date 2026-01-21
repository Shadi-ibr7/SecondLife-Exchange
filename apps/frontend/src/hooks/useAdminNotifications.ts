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
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: () => adminApi.getUnreadCount(),
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
  });

  // Récupérer les notifications récentes (5 dernières non lues)
  const { data: recentNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-notifications-recent'],
    queryFn: () => adminApi.getNotifications({ page: 1, limit: 5, unreadOnly: true }),
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
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

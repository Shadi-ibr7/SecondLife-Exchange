/**
 * FICHIER: hooks/useNotifications.ts
 *
 * DESCRIPTION:
 * Hook personnalisé pour la gestion des notifications.
 * - Polling automatique du compteur de non lues (toutes les 30s)
 * - Refetch immédiat après actions (mark read)
 * - Pause du polling quand la page n'est pas visible
 *
 * UTILISATION:
 * ```tsx
 * const { unreadCount, refetch, markAsRead, markAllAsRead } = useNotifications();
 * ```
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationsStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';
import {
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '@/lib/notifications.api';

// Intervalle de polling en millisecondes (30 secondes)
const POLLING_INTERVAL = 30000;

// Debounce pour éviter les requêtes trop fréquentes
const DEBOUNCE_MS = 1000;

export function useNotifications() {
  const { unreadCount, setUnreadCount, clear } = useNotificationsStore();
  const { isAuthenticated } = useAuthStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  /**
   * Récupère le compteur de non lues depuis l'API.
   * Avec debounce pour éviter les requêtes trop fréquentes.
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    // Debounce: éviter les requêtes trop fréquentes
    const now = Date.now();
    if (now - lastFetchRef.current < DEBOUNCE_MS) {
      return;
    }
    lastFetchRef.current = now;

    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Erreur silencieuse - on garde le compteur local
      console.debug('Erreur fetch unread count:', error);
    }
  }, [isAuthenticated, setUnreadCount]);

  /**
   * Démarre le polling quand la page est visible.
   */
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    // Fetch immédiat
    fetchUnreadCount();

    // Puis polling périodique
    pollingRef.current = setInterval(() => {
      // Vérifier que la page est visible
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, POLLING_INTERVAL);
  }, [fetchUnreadCount]);

  /**
   * Arrête le polling.
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Marque une notification comme lue et rafraîchit le compteur.
   */
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await apiMarkAsRead(id);
        // Rafraîchir le compteur
        await fetchUnreadCount();
      } catch (error) {
        console.error('Erreur mark as read:', error);
        throw error;
      }
    },
    [fetchUnreadCount]
  );

  /**
   * Marque toutes les notifications comme lues.
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      // Mettre à jour le store local immédiatement
      clear();
    } catch (error) {
      console.error('Erreur mark all as read:', error);
      throw error;
    }
  }, [clear]);

  /**
   * Force un refetch du compteur.
   */
  const refetch = useCallback(() => {
    lastFetchRef.current = 0; // Reset debounce
    return fetchUnreadCount();
  }, [fetchUnreadCount]);

  // ============================================
  // EFFETS
  // ============================================

  // Démarrer/arrêter le polling selon l'auth
  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
      clear(); // Réinitialiser le compteur à la déconnexion
    }

    return () => {
      stopPolling();
    };
  }, [isAuthenticated, startPolling, stopPolling, clear]);

  // Gérer la visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Refetch quand la page redevient visible
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount, isAuthenticated]);

  return {
    unreadCount,
    refetch,
    markAsRead,
    markAllAsRead,
  };
}

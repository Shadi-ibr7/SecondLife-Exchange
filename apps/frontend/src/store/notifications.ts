/**
 * FICHIER: notifications.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion du compteur de notifications non lues.
 * Il permet de suivre le nombre de notifications non lues et de le mettre à jour
 * de manière centralisée dans l'application.
 *
 * FONCTIONNALITÉS:
 * - Stockage persistant du compteur dans localStorage
 * - Incrémentation/décrémentation du compteur
 * - Réinitialisation du compteur
 * - Protection contre les valeurs négatives
 *
 * UTILISATION:
 * - Affiché dans la NotificationBell (badge avec le nombre)
 * - Mis à jour lors de la réception de nouvelles notifications
 * - Réinitialisé quand l'utilisateur consulte ses notifications
 */

'use client';

// Import de Zustand
import { create } from 'zustand';

// Import du middleware de persistance
import { persist } from 'zustand/middleware';

/**
 * INTERFACE: NotificationsState
 *
 * Définit la structure de l'état des notifications.
 */
interface NotificationsState {
  unreadCount: number; // Nombre de notifications non lues
  setUnreadCount: (count: number) => void; // Fonction pour définir le compteur
  increment: (by?: number) => void; // Fonction pour incrémenter le compteur
  clear: () => void; // Fonction pour réinitialiser le compteur
}

/**
 * STORE: useNotificationsStore
 *
 * Store Zustand pour la gestion du compteur de notifications.
 * Utilise le middleware persist pour sauvegarder le compteur dans localStorage.
 */
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================
      unreadCount: 0,

      // ============================================
      // ACTION: setUnreadCount
      // ============================================
      /**
       * Définit le nombre de notifications non lues.
       *
       * Protection: Le compteur ne peut pas être négatif (Math.max(0, count)).
       *
       * @param count - Nouveau nombre de notifications non lues
       */
      setUnreadCount: (count: number) =>
        set({ unreadCount: Math.max(0, count) }),

      // ============================================
      // ACTION: increment
      // ============================================
      /**
       * Incrémente le compteur de notifications non lues.
       *
       * @param by - Nombre à ajouter (défaut: 1)
       */
      increment: (by = 1) =>
        set((s) => ({ unreadCount: Math.max(0, s.unreadCount + by) })),

      // ============================================
      // ACTION: clear
      // ============================================
      /**
       * Réinitialise le compteur à 0.
       *
       * Utilisé quand l'utilisateur consulte ses notifications.
       */
      clear: () => set({ unreadCount: 0 }),
    }),
    {
      // ============================================
      // CONFIGURATION DE LA PERSISTANCE
      // ============================================
      /**
       * Nom de la clé dans localStorage
       */
      name: 'notifications-store',

      /**
       * Fonction pour déterminer quelles parties de l'état sont persistées.
       * Seul unreadCount est sauvegardé.
       */
      partialize: (s) => ({ unreadCount: s.unreadCount }),
    }
  )
);

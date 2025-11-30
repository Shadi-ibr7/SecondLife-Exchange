/**
 * FICHIER: store/notifications.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion du compteur de notifications non lues.
 * Il permet de suivre le nombre de notifications non lues et de le mettre à jour
 * de manière centralisée dans l'application. Ce store est utilisé pour afficher
 * un badge avec le nombre de notifications non lues dans l'interface.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Stockage persistant du compteur dans localStorage
 * - Incrémentation/décrémentation du compteur
 * - Réinitialisation du compteur (clear)
 * - Définition directe du compteur (setUnreadCount)
 * - Protection contre les valeurs négatives (Math.max(0, count))
 *
 * ARCHITECTURE:
 * - Pattern: Store Zustand avec middleware de persistance
 * - Persistance: localStorage sous la clé 'notifications-store'
 * - Seul unreadCount est persisté
 *
 * UTILISATION:
 * - Affiché dans la NotificationBell (badge avec le nombre)
 * - Mis à jour lors de la réception de nouvelles notifications (WebSocket, polling)
 * - Réinitialisé quand l'utilisateur consulte ses notifications (page /notifications)
 *
 * EXEMPLE D'UTILISATION:
 * ```tsx
 * const { unreadCount, increment, clear } = useNotificationsStore();
 *
 * // Afficher le badge
 * {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
 *
 * // Incrémenter quand une nouvelle notification arrive
 * increment();
 *
 * // Réinitialiser quand l'utilisateur consulte ses notifications
 * clear();
 * ```
 *
 * @module store/notifications
 */

'use client';

// Import de Zustand pour la gestion d'état global
import { create } from 'zustand';

// Import du middleware de persistance pour sauvegarder dans localStorage
import { persist } from 'zustand/middleware';

/**
 * INTERFACE: NotificationsState
 *
 * Définit la structure de l'état des notifications dans le store Zustand.
 * Cette interface décrit toutes les propriétés et méthodes disponibles
 * dans le store de notifications.
 *
 * PROPRIÉTÉS:
 * - unreadCount: Nombre de notifications non lues (>= 0)
 *
 * ACTIONS:
 * - setUnreadCount: Définit directement le compteur
 * - increment: Incrémente le compteur (par défaut +1)
 * - clear: Réinitialise le compteur à 0
 */
interface NotificationsState {
  /**
   * Nombre de notifications non lues
   * - Toujours >= 0 (protection contre les valeurs négatives)
   * - 0: Aucune notification non lue
   * - > 0: Nombre de notifications non lues
   *
   * PERSISTÉ: Oui (sauvegardé dans localStorage)
   */
  unreadCount: number;

  /**
   * Fonction pour définir directement le compteur
   *
   * PROTECTION:
   * Le compteur ne peut pas être négatif (Math.max(0, count))
   *
   * @param count - Nouveau nombre de notifications non lues (>= 0)
   */
  setUnreadCount: (count: number) => void;

  /**
   * Fonction pour incrémenter le compteur
   *
   * PROTECTION:
   * Le compteur ne peut pas être négatif (Math.max(0, count))
   *
   * @param by - Nombre à ajouter (optionnel, défaut: 1)
   */
  increment: (by?: number) => void;

  /**
   * Fonction pour réinitialiser le compteur à 0
   *
   * UTILISATION:
   * Appelé quand l'utilisateur consulte ses notifications
   * (ex: ouverture de la page /notifications)
   */
  clear: () => void;
}

/**
 * STORE: useNotificationsStore
 *
 * Store Zustand pour la gestion du compteur de notifications non lues.
 * Utilise le middleware persist pour sauvegarder le compteur dans localStorage.
 *
 * ARCHITECTURE:
 * - create<NotificationsState>()(): Crée le store avec TypeScript
 * - persist(): Middleware qui sauvegarde automatiquement dans localStorage
 * - (set) => ({ ... }): Fonction qui retourne l'état initial et les actions
 *
 * PERSISTANCE:
 * - Clé localStorage: 'notifications-store'
 * - Données persistées: unreadCount
 *
 * UTILISATION:
 * ```tsx
 * const { unreadCount, increment, clear } = useNotificationsStore();
 * ```
 */
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    /**
     * Fonction qui définit l'état initial et les actions du store
     *
     * PARAMÈTRES:
     * - set: Fonction pour mettre à jour l'état (set({ unreadCount: ... }))
     *
     * RETOUR:
     * Objet contenant l'état initial et toutes les actions
     */
    (set) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================

      /**
       * Nombre de notifications non lues
       * Initialisé à 0 (aucune notification non lue)
       * Sera mis à jour lors de la réception de nouvelles notifications
       */
      unreadCount: 0,

      // ============================================
      // ACTION: setUnreadCount
      // ============================================
      /**
       * ACTION: setUnreadCount
       *
       * Définit directement le nombre de notifications non lues.
       *
       * UTILISATION:
       * Utilisé pour synchroniser le compteur avec le serveur
       * (ex: après avoir récupéré le nombre réel depuis l'API)
       *
       * PROTECTION:
       * Le compteur ne peut pas être négatif (Math.max(0, count))
       * Si count < 0, le compteur sera mis à 0
       *
       * EXEMPLE:
       * - setUnreadCount(5) -> unreadCount: 5
       * - setUnreadCount(-3) -> unreadCount: 0 (protection)
       * - setUnreadCount(0) -> unreadCount: 0
       *
       * @param count - Nouveau nombre de notifications non lues (peut être négatif, sera corrigé à 0)
       */
      setUnreadCount: (count: number) =>
        /**
         * Mettre à jour le compteur avec protection contre les valeurs négatives
         * Math.max(0, count) garantit que le compteur est toujours >= 0
         */
        set({ unreadCount: Math.max(0, count) }),

      // ============================================
      // ACTION: increment
      // ============================================
      /**
       * ACTION: increment
       *
       * Incrémente le compteur de notifications non lues.
       *
       * UTILISATION:
       * Utilisé quand une nouvelle notification arrive
       * (ex: via WebSocket, polling, ou événement utilisateur)
       *
       * PROTECTION:
       * Le compteur ne peut pas être négatif (Math.max(0, count))
       * Même si by est négatif, le compteur ne descendra pas en dessous de 0
       *
       * EXEMPLES:
       * - increment() -> unreadCount: +1
       * - increment(3) -> unreadCount: +3
       * - increment(-5) avec unreadCount: 2 -> unreadCount: 0 (protection)
       *
       * @param by - Nombre à ajouter (optionnel, défaut: 1, peut être négatif)
       */
      increment: (by = 1) =>
        /**
         * Incrémenter le compteur avec protection contre les valeurs négatives
         *
         * FONCTIONNEMENT:
         * 1. s.unreadCount + by: calcule le nouveau compteur
         * 2. Math.max(0, ...): garantit que le résultat est >= 0
         * 3. set({ unreadCount: ... }): met à jour l'état
         *
         * EXEMPLE:
         * - unreadCount: 5, by: 2 -> nouveau: 7
         * - unreadCount: 2, by: -5 -> nouveau: 0 (protection)
         */
        set((s) => ({ unreadCount: Math.max(0, s.unreadCount + by) })),

      // ============================================
      // ACTION: clear
      // ============================================
      /**
       * ACTION: clear
       *
       * Réinitialise le compteur à 0.
       *
       * UTILISATION:
       * Appelé quand l'utilisateur consulte ses notifications
       * (ex: ouverture de la page /notifications, clic sur la NotificationBell)
       *
       * EXEMPLE:
       * - unreadCount: 5 -> clear() -> unreadCount: 0
       */
      clear: () =>
        /**
         * Réinitialiser le compteur à 0
         * set({ unreadCount: 0 }) met à jour l'état
         */
        set({ unreadCount: 0 }),
    }),
    {
      // ============================================
      // CONFIGURATION DE LA PERSISTANCE
      // ============================================
      /**
       * Nom de la clé dans localStorage
       *
       * Les données seront sauvegardées sous la clé 'notifications-store'
       * Format: { unreadCount: 5 }
       */
      name: 'notifications-store',

      /**
       * Fonction pour déterminer quelles parties de l'état sont persistées
       *
       * DONNÉES PERSISTÉES:
       * - unreadCount: Le nombre de notifications non lues
       *
       * RESTAURATION:
       * Au chargement de la page, Zustand restaure automatiquement unreadCount
       * depuis localStorage. Cela permet de maintenir le compteur même après
       * un rafraîchissement de page.
       *
       * @param s - L'état complet du store
       * @returns Objet avec seulement les propriétés à persister
       */
      partialize: (s) => ({ unreadCount: s.unreadCount }),
    }
  )
);

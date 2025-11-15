/**
 * FICHIER: theme.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion du thème (dark/light/system).
 * Il gère le thème sélectionné par l'utilisateur et applique automatiquement
 * le thème sur l'élément HTML.
 *
 * FONCTIONNALITÉS:
 * - Stockage persistant du thème dans localStorage
 * - Support de trois modes: light, dark, system
 * - Détection automatique du thème système
 * - Application automatique du thème sur l'élément HTML
 *
 * THÈMES:
 * - light: Thème clair
 * - dark: Thème sombre
 * - system: Suit le thème du système d'exploitation
 */

// Import de Zustand
import { create } from 'zustand';

// Import du middleware de persistance
import { persist } from 'zustand/middleware';

/**
 * TYPE: Theme
 *
 * Types de thème disponibles.
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * INTERFACE: ThemeState
 *
 * Définit la structure de l'état du thème.
 */
interface ThemeState {
  theme: Theme; // Thème sélectionné (light/dark/system)
  setTheme: (theme: Theme) => void; // Fonction pour changer le thème
  resolvedTheme: 'light' | 'dark'; // Thème résolu (light ou dark, jamais system)
  setResolvedTheme: (theme: 'light' | 'dark') => void; // Fonction pour définir le thème résolu
}

/**
 * STORE: useThemeStore
 *
 * Store Zustand pour la gestion du thème.
 * Utilise le middleware persist pour sauvegarder le thème dans localStorage.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================
      theme: 'system', // Thème par défaut: système
      resolvedTheme: 'light', // Thème résolu par défaut: clair

      // ============================================
      // ACTION: setTheme
      // ============================================
      /**
       * Change le thème et l'applique immédiatement sur l'élément HTML.
       *
       * Si le thème est 'system', détecte le thème système et l'applique.
       * Sinon, applique directement le thème sélectionné.
       *
       * @param theme - Nouveau thème (light, dark, ou system)
       */
      setTheme: (theme: Theme) => {
        set({ theme });

        // Appliquer le thème immédiatement sur l'élément HTML
        const root = document.documentElement;
        if (theme === 'system') {
          // Détecter le thème système
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light';
          set({ resolvedTheme: systemTheme });
          // Ajouter/enlever la classe 'dark' selon le thème
          root.classList.toggle('dark', systemTheme === 'dark');
        } else {
          // Appliquer directement le thème sélectionné
          set({ resolvedTheme: theme });
          root.classList.toggle('dark', theme === 'dark');
        }
      },

      // ============================================
      // ACTION: setResolvedTheme
      // ============================================
      /**
       * Définit le thème résolu (light ou dark).
       *
       * Utilisé par le composant Providers pour mettre à jour le thème
       * quand le thème système change.
       *
       * @param resolvedTheme - Thème résolu (light ou dark)
       */
      setResolvedTheme: (resolvedTheme: 'light' | 'dark') => {
        set({ resolvedTheme });
      },
    }),
    {
      // ============================================
      // CONFIGURATION DE LA PERSISTANCE
      // ============================================
      /**
       * Nom de la clé dans localStorage
       */
      name: 'theme-storage',
    }
  )
);

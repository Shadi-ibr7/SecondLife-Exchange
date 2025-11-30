/**
 * FICHIER: store/theme.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion du thème (dark/light/system).
 * Il gère le thème sélectionné par l'utilisateur et applique automatiquement
 * le thème sur l'élément HTML. Ce store est utilisé pour permettre à l'utilisateur
 * de basculer entre les thèmes clair, sombre, et système.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Stockage persistant du thème dans localStorage
 * - Support de trois modes: light, dark, system
 * - Détection automatique du thème système (prefers-color-scheme)
 * - Application automatique du thème sur l'élément HTML (classe 'dark')
 * - Thème résolu (light ou dark, jamais system)
 *
 * ARCHITECTURE:
 * - Pattern: Store Zustand avec middleware de persistance
 * - Persistance: localStorage sous la clé 'theme-storage'
 * - Application: Ajout/suppression de la classe 'dark' sur document.documentElement
 *
 * THÈMES DISPONIBLES:
 * - light: Thème clair (toujours clair, indépendant du système)
 * - dark: Thème sombre (toujours sombre, indépendant du système)
 * - system: Suit le thème du système d'exploitation (détecté via prefers-color-scheme)
 *
 * THÈME RÉSOLU:
 * - Si theme === 'system': résolu en 'light' ou 'dark' selon le système
 * - Si theme === 'light' ou 'dark': résolu directement
 * - Utilisé pour les composants qui ont besoin d'une valeur concrète (pas 'system')
 *
 * UTILISATION:
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useThemeStore();
 *
 * // Changer le thème
 * setTheme('dark');
 *
 * // Utiliser le thème résolu
 * <div className={resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
 * ```
 *
 * @module store/theme
 */

// Import de Zustand pour la gestion d'état global
import { create } from 'zustand';

// Import du middleware de persistance pour sauvegarder dans localStorage
import { persist } from 'zustand/middleware';

/**
 * TYPE: Theme
 *
 * Types de thème disponibles dans l'application.
 *
 * VALEURS:
 * - 'light': Thème clair (toujours clair, indépendant du système)
 * - 'dark': Thème sombre (toujours sombre, indépendant du système)
 * - 'system': Suit le thème du système d'exploitation (détecté via prefers-color-scheme)
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * INTERFACE: ThemeState
 *
 * Définit la structure de l'état du thème dans le store Zustand.
 * Cette interface décrit toutes les propriétés et méthodes disponibles
 * dans le store de thème.
 *
 * PROPRIÉTÉS:
 * - theme: Thème sélectionné par l'utilisateur (light/dark/system)
 * - resolvedTheme: Thème résolu (light ou dark, jamais system)
 *
 * ACTIONS:
 * - setTheme: Change le thème et l'applique sur l'élément HTML
 * - setResolvedTheme: Met à jour le thème résolu (utilisé par Providers)
 */
interface ThemeState {
  /**
   * Thème sélectionné par l'utilisateur
   * - 'light': Thème clair
   * - 'dark': Thème sombre
   * - 'system': Suit le thème système
   *
   * PERSISTÉ: Oui (sauvegardé dans localStorage)
   */
  theme: Theme;

  /**
   * Fonction pour changer le thème
   *
   * FONCTIONNEMENT:
   * 1. Met à jour theme dans le store
   * 2. Si theme === 'system', détecte le thème système
   * 3. Applique le thème sur document.documentElement (classe 'dark')
   * 4. Met à jour resolvedTheme
   *
   * @param theme - Nouveau thème (light, dark, ou system)
   */
  setTheme: (theme: Theme) => void;

  /**
   * Thème résolu (light ou dark, jamais system)
   *
   * UTILISATION:
   * Utilisé par les composants qui ont besoin d'une valeur concrète
   * (pas 'system'). Si theme === 'system', resolvedTheme est calculé
   * selon le thème système.
   *
   * EXEMPLES:
   * - theme: 'light' -> resolvedTheme: 'light'
   * - theme: 'dark' -> resolvedTheme: 'dark'
   * - theme: 'system' + système en dark -> resolvedTheme: 'dark'
   * - theme: 'system' + système en light -> resolvedTheme: 'light'
   *
   * PERSISTÉ: Oui (sauvegardé dans localStorage)
   */
  resolvedTheme: 'light' | 'dark';

  /**
   * Fonction pour définir le thème résolu
   *
   * UTILISATION:
   * Utilisé par le composant Providers pour mettre à jour le thème résolu
   * quand le thème système change (écoute de prefers-color-scheme).
   *
   * @param resolvedTheme - Thème résolu (light ou dark)
   */
  setResolvedTheme: (theme: 'light' | 'dark') => void;
}

/**
 * STORE: useThemeStore
 *
 * Store Zustand pour la gestion du thème.
 * Utilise le middleware persist pour sauvegarder le thème dans localStorage.
 *
 * ARCHITECTURE:
 * - create<ThemeState>()(): Crée le store avec TypeScript
 * - persist(): Middleware qui sauvegarde automatiquement dans localStorage
 * - (set, get) => ({ ... }): Fonction qui retourne l'état initial et les actions
 *
 * PERSISTANCE:
 * - Clé localStorage: 'theme-storage'
 * - Données persistées: theme, resolvedTheme
 *
 * UTILISATION:
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useThemeStore();
 * ```
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    /**
     * Fonction qui définit l'état initial et les actions du store
     *
     * PARAMÈTRES:
     * - set: Fonction pour mettre à jour l'état (set({ theme: ... }))
     * - get: Fonction pour lire l'état actuel (get().theme)
     *
     * RETOUR:
     * Objet contenant l'état initial et toutes les actions
     */
    (set, get) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================

      /**
       * Thème par défaut: système
       *
       * POURQUOI 'system':
       * Par défaut, l'application suit le thème du système d'exploitation.
       * Cela offre une meilleure expérience utilisateur (cohérence avec l'OS).
       */
      theme: 'system',

      /**
       * Thème résolu par défaut: clair
       *
       * POURQUOI 'light':
       * Si le thème système n'est pas encore détecté (SSR, chargement initial),
       * on utilise 'light' comme fallback pour éviter le flash de contenu sombre.
       */
      resolvedTheme: 'light',

      // ============================================
      // ACTION: setTheme
      // ============================================
      /**
       * ACTION: setTheme
       *
       * Change le thème et l'applique immédiatement sur l'élément HTML.
       *
       * FLUX:
       * 1. Met à jour theme dans le store
       * 2. Si theme === 'system', détecte le thème système
       * 3. Calcule resolvedTheme (light ou dark)
       * 4. Applique le thème sur document.documentElement (classe 'dark')
       *
       * APPLICATION DU THÈME:
       * - Ajoute la classe 'dark' sur <html> si le thème est dark
       * - Supprime la classe 'dark' sur <html> si le thème est light
       * - Tailwind CSS utilise cette classe pour appliquer les styles dark:
       *
       * EXEMPLE TAILWIND:
       * ```css
       * .bg-white { background-color: white; }
       * .dark .bg-white { background-color: black; }
       * ```
       *
       * DÉTECTION DU THÈME SYSTÈME:
       * - Utilise window.matchMedia('(prefers-color-scheme: dark)')
       * - Retourne 'dark' si le système est en mode sombre
       * - Retourne 'light' sinon
       *
       * @param theme - Nouveau thème (light, dark, ou system)
       */
      setTheme: (theme: Theme) => {
        /**
         * Mettre à jour theme dans le store
         * set({ theme }) déclenche un re-render des composants utilisant ce store
         */
        set({ theme });

        /**
         * Appliquer le thème immédiatement sur l'élément HTML
         * document.documentElement est l'élément <html>
         * On ajoute/supprime la classe 'dark' pour activer les styles Tailwind dark:
         */
        const root = document.documentElement;

        if (theme === 'system') {
          /**
           * CAS: Thème système
           *
           * Détecter le thème système via prefers-color-scheme
           * window.matchMedia('(prefers-color-scheme: dark)') retourne un MediaQueryList
           * .matches est true si le système est en mode sombre
           */
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark' // Système en mode sombre
            : 'light'; // Système en mode clair

          /**
           * Mettre à jour resolvedTheme avec le thème système détecté
           */
          set({ resolvedTheme: systemTheme });

          /**
           * Appliquer le thème sur l'élément HTML
           * root.classList.toggle('dark', systemTheme === 'dark'):
           * - Si systemTheme === 'dark': ajoute la classe 'dark'
           * - Si systemTheme === 'light': supprime la classe 'dark'
           */
          root.classList.toggle('dark', systemTheme === 'dark');
        } else {
          /**
           * CAS: Thème explicite (light ou dark)
           *
           * Appliquer directement le thème sélectionné
           * Pas besoin de détecter le système, on utilise directement theme
           */
          set({ resolvedTheme: theme });

          /**
           * Appliquer le thème sur l'élément HTML
           * root.classList.toggle('dark', theme === 'dark'):
           * - Si theme === 'dark': ajoute la classe 'dark'
           * - Si theme === 'light': supprime la classe 'dark'
           */
          root.classList.toggle('dark', theme === 'dark');
        }
      },

      // ============================================
      // ACTION: setResolvedTheme
      // ============================================
      /**
       * ACTION: setResolvedTheme
       *
       * Définit le thème résolu (light ou dark) sans changer le thème sélectionné.
       *
       * UTILISATION:
       * Utilisé par le composant Providers pour mettre à jour le thème résolu
       * quand le thème système change (écoute de prefers-color-scheme).
       *
       * SCÉNARIO:
       * - L'utilisateur a sélectionné 'system'
       * - Le système change de light à dark (ou vice versa)
       * - Providers écoute le changement et appelle setResolvedTheme()
       * - Le thème est mis à jour sans que l'utilisateur ait besoin de changer
       *
       * DIFFÉRENCE AVEC setTheme:
       * - setTheme: change theme ET applique le thème sur HTML
       * - setResolvedTheme: change seulement resolvedTheme (pas d'application sur HTML)
       *
       * POURQUOI:
       * Quand le thème système change, on veut juste mettre à jour resolvedTheme.
       * L'application du thème sur HTML est gérée par Providers (qui écoute
       * prefers-color-scheme et applique le thème).
       *
       * @param resolvedTheme - Thème résolu (light ou dark)
       */
      setResolvedTheme: (resolvedTheme: 'light' | 'dark') => {
        /**
         * Mettre à jour seulement resolvedTheme
         * On ne change pas theme (qui reste 'system')
         * On n'applique pas le thème sur HTML (géré par Providers)
         */
        set({ resolvedTheme });
      },
    }),
    {
      // ============================================
      // CONFIGURATION DE LA PERSISTANCE
      // ============================================
      /**
       * Nom de la clé dans localStorage
       *
       * Les données seront sauvegardées sous la clé 'theme-storage'
       * Format: { theme: 'system', resolvedTheme: 'dark' }
       */
      name: 'theme-storage',

      /**
       * NOTE: Pas de partialize explicite
       *
       * Par défaut, Zustand persiste toutes les propriétés de l'état.
       * Ici, on veut persister theme et resolvedTheme, donc pas besoin
       * de partialize (comportement par défaut).
       *
       * RESTAURATION:
       * Au chargement de la page, Zustand restaure automatiquement theme
       * et resolvedTheme depuis localStorage. Cela permet de maintenir
       * le thème même après un rafraîchissement de page.
       */
    }
  )
);

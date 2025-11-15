/**
 * FICHIER: providers.tsx
 *
 * DESCRIPTION:
 * Ce composant enveloppe l'application avec tous les providers nécessaires.
 * Il configure React Query, vérifie l'authentification au démarrage,
 * et gère le thème (dark/light/system).
 *
 * PROVIDERS:
 * - QueryClientProvider: Pour React Query (gestion du cache et des requêtes)
 *
 * FONCTIONNALITÉS:
 * - Vérification automatique de l'authentification au montage
 * - Gestion du thème (dark/light/system) avec écoute des changements système
 * - Application du thème sur l'élément HTML
 */

'use client';

// Import de React
import { useEffect, useState } from 'react';

// Import de React Query
import { QueryClientProvider } from '@tanstack/react-query';

// Import des utilitaires
import { getQueryClient } from '@/lib/query-client';

// Import des stores
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

/**
 * COMPOSANT: Providers
 *
 * Composant qui enveloppe l'application avec tous les providers nécessaires.
 *
 * @param children - Les composants enfants à envelopper
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // ============================================
  // GESTION DU QUERY CLIENT
  // ============================================
  /**
   * Créer le QueryClient une seule fois avec useState.
   * Cela évite de recréer le client à chaque rendu.
   */
  const [queryClient] = useState(() => getQueryClient());

  // ============================================
  // RÉCUPÉRATION DES STORES
  // ============================================
  const { checkAuth } = useAuthStore();
  const { theme, setResolvedTheme } = useThemeStore();

  // ============================================
  // EFFET: Vérification de l'authentification
  // ============================================
  /**
   * Vérifie l'authentification au montage du composant (une seule fois).
   * Cela permet de restaurer la session utilisateur si un token valide existe.
   */
  useEffect(() => {
    // Vérifier l'authentification au montage
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter uniquement au mount (pas de dépendances)

  // ============================================
  // EFFET: Gestion du thème
  // ============================================
  /**
   * Gère les changements de thème (dark/light/system).
   *
   * - Si le thème est 'system', détecte le thème système
   * - Applique le thème sur l'élément HTML (classe 'dark')
   * - Écoute les changements du thème système
   */
  useEffect(() => {
    /**
     * Fonction pour gérer les changements de thème.
     */
    const handleThemeChange = () => {
      if (theme === 'system') {
        // Détecter le thème système (dark ou light)
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';

        // Mettre à jour le thème résolu dans le store
        setResolvedTheme(systemTheme);

        // Appliquer le thème sur l'élément HTML
        document.documentElement.classList.toggle(
          'dark',
          systemTheme === 'dark'
        );
      }
    };

    // Appliquer le thème initial
    handleThemeChange();

    // Écouter les changements du thème système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    // Nettoyer l'écouteur au démontage
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [theme, setResolvedTheme]); // Réexécuter si le thème change

  // ============================================
  // RENDU
  // ============================================
  /**
   * Envelopper les enfants avec QueryClientProvider.
   * Cela permet à tous les composants enfants d'utiliser React Query.
   */
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

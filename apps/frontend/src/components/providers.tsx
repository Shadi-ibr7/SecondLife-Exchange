/**
 * FICHIER: providers.tsx
 *
 * DESCRIPTION:
 * Ce composant enveloppe l'application avec tous les providers nécessaires.
 * Il configure React Query, vérifie l'authentification au démarrage,
 * gère le thème (dark/light/system), et fournit la gestion des cookies RGPD.
 *
 * PROVIDERS:
 * - QueryClientProvider: Pour React Query (gestion du cache et des requêtes)
 * - CookieProvider: Pour la gestion du consentement cookies (RGPD)
 * - AnalyticsProvider: Pour les scripts analytics conditionnels
 * - MarketingProvider: Pour les pixels marketing conditionnels
 *
 * FONCTIONNALITÉS:
 * - Vérification automatique de l'authentification au montage
 * - Gestion du thème (dark/light/system) avec écoute des changements système
 * - Application du thème sur l'élément HTML
 * - Bannière de consentement cookies conforme RGPD
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

// Import des providers cookies et analytics
import { CookieProvider } from '@/components/cookies';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';
import { MarketingProvider } from '@/providers/MarketingProvider';

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
      } else {
        // Thème explicite (light ou dark)
        // Appliquer le thème sur l'élément HTML
        document.documentElement.classList.toggle('dark', theme === 'dark');
        // Mettre à jour le thème résolu
        setResolvedTheme(theme);
      }
    };

    // Appliquer le thème initial
    handleThemeChange();

    // Écouter les changements du thème système (seulement si theme === 'system')
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleThemeChange);

      // Nettoyer l'écouteur au démontage
      return () => {
        mediaQuery.removeEventListener('change', handleThemeChange);
      };
    }
  }, [theme, setResolvedTheme]); // Réexécuter si le thème change

  // ============================================
  // RENDU
  // ============================================
  /**
   * Envelopper les enfants avec les providers nécessaires.
   * Ordre: QueryClient > Cookie > Analytics > Marketing > children
   */
  return (
    <QueryClientProvider client={queryClient}>
      <CookieProvider>
        <AnalyticsProvider>
          <MarketingProvider>
            {children}
          </MarketingProvider>
        </AnalyticsProvider>
      </CookieProvider>
    </QueryClientProvider>
  );
}

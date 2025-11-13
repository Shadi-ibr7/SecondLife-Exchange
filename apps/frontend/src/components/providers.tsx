'use client';

import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  // Créer le QueryClient une seule fois avec useState
  const [queryClient] = useState(() => getQueryClient());
  const { checkAuth } = useAuthStore();
  const { theme, setResolvedTheme } = useThemeStore();

  useEffect(() => {
    // Check authentication on mount (une seule fois)
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter uniquement au mount

  useEffect(() => {
    // Handle theme changes
    const handleThemeChange = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
        setResolvedTheme(systemTheme);
        document.documentElement.classList.toggle(
          'dark',
          systemTheme === 'dark'
        );
      }
    };

    // Set initial theme
    handleThemeChange();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [theme, setResolvedTheme]); // Retirer checkAuth des dépendances pour éviter les appels répétés

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();
  const { theme, setResolvedTheme } = useThemeStore();

  useEffect(() => {
    // Check authentication on mount
    checkAuth();

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
  }, [checkAuth, theme, setResolvedTheme]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

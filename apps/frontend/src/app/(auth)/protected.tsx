'use client';

/**
 * FICHIER: app/(auth)/protected.tsx
 *
 * DESCRIPTION:
 * Wrapper côté client qui protège une page/section en vérifiant que
 * l'utilisateur est authentifié. Si ce n'est pas le cas, redirige vers /login
 * en conservant la page de destination dans ?next=...
 *
 * FONCTIONNEMENT:
 * - Suspense permet d'utiliser useSearchParams (composant client asynchrone).
 * - useEffect observe l'état d'authentification pour déclencher la redirection.
 * - Affiche un loader tant que le store d'auth n'a pas fini de charger.
 * - Retourne null tant que l'utilisateur n'est pas autorisé (évite un flash).
 *
 * UTILISATION:
 * ```tsx
 * <ProtectedRoute>
 *   <PagePrivee />
 * </ProtectedRoute>
 * ```
 * Tout enfant de ProtectedRoute ne sera rendu qu'après validation de l'accès.
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRouteContent({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const next = searchParams.get('next') || '/profile';
      router.push(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </Suspense>
  );
}

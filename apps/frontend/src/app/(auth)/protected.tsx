'use client';

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

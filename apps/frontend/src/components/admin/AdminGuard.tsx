/**
 * Composant de protection des routes admin.
 * Redirige vers la page de login si aucun token admin n'est présent.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { getAdminToken } from '@/lib/admin.token';

type AdminGuardProps = {
  children: React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔒 AdminGuard token présent ?', !!token, 'path:', pathname);
    }
    if (!token) {
      router.replace(`/${ADMIN_BASE_PATH}/login`);
      setAuthorized(false);
      return;
    }
    setAuthorized(true);
  }, [router, pathname]);

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}

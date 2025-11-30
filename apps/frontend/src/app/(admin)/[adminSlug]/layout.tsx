/**
 * FICHIER: layout.tsx
 *
 * DESCRIPTION:
 * Layout pour toutes les pages admin (sauf login).
 * Les Providers sont maintenant disponibles depuis le layout parent (admin)/layout.tsx.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier l'authentification admin (sauf sur la page de login)
    if (!isLoginPage) {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        router.push(`/${ADMIN_BASE_PATH}/login`);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(true);
    }
  }, [isLoginPage, router]);

  // Si c'est la page de login, ne pas utiliser le layout admin
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Attendre que l'authentification soit vérifiée avant de rendre
  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

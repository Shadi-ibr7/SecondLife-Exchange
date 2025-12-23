/**
 * FICHIER: page.tsx
 *
 * DESCRIPTION:
 * Page par défaut de l'espace admin - redirige vers login ou dashboard.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { getAdminToken } from '@/lib/admin.token';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'admin est authentifié
    const token = getAdminToken();

    if (token) {
      // Si authentifié, rediriger vers le dashboard
      router.replace(`/${ADMIN_BASE_PATH}/dashboard`);
    } else {
      // Sinon, rediriger vers la page de login
      router.replace(`/${ADMIN_BASE_PATH}/login`);
    }
  }, [router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}


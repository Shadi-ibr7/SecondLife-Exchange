/**
 * Composant de protection des routes admin.
 * Vérifie l'authentification via cookies httpOnly et redirige vers login si non authentifié.
 *
 * SÉCURITÉ:
 * - Utilise adminApi.getMe() qui fait une requête au backend
 * - Le backend vérifie le cookie httpOnly (pas accessible en JS)
 * - Si le cookie est absent ou invalide, 401 → redirection login
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { adminApi } from '@/lib/admin.api';
import { Loader2 } from 'lucide-react';

type AdminGuardProps = {
  children: React.ReactNode;
};

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  roles: string;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Appel au backend qui vérifie le cookie httpOnly
        const adminUser = await adminApi.getMe();

        if (process.env.NODE_ENV !== 'production') {
          console.log('🔒 AdminGuard auth check:', adminUser ? '✅ Authentifié' : '❌ Non authentifié', 'path:', pathname);
        }

        if (!adminUser) {
          // Non authentifié → redirection vers login
          router.replace(`/${ADMIN_BASE_PATH}/login`);
          setAuthorized(false);
          return;
        }

        // Authentifié
        setUser(adminUser);
        setAuthorized(true);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('🔒 AdminGuard erreur:', error);
        }
        // Erreur (probablement 401) → redirection vers login
        router.replace(`/${ADMIN_BASE_PATH}/login`);
        setAuthorized(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // État de chargement
  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // Non autorisé → rien (la redirection est en cours)
  if (!authorized) return null;

  // Autorisé → afficher le contenu
  return <>{children}</>;
}

// Export de l'utilisateur admin pour utilisation dans les composants enfants
export { type AdminUser };

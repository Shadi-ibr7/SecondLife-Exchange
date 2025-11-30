/**
 * FICHIER: AdminRouteGuard.tsx
 *
 * DESCRIPTION:
 * Hook pour vérifier si on est sur une route admin.
 */

'use client';

import { usePathname } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';

export function useIsAdminRoute() {
  const pathname = usePathname();
  return pathname?.startsWith(`/${ADMIN_BASE_PATH}`) ?? false;
}


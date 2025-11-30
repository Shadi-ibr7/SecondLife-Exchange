/**
 * FICHIER: admin-layout-wrapper.tsx
 *
 * DESCRIPTION:
 * Wrapper pour masquer Navbar et MobileDockNav sur les routes admin.
 */

'use client';

import { usePathname } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Navbar } from '@/components/layout/navbar';
import { MobileDockNav } from '@/components/mobile/MobileDockNav';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith(`/${ADMIN_BASE_PATH}`);

  // Si on est sur une route admin, ne pas afficher Navbar et MobileDockNav
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Sinon, afficher la navigation normale
  return (
    <>
      <Navbar />
      {children}
      <MobileDockNav />
    </>
  );
}


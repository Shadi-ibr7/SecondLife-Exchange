/**
 * FICHIER: layout.tsx
 *
 * DESCRIPTION:
 * Layout pour toutes les pages admin (sauf login).
 * Les Providers sont maintenant disponibles depuis le layout parent (admin)/layout.tsx.
 */

'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}

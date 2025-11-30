/**
 * FICHIER: AdminLayout.tsx
 *
 * DESCRIPTION:
 * Layout principal pour l'admin dashboard avec sidebar et header.
 */

'use client';

import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-muted">
      <AdminSidebar />
      <div className="lg:ml-60">
        <AdminHeader />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}


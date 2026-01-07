/**
 * FICHIER: AdminLayout.tsx
 *
 * DESCRIPTION:
 * Layout principal pour l'admin dashboard avec sidebar et header.
 * Design aligné avec Figma.
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
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#0b0b0d]">
      <AdminSidebar />
      <div className="lg:ml-60">
        <AdminHeader />
        <main className="p-6 lg:p-8 pt-24 lg:pt-24">{children}</main>
      </div>
    </div>
  );
}


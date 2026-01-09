/**
 * FICHIER: AdminLayout.tsx
 *
 * DESCRIPTION:
 * Layout principal pour l'admin dashboard avec sidebar et header.
 * Gère l'état du menu mobile (burger) et le partage entre Header et Sidebar.
 * Design aligné avec Figma.
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { MobileSidebar } from './MobileSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Bloquer le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Fermer le menu avec ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#0b0b0d]">
      <AdminSidebar />
      <MobileSidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="lg:ml-60">
        <AdminHeader onMenuClick={() => setIsMenuOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 pt-[calc(63px+env(safe-area-inset-top))] lg:pt-24">{children}</main>
      </div>
    </div>
  );
}


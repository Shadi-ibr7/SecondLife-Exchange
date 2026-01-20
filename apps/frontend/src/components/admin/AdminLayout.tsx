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
import { useOnlineStatus } from '@/lib/network';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const online = useOnlineStatus();

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
        {/* Bannière globale hors-ligne */}
        {!online && (
          <div className="mx-4 mt-2 rounded-md border border-yellow-400/60 bg-yellow-100/80 px-3 py-2 text-xs sm:text-sm text-yellow-900 dark:border-yellow-500/60 dark:bg-yellow-900/30 dark:text-yellow-100">
            Vous êtes actuellement <span className="font-semibold">hors ligne</span>. Les actions de
            création seront enregistrées localement et synchronisées automatiquement dès que la
            connexion reviendra.
          </div>
        )}
        <main className="p-4 sm:p-6 lg:p-8 pt-[calc(63px+env(safe-area-inset-top)+1rem)] lg:pt-[calc(63px+2rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}


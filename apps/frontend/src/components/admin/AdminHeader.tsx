/**
 * FICHIER: AdminHeader.tsx
 *
 * DESCRIPTION:
 * Header de l'admin dashboard avec profil et logout.
 */

'use client';

import { LogOut, Menu } from 'lucide-react';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { useRouter } from 'next/navigation';

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    router.push(`/${ADMIN_BASE_PATH}/login`);
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-16 bg-white dark:bg-card border-b border-border z-10">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white text-sm">SL</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 lg:gap-4 ml-auto">
          {/* Admin Badge */}
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
            ADMIN
          </span>

          {/* Admin Profile */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@secondlife.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">AD</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}


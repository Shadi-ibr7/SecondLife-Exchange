/**
 * FICHIER: AdminHeader.tsx
 *
 * DESCRIPTION:
 * Header de l'admin dashboard avec profil, toggle de thème et logout.
 * Design aligné avec Figma (node 28-1189).
 */

'use client';

import { LogOut, Menu, ChevronRight } from 'lucide-react';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/admin.token';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    clearAdminToken();
    router.push(`/${ADMIN_BASE_PATH}/login`);
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-16 bg-white dark:bg-[#141416] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] z-10">
      <div className="h-full px-4 lg:px-4 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] rounded-md transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-[#1e1e20] dark:text-[#ececed]" />
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1b3828] dark:bg-[#2d5a45] flex items-center justify-center">
            <span className="text-white text-sm font-medium">SL</span>
          </div>
        </div>

        {/* Right side - Selon design Figma */}
        <div className="flex items-center gap-2 lg:gap-3 ml-auto">
          {/* Theme Toggle */}
          <div className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors">
            <ThemeToggle />
          </div>

          {/* Admin Badge */}
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#1b3828] dark:text-[#2d5a45] font-normal">
            ADMIN
          </span>

          {/* Admin Profile */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">Admin User</p>
              <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] leading-4">admin@secondlife.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f7f7f8] dark:bg-[#1a1a1c] flex items-center justify-center">
              <span className="text-[#6f6f73] dark:text-[#9a9a9d] text-sm font-normal">AD</span>
            </div>
          </div>

          {/* Logout Button - Avec flèche selon Figma */}
          <button
            onClick={handleLogout}
            className="h-8 px-3 rounded-md flex items-center gap-2 hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4 text-[#1e1e20] dark:text-[#ececed]" />
            <span className="hidden lg:inline text-sm font-normal text-[#1e1e20] dark:text-[#ececed]">Déconnexion</span>
            <ChevronRight className="w-4 h-4 text-[#1e1e20] dark:text-[#ececed] hidden lg:block" />
          </button>
        </div>
      </div>
    </header>
  );
}


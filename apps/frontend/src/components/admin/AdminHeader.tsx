/**
 * FICHIER: AdminHeader.tsx
 *
 * DESCRIPTION:
 * Header de l'admin dashboard - Pixel-perfect selon Figma (node 28-1189).
 * Hauteur exacte: 63px, padding: 16px, gaps: 8px.
 * Mobile-first avec support safe-area iOS.
 */

'use client';

import { LogOut, Menu, Bell } from 'lucide-react';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin.api';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useNotifications } from '@/hooks/useNotifications';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    // Appeler adminApi.logout() qui:
    // 1. Appelle POST /auth/admin/logout pour révoquer le refresh token et supprimer les cookies
    // 2. Redirige automatiquement vers le login
    await adminApi.logout();
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-[calc(63px+env(safe-area-inset-top))] bg-white dark:bg-[#141416] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] z-50">
      {/* Safe-area spacer pour iOS */}
      <div className="h-[env(safe-area-inset-top)]" />

      {/* Header content - Hauteur exacte 63px selon Figma */}
      <div className="h-[63px] px-4 flex items-center justify-between">
        {/* LEFT SIDE: Burger Menu + Logo (mobile uniquement) */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Burger Menu Button - 36x36px selon Figma */}
          <button
            onClick={onMenuClick}
            className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            aria-label="Ouvrir le menu"
            aria-expanded="false"
          >
            <Menu className="w-5 h-5 text-[#1e1e20] dark:text-[#ececed]" />
          </button>

          {/* Logo SL - 32x32px selon Figma */}
          <div className="w-8 h-8 rounded-md bg-[#1b3828] dark:bg-[#2d5a45] flex items-center justify-center">
            <span className="text-white text-sm font-normal leading-5">SL</span>
          </div>
        </div>

        {/* RIGHT SIDE: Theme Toggle + Badge + User Info + Avatar + Logout */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme Toggle - 40x32px selon Figma */}
          <div className="w-10 h-8 rounded-lg flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors">
            <ThemeToggle />
          </div>

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="relative w-10 h-8 rounded-lg flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[#1e1e20] dark:text-[#ececed]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Admin Badge - Visible à partir de sm */}
          <span className="hidden sm:inline-flex h-5 px-2.5 py-0.5 rounded-full text-xs bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#1b3828] dark:text-[#2d5a45] font-normal leading-4 whitespace-nowrap">
            ADMIN
          </span>

          {/* User Info + Avatar Container */}
          <div className="flex items-center gap-2 min-w-0">
            {/* User Info - Caché sur mobile, visible à partir de md */}
            <div className="hidden md:block text-right min-w-0 flex-1">
              <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5 truncate">
                Admin User
              </p>
              <p className="text-xs font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-4 truncate">
                admin@secondlife.com
              </p>
            </div>

            {/* Avatar - 40x40px selon Figma, toujours visible */}
            <div className="w-10 h-10 rounded-full bg-[#f7f7f8] dark:bg-[#1a1a1c] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">AD</span>
            </div>
          </div>

          {/* Logout Button - 32px height selon Figma */}
          <button
            onClick={handleLogout}
            className="h-8 px-3 rounded-md flex items-center gap-2 hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors whitespace-nowrap"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4 text-[#1e1e20] dark:text-[#ececed]" />
            <span className="hidden lg:inline text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}


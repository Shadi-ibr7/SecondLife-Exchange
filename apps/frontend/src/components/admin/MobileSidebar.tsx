/**
 * FICHIER: MobileSidebar.tsx
 *
 * DESCRIPTION:
 * Sidebar mobile pour l'admin dashboard utilisant Sheet (shadcn/ui).
 * S'ouvre depuis le bouton burger dans le header.
 * Design aligné avec Figma.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  Flag,
  Sparkles,
  Leaf,
  FileText,
  Settings,
  MessageCircle,
  BarChart3,
  Shield,
  X,
} from 'lucide-react';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: `/${ADMIN_BASE_PATH}/dashboard` },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: `/${ADMIN_BASE_PATH}/analytics` },
  { id: 'users', label: 'Utilisateurs', icon: Users, href: `/${ADMIN_BASE_PATH}/users` },
  { id: 'objects', label: 'Objets', icon: Package, href: `/${ADMIN_BASE_PATH}/items` },
  { id: 'exchanges', label: 'Échanges', icon: ArrowLeftRight, href: `/${ADMIN_BASE_PATH}/exchanges` },
  { id: 'community', label: 'Communauté', icon: MessageCircle, href: `/${ADMIN_BASE_PATH}/community` },
  { id: 'reports', label: 'Signalements', icon: Flag, href: `/${ADMIN_BASE_PATH}/reports` },
  { id: 'ai-themes', label: 'Thèmes IA', icon: Sparkles, href: `/${ADMIN_BASE_PATH}/themes` },
  { id: 'eco-content', label: 'Contenu Écologique', icon: Leaf, href: `/${ADMIN_BASE_PATH}/eco` },
  { id: 'logs', label: 'Logs', icon: FileText, href: `/${ADMIN_BASE_PATH}/logs` },
  { id: 'audit-logs', label: 'Audit Trail', icon: Shield, href: `/${ADMIN_BASE_PATH}/audit-logs` },
  { id: 'settings', label: 'Paramètres', icon: Settings, href: `/${ADMIN_BASE_PATH}/settings` },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] p-0 bg-white dark:bg-[#141416] border-r border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] z-50"
      >
        <div className="flex flex-col h-full">
          {/* Header avec logo et bouton fermer */}
          <SheetHeader className="px-6 py-6 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1b3828] dark:bg-[#2d5a45] flex items-center justify-center">
                  <span className="text-white text-sm font-medium">SL</span>
                </div>
                <div>
                  <SheetTitle className="text-sm font-medium tracking-tight text-[#1e1e20] dark:text-[#ececed] text-left">
                    SecondLife Exchange
                  </SheetTitle>
                  <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] mt-0.5">Admin</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] rounded-md transition-colors -mr-2"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5 text-[#1e1e20] dark:text-[#ececed]" />
              </button>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                        isActive
                          ? 'bg-[#1b3828] dark:bg-[#2d5a45] text-white'
                          : 'text-[#6f6f73] dark:text-[#9a9a9d] hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
            <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d]">v1.0.0</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


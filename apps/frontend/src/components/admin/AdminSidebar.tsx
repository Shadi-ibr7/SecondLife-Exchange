/**
 * FICHIER: AdminSidebar.tsx
 *
 * DESCRIPTION:
 * Sidebar de navigation pour l'admin dashboard.
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
} from 'lucide-react';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { cn } from '@/lib/utils';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: `/${ADMIN_BASE_PATH}/dashboard` },
  { id: 'users', label: 'Utilisateurs', icon: Users, href: `/${ADMIN_BASE_PATH}/users` },
  { id: 'objects', label: 'Objets', icon: Package, href: `/${ADMIN_BASE_PATH}/items` },
  { id: 'exchanges', label: 'Échanges', icon: ArrowLeftRight, href: `/${ADMIN_BASE_PATH}/exchanges` },
  { id: 'reports', label: 'Signalements', icon: Flag, href: `/${ADMIN_BASE_PATH}/reports` },
  { id: 'ai-themes', label: 'Thèmes IA', icon: Sparkles, href: `/${ADMIN_BASE_PATH}/themes` },
  { id: 'eco-content', label: 'Contenu Écologique', icon: Leaf, href: `/${ADMIN_BASE_PATH}/eco` },
  { id: 'logs', label: 'Logs', icon: FileText, href: `/${ADMIN_BASE_PATH}/logs` },
  { id: 'settings', label: 'Paramètres', icon: Settings, href: `/${ADMIN_BASE_PATH}/settings` },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-60 lg:flex lg:flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-sm tracking-tight text-foreground">SecondLife Exchange</h1>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}


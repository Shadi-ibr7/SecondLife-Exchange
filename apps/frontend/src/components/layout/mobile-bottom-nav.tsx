'use client';

/**
 * FICHIER: mobile-bottom-nav.tsx
 *
 * DESCRIPTION:
 * Barre de navigation inférieure dédiée aux mobiles (pattern "tab bar"
 * d'applications natives). Elle expose les entrées principales demandées
 * par le produit et reste collée au bas de l'écran.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, PlusCircle, RefreshCw, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mobileLinks = [
  { label: 'Accueil', href: '/', icon: Home },
  { label: 'Explorer', href: '/explore', icon: Compass },
  { label: 'Proposer', href: '/item/new', icon: PlusCircle },
  { label: 'Échanger', href: '/exchanges', icon: RefreshCw },
  { label: 'Profil', href: '/profile', icon: User, isProfile: true },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2">
        {mobileLinks.map(({ href, icon: Icon, label, isProfile }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition-colors',
              isActive(href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isProfile && isAuthenticated ? (
              <Avatar
                className={cn(
                  'h-7 w-7 border border-transparent transition-all',
                  isActive(href) && 'border-primary ring-2 ring-primary/40'
                )}
              >
                <AvatarImage src={user?.avatarUrl || ''} />
                <AvatarFallback>
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive(href) ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            )}
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

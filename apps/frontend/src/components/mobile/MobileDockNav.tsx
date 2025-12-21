/**
 * FICHIER: MobileDockNav.tsx
 *
 * DESCRIPTION:
 * Barre de navigation mobile type dock macOS.
 * Affichée uniquement sur mobile (< md), fixée en bas avec safe-area.
 */

'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { MOBILE_DOCK_LINKS } from './mobile-dock.config';
import { MobileDockItem } from './MobileDockItem';
import { useRouter } from 'next/navigation';

export function MobileDockNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    protectedRoute?: boolean
  ) => {
    if (protectedRoute && !isAuthenticated) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex md:hidden justify-center px-1.5 sm:px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
      aria-label="Navigation principale mobile"
    >
      <div className="mobile-dock-glass flex w-full max-w-md items-center justify-between rounded-2xl sm:rounded-3xl border border-[color:var(--mobile-dock-border)] bg-[color:var(--mobile-dock-bg)] px-1 sm:px-2 py-1 sm:py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.55)]">
        {MOBILE_DOCK_LINKS.map((link) => {
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

          // Pour le profil, utiliser l'avatar si connecté
          const showAvatar = !!(link.avatar && isAuthenticated && user);

          return (
            <MobileDockItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={isActive}
              cta={link.cta}
              avatar={showAvatar}
              imageUrl={user?.avatarUrl}
              displayName={user?.displayName}
              onClick={(e) => handleItemClick(e, link.href, link.protected)}
              disabled={link.protected && !isAuthenticated}
            />
          );
        })}
      </div>
    </nav>
  );
}


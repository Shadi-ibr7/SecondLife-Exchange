/**
 * FICHIER: components/common/NavDesktop.tsx
 *
 * DESCRIPTION:
 * Barre de navigation principale (version desktop). Affiche le logo,
 * les liens de navigation, la recherche, les actions (PWA, notifications, thème)
 * et un menu utilisateur avec avatar + logout.
 *
 * FLUX:
 * - S’appuie sur `NAV_LINKS`, `CTA_LINK`, `USER_LINKS` (fichier nav-links.ts)
 * - Utilise `useAuthStore` pour savoir si l’utilisateur est connecté
 * - Liens protégés affichent un cadenas si l’utilisateur n’est pas auth
 * - Avatar ouvre un DropdownMenu avec liens “Profile, Dashboard…” + Déconnexion
 *
 * UX:
 * - Animations Framer Motion (logo, CTA, underline actif)
 * - Layout responsive: caché sur mobile (`md:flex`)
 * - Intègre SearchInput, InstallPWA, NotificationBell, ThemeToggle
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NAV_LINKS, CTA_LINK, USER_LINKS } from '@/lib/nav-links';
import { SearchInput } from './SearchInput';
import { InstallPWA } from './InstallPWA';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function NavDesktop() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="hidden h-20 w-full items-center justify-between md:flex">
      {/* Logo et nom */}
      <Link href="/" className="group flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
          <Image
            src="/logo.svg"
            alt="SecondLife Exchange"
            width={40}
            height={40}
            className="text-primary"
          />
        </motion.div>
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-xl font-bold text-transparent">
          SecondLife Exchange
        </span>
      </Link>

      {/* Navigation centrale */}
      <div className="flex items-center gap-10">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const isProtected = link.protected && !isAuthenticated;

          return (
            <Link
              key={link.href}
              href={isProtected ? '/login' : link.href}
              className={cn(
                'relative text-base font-medium transition-all duration-200 hover:scale-105 hover:text-primary',
                isActive ? 'text-primary' : 'text-foreground/80',
                isProtected && 'opacity-60'
              )}
            >
              {link.label}
              {isActive && (
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary to-primary/60"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              )}
              {isProtected && <span className="ml-2 text-xs">🔒</span>}
            </Link>
          );
        })}
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-3">
        {/* Recherche */}
        <SearchInput />

        {/* Install PWA */}
        <InstallPWA />

        {/* Notifications */}
        <NotificationBell />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* CTA ou Avatar utilisateur */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full hover:bg-primary/10"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.displayName}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {USER_LINKS.slice(0, -1).map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Button asChild size="lg" className="px-6 py-2 font-semibold">
              <Link href={CTA_LINK.href}>{CTA_LINK.label}</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

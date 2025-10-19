'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X, User, LogOut } from 'lucide-react';
import { NAV_LINKS, CTA_LINK } from '@/lib/nav-links';
import { InstallPWA } from './InstallPWA';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function NavMobile() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const closeSheet = () => setOpen(false);

  return (
    <div className="flex h-20 w-full items-center justify-between md:hidden">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt="SecondLife Exchange"
          width={32}
          height={32}
          className="text-primary"
        />
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-lg font-bold text-transparent">
          SecondLife
        </span>
      </Link>

      {/* Menu Burger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-primary/10"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="SecondLife Exchange"
                width={24}
                height={24}
                className="text-primary"
              />
              SecondLife Exchange
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col space-y-6">
            {/* Navigation principale */}
            <nav className="space-y-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const isProtected = link.protected && !isAuthenticated;

                return (
                  <Link
                    key={link.href}
                    href={isProtected ? '/login' : link.href}
                    onClick={closeSheet}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      isProtected && 'opacity-60'
                    )}
                  >
                    {link.label}
                    {isProtected && <span className="text-xs">🔒</span>}
                  </Link>
                );
              })}
            </nav>

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              {/* CTA */}
              <Button asChild className="w-full" onClick={closeSheet}>
                <Link href={CTA_LINK.href}>{CTA_LINK.label}</Link>
              </Button>

              {/* Toggles */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thème</span>
                <ThemeToggle />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Notifications
                </span>
                <NotificationBell />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Installer l'app
                </span>
                <InstallPWA />
              </div>
            </div>

            {/* Utilisateur connecté */}
            {isAuthenticated && user && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.displayName}
                      />
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={closeSheet}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <User className="h-4 w-4" />
                      Mon profil
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * FICHIER: navbar.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche la barre de navigation principale de l'application.
 * Il gère la navigation, l'authentification, les notifications, et le menu mobile.
 *
 * FONCTIONNALITÉS:
 * - Navigation principale avec liens vers les différentes pages
 * - Menu mobile (Sheet) pour les petits écrans
 * - Menu desktop avec navigation horizontale
 * - Bouton de recherche avec overlay
 * - Badge de notifications non lues
 * - Menu utilisateur avec dropdown (profil, déconnexion)
 * - Toggle de thème (dark/light)
 * - Gestion de l'état d'authentification
 * - Détection de la page active pour le style
 *
 * RESPONSIVE:
 * - Desktop: Navigation horizontale complète
 * - Mobile: Menu hamburger avec Sheet
 */

'use client';

// Import des icônes
import { Bell, Menu, Recycle, Search, X } from 'lucide-react';

// Import des composants UI
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchOverlay } from '@/components/common/SearchOverlay';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Import de React
import { useState } from 'react';

// Import de Next.js
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Import des stores
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';

// Import de react-hot-toast
import { toast } from 'react-hot-toast';

/**
 * COMPOSANT: Navbar
 *
 * Barre de navigation principale de l'application.
 */
export function Navbar() {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour contrôler l'ouverture/fermeture du menu mobile.
   */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * État pour contrôler l'ouverture/fermeture de l'overlay de recherche.
   */
  const [searchOpen, setSearchOpen] = useState(false);

  // ============================================
  // RÉCUPÉRATION DES HOOKS ET STORES
  // ============================================

  /**
   * Hook Next.js pour récupérer le chemin actuel.
   */
  const pathname = usePathname();

  /**
   * Récupération de l'utilisateur et des fonctions d'authentification.
   */
  const { user, isAuthenticated, logout } = useAuthStore();

  /**
   * Récupération du compteur de notifications non lues.
   */
  const { unreadCount } = useNotificationsStore();

  // ============================================
  // CONFIGURATION DES LIENS DE NAVIGATION
  // ============================================

  /**
   * Liste des liens de navigation principaux.
   */
  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Explorer', href: '/explore' },
    { name: 'Découvrir', href: '/discover' },
    { name: 'Thèmes', href: '/themes' },
    { name: 'Échanges', href: '/exchanges' },
    { name: 'Matching', href: '/matching' },
    { name: 'Communauté', href: '/community' },
  ];

  // ============================================
  // FONCTION: isActive
  // ============================================

  /**
   * Détermine si un lien de navigation est actif (page courante).
   *
   * @param href - URL du lien
   * @returns true si le lien est actif, false sinon
   */
  const isActive = (href: string) => {
    // Pour la page d'accueil, vérifier l'égalité exacte
    if (href === '/') {
      return pathname === '/';
    }
    // Pour les autres pages, vérifier si le pathname commence par href
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="w-full px-4 lg:px-8">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">SecondLife Exchange</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-primary ${
                  isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center">
            <ThemeToggle />

            {/* Search Button - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden sm:flex"
                asChild
              >
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-primary p-0 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}

            {!isAuthenticated ? (
              <>
                <Button
                  asChild
                  className="hidden bg-primary hover:bg-primary/90 md:flex"
                >
                  <Link href="/register">inscription</Link>
                </Button>
                <Button asChild variant="outline" className="hidden md:flex">
                  <Link href="/login">Connexion</Link>
                </Button>
              </>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  className="hidden md:inline-flex"
                >
                  <Link href="/item/new">Publier</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer transition-all hover:ring-2 hover:ring-primary">
                      <AvatarImage src={user?.avatarUrl || ''} />
                      <AvatarFallback>
                        {user?.displayName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Mon profil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        const ok =
                          typeof window !== 'undefined'
                            ? window.confirm(
                                'Voulez-vous vraiment vous déconnecter ?'
                              )
                            : true;
                        if (!ok) return;
                        await logout();
                        toast.success('Vous êtes déconnecté.');
                      }}
                    >
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-card">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Accédez aux différentes sections de SecondLife Exchange
                </SheetDescription>
                <div className="mt-8 flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-left transition-colors hover:text-primary ${
                        isActive(link.href)
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}

                  <div className="space-y-3 border-t border-border pt-6">
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/item/new">Proposer un objet</Link>
                    </Button>
                    {!isAuthenticated ? (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/login">Connexion</Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/register">inscription</Link>
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={async () => {
                          await logout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Se déconnecter
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSearchOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full sm:w-auto"
                      aria-label="Rechercher"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                    {isAuthenticated && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="relative"
                        asChild
                      >
                        <Link href="/notifications">
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-primary p-0 text-[10px]">
                              {unreadCount}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

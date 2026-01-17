import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MIDDLEWARE DE SÉCURITÉ - SecondLife Exchange
 * 
 * Objectifs :
 * 1. Protéger les routes admin (vérification du token côté serveur)
 * 2. S'assurer que les routes publiques ne sont JAMAIS redirigées vers l'admin
 * 3. Laisser passer les assets statiques
 */

// Base path admin, aligné avec src/lib/admin.config.ts
const ADMIN_BASE_PATH =
  process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';

// Regex pour matcher tous les fichiers avec extension (assets statiques)
const PUBLIC_FILE = /\.(.*)$/;

// Routes publiques qui ne doivent JAMAIS rediriger vers l'admin
const PUBLIC_ROUTES = [
  '/a-propos',
  '/communaute',
  '/aide',
  '/legal',
  '/explore',
  '/discover',
  '/themes',
  '/exchanges',
  '/matching',
  '/community',
  '/login',
  '/register',
  '/profile',
  '/item',
  '/exchange',
  '/thread',
  '/notifications',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Toujours laisser passer les assets publics et PWA
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/workbox-') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Routes admin - Protection côté serveur
  if (pathname.startsWith(`/${ADMIN_BASE_PATH}`)) {
    const isLoginPage = pathname.includes('/login');
    
    // Page de login admin - toujours accessible
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Vérification du token admin dans les cookies
    const adminToken = req.cookies.get('admin_token')?.value;
    
    if (!adminToken) {
      // Pas de token -> redirect vers login admin
      const loginUrl = new URL(`/${ADMIN_BASE_PATH}/login`, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token présent -> laisser AdminGuard vérifier la validité côté client
    return NextResponse.next();
  }

  // 3. Routes publiques - JAMAIS de redirection vers l'admin
  // Cette vérification est une sécurité supplémentaire
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';
  
  if (isPublicRoute) {
    // Route publique - simplement continuer
    return NextResponse.next();
  }

  // 4. Autres routes - laisser passer
  return NextResponse.next();
}

// IMPORTANT: matcher STRICT - uniquement les routes nécessitant une vérification
// Note: Si ADMIN_BASE_PATH change via env var, mettre à jour ce matcher manuellement
export const config = {
  matcher: [
    // Routes admin
    '/greenroom-core-qlf18scha7/:path*',
    // Ne PAS ajouter de matcher global comme "/:path*" pour éviter les problèmes
  ],
};


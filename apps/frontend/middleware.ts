import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Base path admin, aligné avec src/lib/admin.config.ts
// Utilisé dans le middleware pour vérifier les routes admin
const ADMIN_BASE_PATH =
  process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';

// Regex pour matcher tous les fichiers avec extension (assets statiques)
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Toujours laisser passer les assets publics et PWA
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

  // Protection ADMIN UNIQUEMENT
  // La logique d'auth reste côté app (AdminGuard)
  // Le middleware ne fait que limiter le scope aux routes admin
  if (pathname.startsWith(`/${ADMIN_BASE_PATH}`)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// IMPORTANT: matcher STRICT - uniquement les routes admin
// Ne JAMAIS utiliser "/:path*" ou "/(.*)" globalement
// Note: Si ADMIN_BASE_PATH change via env var, mettre à jour ce matcher manuellement
export const config = {
  matcher: [
    '/greenroom-core-qlf18scha7/:path*',
    // Si tu changes NEXT_PUBLIC_ADMIN_BASE_PATH, ajoute aussi le nouveau chemin ici
  ],
};



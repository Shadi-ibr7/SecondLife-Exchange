import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Base path admin, aligné avec src/lib/admin.config.ts
const ADMIN_BASE_PATH =
  process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';

// Liste des chemins PWA / statiques qui doivent toujours rester publics
const PUBLIC_PWA_PATHS = [
  '/manifest.webmanifest',
  '/sw.js',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer tous les assets PWA / statiques
  if (
    PUBLIC_PWA_PATHS.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/workbox-')
  ) {
    return NextResponse.next();
  }

  // Ne protéger que les routes admin
  const isAdminRoute = pathname.startsWith(`/${ADMIN_BASE_PATH}`);
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Ici, on se contente de laisser la protection côté client (AdminGuard)
  // Le middleware ne fait que s'assurer que seules les routes admin
  // passent par ce code, sans toucher aux assets publics/PWA.
  return NextResponse.next();
}

// IMPORTANT: on ne matche que les routes admin,
// jamais "/:path*" ou "/(.*)" globalement.
export const config = {
  matcher: [`/${ADMIN_BASE_PATH}/:path*`],
};



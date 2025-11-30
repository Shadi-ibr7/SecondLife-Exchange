/**
 * FICHIER: layout.tsx
 *
 * DESCRIPTION:
 * Ce fichier définit le layout racine de l'application Next.js.
 * Il configure les métadonnées, la police, et la structure HTML de base.
 *
 * FONCTIONNALITÉS:
 * - Configuration des métadonnées SEO (title, description, Open Graph)
 * - Configuration PWA (manifest, Apple Web App)
 * - Police Inter de Google Fonts
 * - Structure HTML avec Navbar et Toaster
 * - Enveloppement avec Providers (React Query, thème, auth)
 *
 * MÉTADONNÉES:
 * - Title et description pour le SEO
 * - Open Graph pour le partage sur les réseaux sociaux
 * - Manifest pour l'installation PWA
 * - Configuration Apple Web App pour iOS
 */

// Import des types Next.js
import type { Metadata, Viewport } from 'next';

// Import de la police Google Fonts
import { Inter } from 'next/font/google';

// Import des styles globaux
import './globals.css';
import '@/styles/mobile-dock.css';

// Import des composants
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/navbar';
import { MobileDockNav } from '@/components/mobile/MobileDockNav';
import { AdminLayoutWrapper } from './admin-layout-wrapper';

/**
 * Configuration de la police Inter
 *
 * subsets: ['latin'] - Charger uniquement les caractères latins
 */
const inter = Inter({ subsets: ['latin'] });

/**
 * MÉTADONNÉES SEO
 *
 * Ces métadonnées sont utilisées pour:
 * - Le titre de l'onglet du navigateur
 * - La description dans les résultats de recherche
 * - Le partage sur les réseaux sociaux (Open Graph)
 * - L'installation PWA (manifest)
 */
export const metadata: Metadata = {
  title: 'SecondLife Exchange',
  description: "Plateforme d'échange d'objets avec suggestions IA",

  // Manifest PWA pour l'installation sur mobile
  manifest: '/manifest.webmanifest',

  // Configuration Apple Web App (iOS)
  appleWebApp: {
    capable: true, // L'app peut être installée
    statusBarStyle: 'default', // Style de la barre de statut
    title: 'SecondLife Exchange',
  },

  // Désactiver la détection automatique des numéros de téléphone
  formatDetection: {
    telephone: false,
  },

  // Métadonnées Open Graph pour le partage sur les réseaux sociaux
  openGraph: {
    type: 'website',
    siteName: 'SecondLife Exchange',
    title: 'SecondLife Exchange',
    description: "Plateforme d'échange d'objets avec suggestions IA",
  },
};

/**
 * CONFIGURATION DU VIEWPORT
 *
 * Contrôle l'affichage sur mobile et tablette.
 */
export const viewport: Viewport = {
  themeColor: '#000000', // Couleur de la barre d'adresse (mobile)
  width: 'device-width', // Largeur adaptée à l'appareil
  initialScale: 1, // Zoom initial à 100%
  maximumScale: 1, // Zoom maximum à 100% (empêche le zoom)
  userScalable: false, // Désactiver le zoom utilisateur
};

/**
 * COMPOSANT: RootLayout
 *
 * Layout racine de l'application Next.js.
 * Définit la structure HTML de base et enveloppe tous les composants.
 *
 * @param children - Les composants enfants (pages)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      {/* ============================================
          HEAD: Métadonnées et liens
          ============================================ */}
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.svg" />

        {/* Icône pour iOS (Apple Touch Icon) */}
        <link rel="apple-touch-icon" href="/logo.svg" />

        {/* Couleur du thème pour la barre d'adresse mobile */}
        <meta name="theme-color" content="#802ADB" />

        {/* Configuration PWA pour iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SecondLife Exchange" />
      </head>

      {/* ============================================
          BODY: Contenu principal
          ============================================ */}
      <body className={inter.className}>
        {/* Providers: Enveloppe avec React Query, thème, auth */}
        <Providers>
          <AdminLayoutWrapper>
          {/* Contenu principal (pages) */}
            <main className="pb-20 md:pb-0">{children}</main>
          </AdminLayoutWrapper>

          {/* Toaster: Affichage des notifications toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000, // Durée d'affichage: 4 secondes
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

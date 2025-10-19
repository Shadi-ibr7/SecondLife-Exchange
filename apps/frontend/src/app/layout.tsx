import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/common/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecondLife Exchange',
  description: "Plateforme d'échange d'objets avec suggestions IA",
  manifest: '/manifest.webmanifest',
  themeColor: '#000000',
  viewport:
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SecondLife Exchange',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'SecondLife Exchange',
    title: 'SecondLife Exchange',
    description: "Plateforme d'échange d'objets avec suggestions IA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#802ADB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SecondLife Exchange" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
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

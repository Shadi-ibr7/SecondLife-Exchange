/**
 * FICHIER: (public)/layout.tsx
 *
 * DESCRIPTION:
 * Layout partagé pour toutes les pages publiques (À propos, Aide, Légal, Communauté).
 * Inclut le header (Navbar) et le footer communs.
 */

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0b0b0d] dark:bg-[#0b0b0d] dark:text-[#ededee]">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

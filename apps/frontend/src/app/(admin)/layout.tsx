/**
 * FICHIER: layout.tsx
 *
 * DESCRIPTION:
 * Layout parent pour toutes les routes admin.
 * Fournit les Providers nécessaires pour React Query.
 */

'use client';

import { Providers } from '@/components/providers';

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ce layout garantit que les Providers sont disponibles
  // pour tous les layouts et pages enfants du groupe (admin)
  return <Providers>{children}</Providers>;
}


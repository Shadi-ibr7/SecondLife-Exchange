/**
 * FICHIER: AdminProviders.tsx
 *
 * DESCRIPTION:
 * Wrapper pour garantir que les Providers sont disponibles pour les pages admin.
 */

'use client';

import { ReactNode } from 'react';
import { Providers } from '@/components/providers';

export function AdminProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}

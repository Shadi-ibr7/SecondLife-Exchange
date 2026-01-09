/**
 * FICHIER: AdminPageContainer.tsx
 *
 * DESCRIPTION:
 * Container responsive pour toutes les pages admin.
 * Gère le padding, max-width, et overflow de manière cohérente.
 * Mobile-first design.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'full' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
}

export function AdminPageContainer({
  children,
  className,
  maxWidth = 'full',
}: AdminPageContainerProps) {
  const maxWidthClasses = {
    full: 'max-w-full',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-4 sm:px-6 lg:px-8',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}


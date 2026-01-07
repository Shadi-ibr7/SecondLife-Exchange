/**
 * FICHIER: AdminCard.tsx
 *
 * DESCRIPTION:
 * Composant Card aligné avec le design Figma pour l'admin dashboard.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className }: AdminCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-medium text-[#1e1e20] dark:text-[#ececed]">{title}</h1>
      {description && (
        <p className="text-base text-[#6f6f73] dark:text-[#9a9a9d]">{description}</p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export function AdminStatsCard({ title, value, className }: AdminStatsCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6',
        className
      )}
    >
      <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal mb-1">{title}</p>
      <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed]">{value}</p>
    </div>
  );
}


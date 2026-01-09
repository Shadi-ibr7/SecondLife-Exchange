/**
 * FICHIER: ResponsiveTable.tsx
 *
 * DESCRIPTION:
 * Table responsive : affiche une table sur desktop et des cards sur mobile.
 * Mobile-first : Option A (Cards avec labels).
 */

'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  headers: Array<{ key: string; label: string; className?: string; align?: 'left' | 'right' | 'center' }>;
  rows: Array<{
    key: string;
    cells: Array<{ key: string; content: ReactNode; className?: string }>;
    mobileCard?: ReactNode; // Optionnel : contenu custom pour la card mobile
  }>;
  className?: string;
  mobileCardClassName?: string;
}

export function ResponsiveTable({
  headers,
  rows,
  className,
  mobileCardClassName,
}: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table - Hidden on mobile */}
      <div className={cn('hidden md:block overflow-x-auto', className)}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[44.5px]">
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'px-4 py-3',
                    header.align === 'right' ? 'text-right' : header.align === 'center' ? 'text-center' : 'text-left',
                    header.className
                  )}
                >
                  <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                    {header.label}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isLast = rowIndex === rows.length - 1;
              return (
                <tr
                  key={row.key}
                  className={cn(
                    !isLast &&
                      'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]',
                    'h-[65px]'
                  )}
                >
                  {row.cells.map((cell) => (
                    <td key={cell.key} className={cn('px-4', cell.className)}>
                      {cell.content}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - Visible only on mobile */}
      <div className={cn('md:hidden space-y-3', className)}>
        {rows.map((row) => (
          <Card key={row.key} className={cn('overflow-hidden', mobileCardClassName)}>
            <CardContent className="p-4 space-y-3">
              {row.mobileCard ? (
                row.mobileCard
              ) : (
                <>
                  {headers.map((header, index) => {
                    const cell = row.cells[index];
                    if (!cell) return null;
                    return (
                      <div
                        key={header.key}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1',
                          header.align === 'right' && 'sm:text-right'
                        )}
                      >
                        <span className="text-xs font-medium text-[#6f6f73] dark:text-[#9a9a9d] sm:min-w-[100px]">
                          {header.label}:
                        </span>
                        <div className="text-sm text-[#1e1e20] dark:text-[#ececed] break-words">
                          {cell.content}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}


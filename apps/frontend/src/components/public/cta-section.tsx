/**
 * FICHIER: cta-section.tsx
 *
 * DESCRIPTION:
 * Composant CTA (Call To Action) réutilisable pour les pages publiques.
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface CTASectionProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  variant?: 'default' | 'eco';
}

export function CTASection({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = 'default',
}: CTASectionProps) {
  const bgClass = variant === 'eco'
    ? 'bg-gradient-to-r from-[rgba(0,201,80,0.1)] to-[rgba(16,185,129,0.1)]'
    : 'bg-gradient-to-r from-[rgba(16,185,129,0.1)] to-transparent';

  return (
    <section className={`mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8`}>
      <div className={`rounded-2xl border border-[#e4e4e7] p-8 text-center dark:border-[#27272a] ${bgClass} sm:p-12`}>
        {Icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.2)]">
            <Icon className="h-6 w-6 text-[#10b981]" />
          </div>
        )}
        <h2 className="mb-3 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee] sm:text-2xl">
          {title}
        </h2>
        <p className="mx-auto mb-6 max-w-md text-[#71717a] dark:text-[#a1a1aa]">
          {description}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-10 rounded-lg bg-[#10b981] px-6 font-semibold text-white hover:bg-[#10b981]/90"
          >
            <Link href={primaryAction.href} className="flex items-center gap-2">
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {secondaryAction && (
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-lg border-[#e4e4e7] px-6 font-semibold dark:border-[#27272a]"
            >
              <Link href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

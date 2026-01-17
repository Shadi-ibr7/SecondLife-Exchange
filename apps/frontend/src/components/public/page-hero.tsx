/**
 * FICHIER: page-hero.tsx
 *
 * DESCRIPTION:
 * Composant Hero réutilisable pour les pages publiques.
 * Affiche un titre, un sous-titre, un badge optionnel et une icône.
 */

import { LucideIcon } from 'lucide-react';

interface PageHeroProps {
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'primary' | 'eco' | 'warning' | 'info';
  title: string;
  subtitle: string;
}

const badgeColors = {
  primary: 'border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)] text-[#10b981]',
  eco: 'border-[rgba(0,201,80,0.2)] bg-[rgba(0,201,80,0.1)] text-[#05df72]',
  warning: 'border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.1)] text-[#eab308]',
  info: 'border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.1)] text-[#3b82f6]',
};

export function PageHero({ icon: Icon, badge, badgeColor = 'primary', title, subtitle }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[#e4e4e7] bg-gradient-to-b from-[rgba(16,185,129,0.08)] via-[#fafafa] via-60% to-[#fafafa] dark:border-[#27272a] dark:via-[#0b0b0d] dark:to-[#0b0b0d]">
      <div className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[672px] text-center">
          {/* Badge */}
          {badge && (
            <div className={`mb-4 inline-flex h-[38px] items-center gap-2 rounded-full border px-4 ${badgeColors[badgeColor]}`}>
              <Icon className="h-4 w-4" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px]">
                {badge}
              </span>
            </div>
          )}

          {/* Titre */}
          <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight text-[#0b0b0d] dark:text-[#ededee] sm:text-4xl md:text-5xl">
            {title}
          </h1>

          {/* Sous-titre */}
          <p className="text-base leading-relaxed text-[#71717a] dark:text-[#a1a1aa] sm:text-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

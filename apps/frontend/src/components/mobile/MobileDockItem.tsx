/**
 * FICHIER: MobileDockItem.tsx
 *
 * DESCRIPTION:
 * Composant item individuel du dock mobile.
 * Gère l'affichage de l'icône, du label, des états actif/CTA/avatar.
 */

'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { AvatarMini } from '@/components/common/AvatarMini';
import { palette } from '@/lib/palette';
import { cn } from '@/lib/utils';

interface MobileDockItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  cta?: boolean;
  avatar?: boolean;
  imageUrl?: string | null;
  displayName?: string | null;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
}

export function MobileDockItem({
  href,
  label,
  icon: Icon,
  active = false,
  cta = false,
  avatar = false,
  imageUrl,
  displayName,
  onClick,
  disabled = false,
}: MobileDockItemProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 py-1 min-w-0',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Container icône/avatar */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl sm:rounded-2xl transition-all shrink-0',
          cta
            ? 'h-9 w-9 sm:h-11 sm:w-11 rounded-full shadow-lg'
            : 'h-9 w-9 sm:h-10 sm:w-10 bg-transparent',
          active && !cta && 'bg-primary/10 dark:bg-white/5 border border-primary/20 dark:border-white/10',
          !cta && !active && 'text-foreground/70 dark:text-white'
        )}
        style={
          cta
            ? { backgroundColor: palette.primaryBright, color: palette.white }
            : active
              ? { color: palette.primaryBright }
              : undefined
        }
      >
        {avatar && (imageUrl || displayName) ? (
          <AvatarMini
            imageUrl={imageUrl}
            displayName={displayName}
            size={cta ? 36 : 32}
          />
        ) : (
          <Icon 
            className={cn(
              'shrink-0',
              cta 
                ? 'h-5 w-5 sm:h-6 sm:w-6 text-white' 
                : 'h-5 w-5 sm:h-5 sm:w-5',
              !cta && 'text-current'
            )} 
            strokeWidth={2}
          />
        )}
      </div>

      {/* Indicator actif */}
      {active && !cta && (
        <div
          className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
          style={{ backgroundColor: palette.primaryBright }}
        />
      )}

      {/* Label */}
      <span
        className={cn(
          'text-[10px] sm:text-[11px] truncate max-w-[56px] sm:max-w-[64px] text-center leading-tight',
          active
            ? ''
            : 'text-foreground/70 dark:text-[rgba(250,248,243,0.85)]'
        )}
        style={active ? { color: palette.primaryBright } : undefined}
      >
        {label}
      </span>
    </div>
  );

  if (disabled) {
    return <div className="flex-1">{content}</div>;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex-1 min-w-0 flex items-center justify-center"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}


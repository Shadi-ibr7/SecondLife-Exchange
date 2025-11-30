/**
 * FICHIER: components/ui/badge.tsx
 *
 * DESCRIPTION:
 * Petite pastille (tag) utilisée pour visualiser des statuts, catégories,
 * filtres actifs, etc. Basée sur class-variance-authority pour gérer
 * différentes variantes (default, secondary, destructive, outline).
 *
 * UTILISATION:
 * ```tsx
 * <Badge>Disponible</Badge>
 * <Badge variant="outline" className="uppercase">Tag</Badge>
 * ```
 *
 * TECHNIQUE:
 * - `badgeVariants` centralise les classes Tailwind par variante.
 * - Composant simple (div) afin d'autoriser spans, textes variés.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * COMPOSANT: Badge
 *
 * Rend simplement un `<div>` stylé. On lui passe `variant="secondary"`
 * ou `variant="outline"` selon le contexte, et on peut ajouter d’autres
 * classes via `className` (ex. `uppercase`, `tracking-wide`, etc.).
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

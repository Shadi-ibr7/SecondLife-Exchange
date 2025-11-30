/**
 * FICHIER: components/ui/button.tsx
 *
 * DESCRIPTION:
 * Bouton réutilisable basé sur les primitives Radix + class-variance-authority.
 * Permet de définir différentes variantes (default, outline, destructive, etc.)
 * et tailles cohérentes dans toute l'application.
 *
 * UTILISATION:
 * ```tsx
 * <Button variant="outline" size="lg">Action</Button>
 * <Button asChild><Link href="/...">Voir plus</Link></Button>
 * ```
 *
 * TECHNIQUE:
 * - `cva` centralise les classes Tailwind pour chaque variante/size.
 * - `asChild` autorise le rendu comme `<a>` via Radix Slot.
 * - `cn` fusionne proprement les classes dynamiques.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * COMPOSANT: Button
 *
 * `asChild` permet de rendre un `<Link>` ou tout autre élément via Radix `Slot`
 * sans perdre les styles. Astuce utile pour avoir des liens stylés comme des boutons.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // `Comp` sera soit un `<button>`, soit l’élément passé via `asChild`
    const Comp = asChild ? Slot : 'button';

    /**
     * `buttonVariants` calcule la classe finale selon `variant` + `size`.
     * On merge avec `className` pour permettre des overrides ciblés.
     */
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

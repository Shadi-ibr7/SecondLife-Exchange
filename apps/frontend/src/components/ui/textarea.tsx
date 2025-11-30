/**
 * FICHIER: components/ui/textarea.tsx
 *
 * DESCRIPTION:
 * Zone de texte multi-ligne avec styles cohérents (taille minimale, bordures,
 * focus rings, états disabled). Utilisée pour les descriptions, messages, etc.
 *
 * UTILISATION:
 * ```tsx
 * <Textarea rows={4} placeholder="Décrivez votre objet..." />
 * ```
 *
 * TECHNIQUE:
 * - `forwardRef` pour compatibilité avec RHF/refs parents.
 * - `cn` permet d'injecter des classes additionnelles sans perdre la base.
 */

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * COMPOSANT: Textarea
 *
 * ForwardRef permet d’accéder au `<textarea>` natif. Même logique que Input
 * (classes CSS centralisées + possibilité de surcharger via className).
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };

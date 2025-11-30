/**
 * FICHIER: components/ui/input.tsx
 *
 * DESCRIPTION:
 * Champ de saisie de base avec styles Tailwind uniformisés (borders, focus ring,
 * états disabled, intégration avec inputs type="file", etc.). Sert de fondation
 * pour tous les formulaires de l'application.
 *
 * UTILISATION:
 * ```tsx
 * <Input placeholder="Titre" />
 * <Input type="email" className="mt-2" />
 * ```
 *
 * TECHNIQUE:
 * - `forwardRef` pour compatibilité avec React Hook Form et autres libs.
 * - `cn` fusionne les classes personnalisées.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * COMPOSANT: Input
 *
 * `React.forwardRef` permet de passer la ref au `<input>` natif (utile
 * pour `react-hook-form` ou pour focus programmatique).
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    /**
     * L’input reçoit :
     * - `type` (text, email, password…)
     * - classes par défaut (hauteur, padding, focus ring)
     * - possibilité d’ajouter des classes via `className`
     */
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

/**
 * FICHIER: components/common/Container.tsx
 *
 * DESCRIPTION:
 * Wrapper simple pour centrer le contenu et appliquer des marges/paddings
 * cohérents (max-width, px). Utilisé pour toutes les sections principales
 * (pages, bannières, etc.) afin d’éviter de répéter les classes Tailwind.
 *
 * UTILISATION:
 * ```tsx
 * <Container className="py-10">
 *   <Section />
 * </Container>
 * ```
 */

import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 md:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

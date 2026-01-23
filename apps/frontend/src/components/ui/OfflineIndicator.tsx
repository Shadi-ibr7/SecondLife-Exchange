/**
 * FICHIER: components/ui/OfflineIndicator.tsx
 *
 * DESCRIPTION:
 * Composant qui affiche un indicateur quand l'utilisateur est hors-ligne.
 * Apparaît en haut de l'écran pour informer l'utilisateur que:
 * - Il est hors-ligne
 * - Les données affichées peuvent être en cache
 * - Certaines fonctionnalités peuvent être limitées
 *
 * UTILISATION:
 * Ajouter au layout principal:
 * ```tsx
 * <OfflineIndicator />
 * <main>{children}</main>
 * ```
 */

'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  /** Classe CSS additionnelle */
  className?: string;
}

/**
 * COMPOSANT: OfflineIndicator
 *
 * Affiche une barre d'avertissement quand l'utilisateur est hors-ligne.
 */
export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline } = useOnlineStatus();
  const [show, setShow] = useState(false);

  // Afficher seulement après le montage côté client
  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Petit délai avant de cacher pour éviter les flashs
      const timeout = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isOnline]);

  // Ne rien afficher si online ou pas encore monté
  if (!show || isOnline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 py-2 px-4 text-center text-sm font-medium shadow-md',
        'animate-in slide-in-from-top duration-300',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>
          Mode hors-ligne - Les données affichées peuvent être en cache
        </span>
      </div>
    </div>
  );
}

export default OfflineIndicator;

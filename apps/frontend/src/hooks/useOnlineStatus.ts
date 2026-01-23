/**
 * FICHIER: hooks/useOnlineStatus.ts
 *
 * DESCRIPTION:
 * Hook personnalisé pour détecter le statut de connexion réseau.
 * Utilisé pour adapter l'interface quand l'utilisateur est hors-ligne.
 *
 * FONCTIONNALITÉS:
 * - Détecte les changements de statut online/offline
 * - Retourne l'état actuel et un timestamp de dernière vérification
 * - Compatible avec le SSR (retourne true par défaut côté serveur)
 *
 * UTILISATION:
 * ```tsx
 * const { isOnline, lastOnline } = useOnlineStatus();
 *
 * if (!isOnline) {
 *   return <div>Vous êtes hors-ligne</div>;
 * }
 * ```
 */

'use client';

import { useState, useEffect } from 'react';

interface OnlineStatus {
  /** Est-ce que l'utilisateur est en ligne ? */
  isOnline: boolean;
  /** Timestamp de la dernière fois en ligne (utile pour afficher "hors-ligne depuis...") */
  lastOnline: number | null;
}

/**
 * Hook pour détecter le statut de connexion réseau.
 *
 * @returns Objet avec isOnline et lastOnline
 */
export function useOnlineStatus(): OnlineStatus {
  // État initial: online par défaut (SSR-safe)
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: true,
    lastOnline: null,
  });

  useEffect(() => {
    // Vérifier si navigator est disponible (client-side only)
    if (typeof navigator === 'undefined') return;

    // Initialiser avec le vrai statut
    setStatus({
      isOnline: navigator.onLine,
      lastOnline: navigator.onLine ? Date.now() : null,
    });

    // Handlers pour les événements online/offline
    const handleOnline = () => {
      setStatus({
        isOnline: true,
        lastOnline: Date.now(),
      });
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        isOnline: false,
        lastOnline: prev.lastOnline,
      }));
    };

    // Écouter les événements
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

export default useOnlineStatus;

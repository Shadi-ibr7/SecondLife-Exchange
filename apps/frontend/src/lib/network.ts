/**
 * FICHIER: lib/network.ts
 *
 * Utilitaires réseau (online/offline) côté client.
 * - isOnline(): helper simple basé sur navigator.onLine
 * - waitUntilOnline(): Promise résolue au prochain passage online
 * - useOnlineStatus(): hook React pour suivre l'état réseau en temps réel
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Retourne true si le navigateur est en ligne.
 * Côté serveur, on considère par défaut que l'on est "online".
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

/**
 * Attend que le navigateur soit de nouveau en ligne.
 * Utile pour des flows de retry manuels.
 */
export function waitUntilOnline(): Promise<void> {
  if (isOnline()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    window.addEventListener('online', handleOnline);
  });
}

/**
 * Hook React pour suivre le statut online/offline.
 * Écoute les évènements `online` et `offline` du navigateur.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}


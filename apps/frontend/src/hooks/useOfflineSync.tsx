/**
 * FICHIER: hooks/useOfflineSync.tsx
 *
 * Hook global pour:
 * - écouter les évènements `online` du navigateur
 * - lancer automatiquement la synchronisation de la file offline
 * - afficher des toasts de feedback utilisateur
 */

'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useOnlineStatus } from '@/lib/network';
import { syncPendingQueue } from '@/lib/offline/sync';
import { useQueryClient } from '@tanstack/react-query';
import { getJobsByStatus } from '@/lib/offline/queue';

export function useOfflineSync() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!online) return;

    let cancelled = false;

    const runSync = async () => {
      if (cancelled) return;

      const jobs = await getJobsByStatus(['PENDING', 'FAILED', 'SYNCING']);
      if (cancelled) return;
      if (!jobs || jobs.length === 0) return;

      toast.loading('Synchronisation des éléments hors ligne...', { id: 'offline-sync' });

      await syncPendingQueue({
        onJobSuccess: () => {
          // Invalider les listes concernées (ici au minimum eco admin)
          queryClient.invalidateQueries({ queryKey: ['admin-eco'] }).catch(() => {});
        },
        onComplete: () => {
          toast.dismiss('offline-sync');
          toast.success('Synchronisation terminée', {
            id: 'offline-sync-done',
          });
        },
      });
    };

    // Lancer la synchro au passage online
    runSync();

    return () => {
      cancelled = true;
      toast.dismiss('offline-sync');
    };
  }, [online, queryClient]);
}


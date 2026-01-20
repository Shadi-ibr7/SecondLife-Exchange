/**
 * FICHIER: (admin)/[adminSlug]/sync/page.tsx
 *
 * Page de suivi de synchronisation offline-first:
 * - Liste les jobs en attente / en échec
 * - Permet de relancer la synchro (si online) ou de repasser un job FAILED en PENDING
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnlineStatus } from '@/lib/network';
import { getJobsByStatus, updateJob, type OfflineJob } from '@/lib/offline/queue';
import { syncPendingQueue } from '@/lib/offline/sync';

function JobStatusBadge({ status }: { status: OfflineJob['status'] }) {
  if (status === 'FAILED') {
    return (
      <Badge className="bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100">
        Échec
      </Badge>
    );
  }
  if (status === 'SYNCING') {
    return (
      <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
        Synchronisation
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100">
      En attente
    </Badge>
  );
}

export default function AdminSyncPage() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['offline-queue', 'pending-failed'],
    queryFn: () => getJobsByStatus(['PENDING', 'FAILED', 'SYNCING']),
    refetchInterval: 2000,
  });

  const runSync = async () => {
    if (!online) {
      toast.error("Vous êtes hors ligne. La synchronisation reprendra dès reconnexion.");
      return;
    }

    toast.loading('Synchronisation...', { id: 'sync-page' });
    await syncPendingQueue({
      onComplete: () => {
        toast.dismiss('sync-page');
        toast.success('Synchronisation terminée');
        queryClient.invalidateQueries({ queryKey: ['offline-queue'] }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['admin-eco'] }).catch(() => {});
      },
    });
  };

  const retryJob = async (job: OfflineJob) => {
    await updateJob(job.id, { status: 'PENDING', error: null });
    toast.success('Job remis en attente');
    queryClient.invalidateQueries({ queryKey: ['offline-queue'] }).catch(() => {});
    await runSync();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Synchronisation</h1>
          <p className="admin-page-description">
            Suivi des créations enregistrées hors ligne (en attente / en échec)
          </p>
        </div>
        <Button onClick={runSync} disabled={!online}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Lancer la synchronisation
        </Button>
      </div>

      {!online && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Hors ligne: la synchronisation se lancera automatiquement dès reconnexion.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Chargement...</div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Aucun élément à synchroniser.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs
                .slice()
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((job) => (
                  <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">
                          {job.type} • {new Date(job.createdAt).toLocaleString()}
                        </p>
                        <JobStatusBadge status={job.status} />
                      </div>
                      {job.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                          {job.error}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tentatives: {job.retryCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => retryJob(job)}
                        disabled={job.status === 'SYNCING'}
                      >
                        Réessayer
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


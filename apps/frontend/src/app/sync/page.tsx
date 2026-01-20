'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Clock, RefreshCw, Package, Leaf } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnlineStatus } from '@/lib/network';
import { getJobsByStatus, type OfflineJob } from '@/lib/offline/queue';
import { syncPendingQueue } from '@/lib/offline/sync';

function JobTypeBadge({ type }: { type: OfflineJob['type'] }) {
  if (type === 'ITEM_CREATE') {
    return (
      <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 flex items-center gap-1">
        <Package className="w-3 h-3" />
        Objet
      </Badge>
    );
  }

  if (type === 'ECO_CREATE') {
    return (
      <Badge className="bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100 flex items-center gap-1">
        <Leaf className="w-3 h-3" />
        Contenu éco
      </Badge>
    );
  }

  return <Badge>Autre</Badge>;
}

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

export default function PublicSyncPage() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['offline-queue', 'public'],
    queryFn: () => getJobsByStatus(['PENDING', 'FAILED', 'SYNCING']),
    refetchInterval: 2500,
  });

  const runSync = async () => {
    if (!online) {
      toast.error("Vous êtes hors ligne. La synchronisation reprendra dès reconnexion.");
      return;
    }

    toast.loading('Synchronisation des éléments hors ligne...', { id: 'public-sync' });
    await syncPendingQueue({
      onComplete: () => {
        toast.dismiss('public-sync');
        toast.success('Synchronisation terminée');
        queryClient.invalidateQueries({ queryKey: ['offline-queue'] }).catch(() => {});
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Synchronisation hors ligne</h1>
          <p className="text-sm text-muted-foreground">
            Objets et contenus créés hors connexion, en attente d&apos;envoi au serveur.
          </p>
        </div>
        <Button onClick={runSync} disabled={!online || jobs.length === 0}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Lancer la synchronisation
        </Button>
      </div>

      {!online && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Hors ligne: les éléments restent stockés sur votre appareil jusqu&apos;à la
            reconnexion.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Chargement...</div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Aucun élément en attente de synchronisation.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs
                .slice()
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((job) => (
                  <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">
                          {job.type === 'ITEM_CREATE'
                            ? 'Création d’objet'
                            : job.type === 'ECO_CREATE'
                              ? 'Contenu écologique'
                              : job.type}
                        </p>
                        <JobTypeBadge type={job.type} />
                        <JobStatusBadge status={job.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Créé le {new Date(job.createdAt).toLocaleString()} • Tentatives:{' '}
                        {job.retryCount}
                      </p>
                      {job.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                          {job.error}
                        </p>
                      )}
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


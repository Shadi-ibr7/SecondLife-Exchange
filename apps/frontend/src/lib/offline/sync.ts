/**
 * FICHIER: lib/offline/sync.ts
 *
 * Moteur de synchronisation offline-first.
 * - Parcourt la file d'attente IndexedDB en FIFO
 * - Applique un backoff exponentiel simple en cas d'échec réseau
 * - Gère les statuts: PENDING → SYNCING → DONE / FAILED
 *
 * NOTE:
 * - Conçu pour fonctionner côté client uniquement.
 * - Concurrence limitée à 1 via un flag module-scope.
 */

'use client';

import { adminApi } from '@/lib/admin.api';
import {
  enqueueJob,
  getNextPendingJob,
  removeJob,
  updateJob,
  type OfflineJob,
} from './queue';
import type { CreateEcoContentPayload } from '@/lib/admin.types';

type SyncCallbacks = {
  onJobSuccess?: (job: OfflineJob, serverResult: any) => void;
  onJobFailure?: (job: OfflineJob, error: unknown) => void;
  onJobStart?: (job: OfflineJob) => void;
  onComplete?: () => void;
};

let isSyncing = false;

const MAX_RETRY = 5;
const BASE_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(retryCount: number): number {
  // backoff exponentiel simple + jitter léger
  const base = BASE_DELAY_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * 200;
  return Math.min(base + jitter, 30_000);
}

async function processJob(job: OfflineJob, callbacks?: SyncCallbacks): Promise<void> {
  callbacks?.onJobStart?.(job);

  const nextRetryCount = (job.retryCount || 0) + 1;

  try {
    let result: any;

    switch (job.type) {
      case 'ECO_CREATE': {
        const payload = job.payload as CreateEcoContentPayload;
        result = await adminApi.createEcoContent(payload);
        break;
      }
      default: {
        // Type inconnu: marquer en FAILED mais ne pas supprimer
        await updateJob(job.id, {
          status: 'FAILED',
          error: `Type de job inconnu: ${job.type}`,
        });
        callbacks?.onJobFailure?.(job, new Error(`Unknown job type: ${job.type}`));
        return;
      }
    }

    // Succès: marquer DONE et supprimer le job (on garde la source de vérité serveur)
    await updateJob(job.id, {
      status: 'DONE',
      error: null,
    });
    await removeJob(job.id);

    callbacks?.onJobSuccess?.(job, result);
  } catch (error: any) {
    // Erreurs 4xx (validation / fonctionnelle): marquer FAILED définitif
    const status = error?.response?.status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      await updateJob(job.id, {
        status: 'FAILED',
        error: error?.response?.data?.message || error?.message || 'Erreur de validation',
        retryCount: nextRetryCount,
      });
      callbacks?.onJobFailure?.(job, error);
      return;
    }

    // Erreurs réseau / 5xx: backoff et repasser en PENDING (tant qu'on n'a pas dépassé MAX_RETRY)
    if (nextRetryCount >= MAX_RETRY) {
      await updateJob(job.id, {
        status: 'FAILED',
        error: error?.message || 'Échec de synchronisation après plusieurs tentatives',
        retryCount: nextRetryCount,
      });
      callbacks?.onJobFailure?.(job, error);
      return;
    }

    const delayMs = getBackoffDelay(job.retryCount || 0);
    await updateJob(job.id, {
      status: 'PENDING',
      retryCount: nextRetryCount,
      error: error?.message || 'Erreur réseau, nouvelle tentative plus tard',
    });
    await delay(delayMs);
  }
}

/**
 * Lance la synchronisation de toute la file en FIFO.
 * Concurrence limitée à 1 par le flag `isSyncing`.
 */
export async function syncPendingQueue(callbacks?: SyncCallbacks): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isSyncing) return;

  isSyncing = true;

  try {
    // Parcours FIFO: on récupère toujours le "prochain" job PENDING/FAILED
    // jusqu'à ce qu'il n'y en ait plus.
    // La fonction getNextPendingJob lit déjà via l'index createdAt.
    // On met à jour le statut en SYNCING avant traitement pour affichage UI.
    // En cas d'erreur réseau, processJob repassera en PENDING avec retryCount++.
    // En cas d'erreur 4xx, processJob marquera FAILED définitif.
    // En cas de succès, le job est supprimé.
    // Tant qu'on trouve un job PENDING/FAILED, on continue.
    // NOTE: on ne boucle pas infiniment car MAX_RETRY borne les retries.
    // Si la connexion retombe, la fonction se contentera d'échouer et pourra être relancée au prochain online.

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const job = await getNextPendingJob();
      if (!job) break;

      await updateJob(job.id, { status: 'SYNCING' });
      const fresh = { ...(job as OfflineJob), status: 'SYNCING' as const };
      await processJob(fresh, callbacks);
    }
  } finally {
    isSyncing = false;
    callbacks?.onComplete?.();
  }
}

/**
 * Helper pour créer un job ECO_CREATE depuis l'UI.
 * (Sert surtout pour centraliser le type et garder une API claire côté composants.)
 */
export async function enqueueEcoCreateJob(payload: CreateEcoContentPayload) {
  return enqueueJob<CreateEcoContentPayload>('ECO_CREATE', payload);
}


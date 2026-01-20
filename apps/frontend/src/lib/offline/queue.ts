/**
 * FICHIER: lib/offline/queue.ts
 *
 * API de haut niveau pour la file d'attente offline (IndexedDB).
 * - enqueueJob(): ajouter un job à la queue
 * - getJobsByStatus(): lister les jobs par statut
 * - getAllJobs(): lister tous les jobs
 * - updateJob(): mettre à jour un job
 * - removeJob(): supprimer un job
 * - getNextPendingJob(): récupérer le prochain job PENDING (FIFO)
 */

'use client';

import { getOfflineDb, type OfflineJob, type OfflineJobStatus, type OfflineJobType } from './db';

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type { OfflineJob, OfflineJobStatus, OfflineJobType };

export async function enqueueJob<TPayload = any>(
  type: OfflineJobType,
  payload: TPayload,
): Promise<OfflineJob<TPayload>> {
  const db = await getOfflineDb();
  const job: OfflineJob<TPayload> = {
    id: generateId(),
    type,
    payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: 'PENDING',
    error: null,
    retryCount: 0,
  };

  await db.put('queue', job);
  return job;
}

export async function getAllJobs(): Promise<OfflineJob[]> {
  const db = await getOfflineDb();
  return db.getAll('queue');
}

export async function getJobsByStatus(statuses: OfflineJobStatus[]): Promise<OfflineJob[]> {
  const all = await getAllJobs();
  return all.filter((job) => statuses.includes(job.status));
}

export async function getJobsByType(type: OfflineJobType): Promise<OfflineJob[]> {
  const all = await getAllJobs();
  return all.filter((job) => job.type === type);
}

export async function getNextPendingJob(): Promise<OfflineJob | undefined> {
  const db = await getOfflineDb();
  const tx = db.transaction('queue', 'readonly');
  const store = tx.objectStore('queue');
  const index = store.index('by-createdAt');
  const all = (await index.getAll()) as OfflineJob[];
  await tx.done;

  return all.find((job) => job.status === 'PENDING' || job.status === 'FAILED');
}

export async function updateJob(
  id: string,
  update: Partial<Omit<OfflineJob, 'id' | 'createdAt'>>,
): Promise<OfflineJob | undefined> {
  const db = await getOfflineDb();
  const existing = (await db.get('queue', id)) as OfflineJob | undefined;
  if (!existing) return undefined;

  const updated: OfflineJob = {
    ...existing,
    ...update,
    updatedAt: nowIso(),
  };

  await db.put('queue', updated);
  return updated;
}

export async function removeJob(id: string): Promise<void> {
  const db = await getOfflineDb();
  await db.delete('queue', id);
}


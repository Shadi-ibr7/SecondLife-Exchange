/**
 * FICHIER: lib/offline/db.ts
 *
 * Initialisation de la base IndexedDB pour le mode offline-first.
 *
 * REMARQUE IMPORTANTE:
 * - Ce module utilise la librairie `idb` (https://github.com/jakearchibald/idb)
 * - Assurez-vous d'installer la dépendance dans le frontend:
 *   pnpm --filter @secondlife/frontend add idb
 */

'use client';

import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';

export type OfflineJobStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'DONE';

export type OfflineJobType =
  | 'ECO_CREATE'
  | 'ITEM_CREATE'; // pourra être étendu (EXCHANGE_CREATE, etc.)

export interface OfflineJob<TPayload = any> {
  id: string;
  type: OfflineJobType;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
  status: OfflineJobStatus;
  error?: string | null;
  retryCount: number;
}

interface OfflineMeta {
  key: string;
  value: unknown;
}

export interface OfflineDB extends IDBPDatabase {
  // Typage indicatif; idb ne l'utilise pas strictement mais aide TS
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Ouverture (ou création) de la base IndexedDB pour le offline.
 * - Object store `queue` pour les jobs offline.
 * - Object store `meta` pour de la métadonnée éventuelle.
 */
export function getOfflineDb(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    // Côté serveur: pas d'IndexedDB. On renvoie une Promise rejetée explicite.
    return Promise.reject(
      new Error('Offline DB non disponible côté serveur (window undefined)'),
    );
  }

  if (!dbPromise) {
    dbPromise = openDB('slx-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queue')) {
          const store = db.createObjectStore('queue', {
            keyPath: 'id',
          });
          store.createIndex('by-status', 'status', { unique: false });
          store.createIndex('by-type', 'type', { unique: false });
          store.createIndex('by-createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }

  return dbPromise;
}

export async function putMeta(meta: OfflineMeta): Promise<void> {
  const db = await getOfflineDb();
  await db.put('meta', meta);
}

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getOfflineDb();
  const res = (await db.get('meta', key)) as OfflineMeta | undefined;
  return res?.value as T | undefined;
}


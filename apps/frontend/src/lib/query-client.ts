/**
 * FICHIER: query-client.ts
 *
 * DESCRIPTION:
 * Ce fichier configure le QueryClient de React Query pour l'application.
 * Il gère la création du client avec des options par défaut et assure
 * la compatibilité avec le SSR (Server-Side Rendering) de Next.js.
 *
 * FONCTIONNALITÉS:
 * - Création d'un QueryClient avec options par défaut
 * - Gestion SSR/CSR (création séparée pour serveur et client)
 * - Cache partagé côté client (une seule instance)
 * - Nouveau client à chaque requête SSR (évite le partage d'état)
 *
 * CONFIGURATION:
 * - staleTime: 1 minute (évite les refetch immédiats)
 * - retry: 1 tentative en cas d'échec
 * - refetchOnWindowFocus: false (ne pas refetch au focus de la fenêtre)
 */

'use client';

// Import de React Query
import { QueryClient } from '@tanstack/react-query';

/**
 * FONCTION: makeQueryClient
 *
 * Crée un nouveau QueryClient avec les options par défaut.
 *
 * @returns Instance de QueryClient configurée
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avec SSR, on veut généralement un staleTime > 0
        // pour éviter les refetch immédiats côté client
        staleTime: 60 * 1000, // 1 minute (données considérées fraîches pendant 1 min)
        retry: 1, // Réessayer 1 fois en cas d'échec
        refetchOnWindowFocus: false, // Ne pas refetch quand la fenêtre reprend le focus
      },
    },
  });
}

/**
 * Variable pour stocker le QueryClient côté client (browser)
 *
 * IMPORTANT: Une seule instance côté client pour partager le cache
 * entre les composants. Côté serveur, on crée toujours une nouvelle instance.
 */
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * FONCTION: getQueryClient
 *
 * Récupère ou crée le QueryClient approprié selon le contexte (SSR ou CSR).
 *
 * SSR (Server-Side Rendering):
 * - Crée toujours une nouvelle instance pour chaque requête
 * - Évite le partage d'état entre les utilisateurs
 *
 * CSR (Client-Side Rendering):
 * - Crée une seule instance partagée
 * - Permet le partage du cache entre les composants
 *
 * @returns Instance de QueryClient
 */
export function getQueryClient() {
  // Pour SSR, toujours créer un nouveau query client
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }

  // Pour CSR, créer un nouveau query client si on n'en a pas déjà un
  // C'est très important pour ne pas partager l'état entre utilisateurs en SSR
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

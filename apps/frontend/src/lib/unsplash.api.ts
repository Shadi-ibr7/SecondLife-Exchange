/**
 * FICHIER: unsplash.api.ts
 *
 * DESCRIPTION:
 * API client pour Unsplash via le backend (proxy).
 * La clé API Unsplash n'est plus exposée côté client.
 */

import apiClient from './api';

export type UnsplashPhoto = {
  id: string;
  urls: { small: string; full: string };
  alt_description: string;
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
};

/**
 * Recherche des photos sur Unsplash via le backend.
 * La clé API est gérée côté serveur pour éviter l'exposition.
 */
export async function fetchUnsplashPhotos(
  query: string,
  page = 1,
  perPage = 12
): Promise<UnsplashPhoto[]> {
  const response = await apiClient.client.get('/unsplash/search', {
    params: {
      query,
      page,
      perPage,
    },
  });
  return response.data.results || [];
}

/**
 * Déclenche le téléchargement d'une photo (attribution Unsplash).
 * Utilise le backend pour éviter d'exposer la clé API.
 */
export async function triggerDownload(
  photoId: string,
  downloadLocation: string
) {
  try {
    // Le backend gère le trigger download avec la clé API
    await apiClient.client.post('/unsplash/download', {
      photoId,
      downloadLocation,
    });
  } catch (e) {
    console.error('Erreur trigger download', e);
  }
}

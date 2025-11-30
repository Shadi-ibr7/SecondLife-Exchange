/**
 * FICHIER: hooks/useUnsplashImages.ts
 *
 * DESCRIPTION:
 * Hook personnalisé pour récupérer des images depuis l'API Unsplash.
 * Utilise React Query pour gérer le cache, le chargement, et les erreurs.
 * Ce hook est utilisé dans les composants qui permettent de rechercher
 * et sélectionner des images depuis Unsplash (ex: galerie d'images).
 *
 * FONCTIONNALITÉS:
 * - Récupération d'images depuis l'API Unsplash avec recherche
 * - Gestion automatique du cache avec React Query
 * - Pagination intégrée (page, perPage)
 * - Désactivation automatique si la requête est vide
 * - Cache de 5 minutes pour éviter les requêtes répétées
 *
 * PARAMÈTRES:
 * - query: Terme de recherche (ex: "laptop", "nature")
 * - page: Numéro de page (défaut: 1)
 * - perPage: Nombre d'images par page (défaut: 12)
 *
 * RETOUR:
 * Objet React Query avec:
 * - data: Données des images (ou undefined si en chargement/erreur)
 * - isLoading: true pendant le chargement
 * - error: Erreur si la requête échoue
 * - refetch: Fonction pour recharger les données
 *
 * EXEMPLE D'UTILISATION:
 * ```tsx
 * const { data, isLoading, error } = useUnsplashImages('laptop', 1, 12);
 *
 * if (isLoading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {data?.results.map((photo) => (
 *       <img key={photo.id} src={photo.urls.thumb} alt={photo.description} />
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @module hooks/useUnsplashImages
 */

'use client';

// Import de React Query pour la gestion des requêtes
import { useQuery } from '@tanstack/react-query';

// Import de la fonction API pour récupérer les photos Unsplash
import { fetchUnsplashPhotos } from '@/lib/unsplash.api';

/**
 * HOOK: useUnsplashImages
 *
 * Hook personnalisé pour récupérer des images depuis l'API Unsplash.
 *
 * FONCTIONNEMENT:
 * 1. Utilise React Query pour gérer la requête
 * 2. Construit une queryKey unique basée sur query et page
 * 3. Appelle fetchUnsplashPhotos() pour récupérer les images
 * 4. Désactive la requête si query est vide
 * 5. Cache les résultats pendant 5 minutes
 *
 * OPTIMISATION:
 * - Cache automatique: les mêmes requêtes ne sont pas refaites
 * - Désactivation si query vide: évite les requêtes inutiles
 * - staleTime: 5 minutes pour éviter les requêtes répétées
 *
 * @param query - Terme de recherche (ex: "laptop", "nature")
 * @param page - Numéro de page (optionnel, défaut: 1)
 * @param perPage - Nombre d'images par page (optionnel, défaut: 12)
 * @returns Objet React Query avec data, isLoading, error, etc.
 */
export function useUnsplashImages(query: string, page = 1, perPage = 12) {
  /**
   * Utiliser React Query pour gérer la requête
   *
   * useQuery() fournit:
   * - Cache automatique des résultats
   * - Gestion du chargement (isLoading)
   * - Gestion des erreurs (error)
   * - Refetch automatique selon staleTime
   */
  return useQuery({
    /**
     * Clé unique pour identifier cette requête dans le cache
     * Format: ['unsplash', query, page]
     *
     * EXEMPLES:
     * - ['unsplash', 'laptop', 1] -> cache pour "laptop" page 1
     * - ['unsplash', 'laptop', 2] -> cache pour "laptop" page 2
     * - ['unsplash', 'nature', 1] -> cache pour "nature" page 1
     *
     * IMPORTANCE:
     * Chaque combinaison query+page a son propre cache
     * Si on change de page, React Query récupère depuis le cache si disponible
     */
    queryKey: ['unsplash', query, page],

    /**
     * Fonction qui fait la requête API
     * Appelée automatiquement par React Query quand nécessaire
     * (première fois, cache expiré, refetch manuel, etc.)
     */
    queryFn: () => fetchUnsplashPhotos(query, page, perPage),

    /**
     * Désactiver la requête si query est vide
     * !!query convertit query en boolean (true si non vide, false si vide)
     *
     * POURQUOI:
     * Si query est vide, on ne veut pas faire de requête à Unsplash
     * (pas de recherche = pas de résultats pertinents)
     */
    enabled: !!query,

    /**
     * Temps avant que les données soient considérées comme "stale" (périmées)
     * 1000 * 60 * 5 = 5 minutes (en millisecondes)
     *
     * FONCTIONNEMENT:
     * - Pendant 5 minutes, les données sont considérées comme fraîches
     * - React Query ne refait pas la requête si les données sont fraîches
     * - Après 5 minutes, les données sont "stale" et seront refetchées au prochain accès
     *
     * AVANTAGE:
     * Évite les requêtes répétées pour les mêmes recherches
     * (ex: si l'utilisateur revient sur la même page rapidement)
     */
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

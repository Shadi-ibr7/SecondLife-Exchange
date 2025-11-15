/**
 * FICHIER: useQueryParams.ts
 *
 * DESCRIPTION:
 * Ce hook personnalisé gère les paramètres de requête (query params) de l'URL.
 * Il permet de lire et modifier les paramètres de filtrage et de pagination
 * dans l'URL de manière réactive.
 *
 * FONCTIONNALITÉS:
 * - Lecture des paramètres de requête depuis l'URL
 * - Mise à jour des paramètres de requête (sans rechargement de page)
 * - Réinitialisation des paramètres
 * - Réinitialisation automatique de la page lors du changement de filtres
 * - Parsing automatique des valeurs (nombres, strings, etc.)
 *
 * PARAMÈTRES SUPPORTÉS:
 * - page: Numéro de page (défaut: 1)
 * - limit: Nombre d'éléments par page (défaut: 20)
 * - q: Recherche textuelle
 * - category: Catégorie de l'item
 * - condition: Condition de l'item
 * - status: Statut de l'item
 * - ownerId: ID du propriétaire
 * - sort: Tri (défaut: '-createdAt')
 */

// Import de Next.js
import { useSearchParams } from 'next/navigation';

// Import de React
import { useCallback, useMemo } from 'react';

// Import des types
import { ListItemsParams } from '@/types';

/**
 * HOOK: useQueryParams
 *
 * Hook personnalisé pour gérer les paramètres de requête de l'URL.
 *
 * @returns Objet avec les paramètres parsés et les fonctions de mise à jour
 */
export function useQueryParams() {
  /**
   * Hook Next.js pour récupérer les paramètres de requête.
   */
  const searchParams = useSearchParams();

  // ============================================
  // PARSING DES PARAMÈTRES
  // ============================================

  /**
   * Parse les paramètres de requête depuis l'URL.
   * Utilise useMemo pour éviter les recalculs inutiles.
   */
  const params = useMemo((): ListItemsParams => {
    return {
      // Page: parser en nombre ou utiliser 1 par défaut
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,

      // Limit: parser en nombre ou utiliser 20 par défaut
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,

      // Recherche textuelle: utiliser la valeur ou undefined
      q: searchParams.get('q') || undefined,

      // Catégorie: utiliser la valeur ou undefined
      category: (searchParams.get('category') as any) || undefined,

      // Condition: utiliser la valeur ou undefined
      condition: (searchParams.get('condition') as any) || undefined,

      // Statut: utiliser la valeur ou undefined
      status: (searchParams.get('status') as any) || undefined,

      // ID du propriétaire: utiliser la valeur ou undefined
      ownerId: searchParams.get('ownerId') || undefined,

      // Tri: utiliser la valeur ou '-createdAt' par défaut
      sort: searchParams.get('sort') || '-createdAt',
    };
  }, [searchParams]);

  // ============================================
  // FONCTION: updateParams
  // ============================================

  /**
   * Met à jour les paramètres de requête dans l'URL.
   *
   * FONCTIONNEMENT:
   * - Réinitialise la page à 1 si un filtre change
   * - Supprime les paramètres avec des valeurs vides
   * - Met à jour l'URL sans recharger la page (pushState)
   *
   * @param newParams - Nouveaux paramètres à appliquer (partiels)
   */
  const updateParams = useCallback((newParams: Partial<ListItemsParams>) => {
    // Créer un objet URL depuis l'URL actuelle
    const url = new URL(window.location.href);
    const currentParams = new URLSearchParams(url.search);

    // Réinitialiser la page à 1 si un filtre change
    // (pour éviter d'être sur une page vide après filtrage)
    if (
      newParams.q !== undefined ||
      newParams.category !== undefined ||
      newParams.condition !== undefined ||
      newParams.status !== undefined ||
      newParams.sort !== undefined
    ) {
      newParams.page = 1;
    }

    // Mettre à jour chaque paramètre
    Object.entries(newParams).forEach(([key, value]) => {
      // Supprimer les paramètres avec des valeurs vides
      if (value === undefined || value === null || value === '') {
        currentParams.delete(key);
      } else {
        // Ajouter ou mettre à jour le paramètre
        currentParams.set(key, String(value));
      }
    });

    // Mettre à jour l'URL sans recharger la page
    const newUrl = `${url.pathname}?${currentParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  // ============================================
  // FONCTION: resetParams
  // ============================================

  /**
   * Réinitialise tous les paramètres de requête.
   *
   * Supprime tous les query params de l'URL, ne gardant que le chemin.
   */
  const resetParams = useCallback(() => {
    const url = new URL(window.location.href);
    // Mettre à jour l'URL avec seulement le chemin (sans query params)
    window.history.pushState({}, '', url.pathname);
  }, []);

  // ============================================
  // RETOUR DU HOOK
  // ============================================

  /**
   * Retourne les paramètres parsés et les fonctions de mise à jour.
   */
  return {
    params, // Paramètres parsés depuis l'URL
    updateParams, // Fonction pour mettre à jour les paramètres
    resetParams, // Fonction pour réinitialiser les paramètres
  };
}

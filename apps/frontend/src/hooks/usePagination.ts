/**
 * FICHIER: usePagination.ts
 *
 * DESCRIPTION:
 * Ce hook personnalisé gère la pagination dans l'application.
 * Il fournit des fonctions et des états pour naviguer entre les pages.
 *
 * FONCTIONNALITÉS:
 * - Gestion de la page courante
 * - Calcul du nombre total de pages
 * - Vérification de l'existence de pages suivante/précédente
 * - Navigation vers une page spécifique
 * - Navigation vers la page suivante/précédente
 * - Réinitialisation à la page 1
 *
 * UTILISATION:
 * const { currentPage, totalPages, goToNextPage, goToPreviousPage } = usePagination({
 *   total: 100,
 *   limit: 20,
 *   initialPage: 1
 * });
 */

// Import de React
import { useState, useMemo } from 'react';

/**
 * INTERFACE: UsePaginationProps
 *
 * Définit les propriétés acceptées par le hook.
 */
interface UsePaginationProps {
  total: number; // Nombre total d'éléments
  limit: number; // Nombre d'éléments par page
  initialPage?: number; // Page initiale (défaut: 1)
}

/**
 * HOOK: usePagination
 *
 * Hook personnalisé pour gérer la pagination.
 *
 * @param total - Nombre total d'éléments
 * @param limit - Nombre d'éléments par page
 * @param initialPage - Page initiale (défaut: 1)
 * @returns Objet avec l'état et les fonctions de pagination
 */
export function usePagination({
  total,
  limit,
  initialPage = 1,
}: UsePaginationProps) {
  // ============================================
  // GESTION DE L'ÉTAT
  // ============================================

  /**
   * État pour la page courante.
   */
  const [currentPage, setCurrentPage] = useState(initialPage);

  // ============================================
  // CALCULS DÉRIVÉS
  // ============================================

  /**
   * Calcule le nombre total de pages.
   * Utilise useMemo pour éviter les recalculs inutiles.
   */
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  /**
   * Vérifie s'il existe une page suivante.
   */
  const hasNextPage = currentPage < totalPages;

  /**
   * Vérifie s'il existe une page précédente.
   */
  const hasPreviousPage = currentPage > 1;

  // ============================================
  // FONCTIONS DE NAVIGATION
  // ============================================

  /**
   * Navigue vers une page spécifique.
   * Valide que la page est dans les limites (1 à totalPages).
   *
   * @param page - Numéro de la page à atteindre
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /**
   * Navigue vers la page suivante.
   * Ne fait rien s'il n'y a pas de page suivante.
   */
  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Navigue vers la page précédente.
   * Ne fait rien s'il n'y a pas de page précédente.
   */
  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  /**
   * Réinitialise la pagination à la page 1.
   */
  const reset = () => {
    setCurrentPage(1);
  };

  // ============================================
  // RETOUR DU HOOK
  // ============================================

  /**
   * Retourne l'état et les fonctions de pagination.
   */
  return {
    currentPage, // Page courante
    totalPages, // Nombre total de pages
    hasNextPage, // true s'il existe une page suivante
    hasPreviousPage, // true s'il existe une page précédente
    goToPage, // Fonction pour aller à une page spécifique
    goToNextPage, // Fonction pour aller à la page suivante
    goToPreviousPage, // Fonction pour aller à la page précédente
    reset, // Fonction pour réinitialiser à la page 1
  };
}

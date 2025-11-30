/**
 * FICHIER: hooks/usePagination.ts
 *
 * DESCRIPTION:
 * Ce hook personnalisé gère la pagination dans l'application.
 * Il fournit des fonctions et des états pour naviguer entre les pages de manière
 * réactive et type-safe. Ce hook est utilisé dans les composants qui affichent
 * des listes paginées (items, exchanges, etc.).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Gestion de la page courante avec état réactif
 * - Calcul automatique du nombre total de pages
 * - Vérification de l'existence de pages suivante/précédente
 * - Navigation vers une page spécifique avec validation
 * - Navigation vers la page suivante/précédente avec protection
 * - Réinitialisation à la page 1
 *
 * AVANTAGES:
 * - Logique de pagination centralisée et réutilisable
 * - Validation automatique des limites (1 à totalPages)
 * - Protection contre les navigations invalides
 * - Calculs optimisés avec useMemo
 *
 * EXEMPLE D'UTILISATION:
 * ```tsx
 * const { currentPage, totalPages, hasNextPage, goToNextPage } = usePagination({
 *   total: 100,      // 100 éléments au total
 *   limit: 20,      // 20 éléments par page
 *   initialPage: 1  // Commencer à la page 1
 * });
 *
 * // Afficher la pagination
 * <button onClick={goToNextPage} disabled={!hasNextPage}>
 *   Page suivante
 * </button>
 * ```
 *
 * @module hooks/usePagination
 */

// Import de React pour les hooks useState et useMemo
import { useState, useMemo } from 'react';

/**
 * INTERFACE: UsePaginationProps
 *
 * Définit les propriétés acceptées par le hook usePagination.
 * Ces propriétés sont utilisées pour initialiser la pagination.
 *
 * PROPRIÉTÉS:
 * - total: Nombre total d'éléments à paginer (doit être >= 0)
 * - limit: Nombre d'éléments par page (doit être > 0)
 * - initialPage: Page initiale (optionnel, défaut: 1, doit être >= 1)
 */
interface UsePaginationProps {
  /**
   * Nombre total d'éléments à paginer
   * Exemple: 100 items au total
   */
  total: number;

  /**
   * Nombre d'éléments par page
   * Exemple: 20 items par page
   */
  limit: number;

  /**
   * Page initiale (optionnel)
   * Si non fourni, la pagination commence à la page 1
   * Doit être >= 1 et <= totalPages
   */
  initialPage?: number;
}

/**
 * HOOK: usePagination
 *
 * Hook personnalisé pour gérer la pagination dans les listes.
 * Fournit un état réactif pour la page courante et des fonctions
 * pour naviguer entre les pages de manière sécurisée.
 *
 * FONCTIONNEMENT:
 * 1. Initialise la page courante avec initialPage (ou 1 par défaut)
 * 2. Calcule le nombre total de pages (total / limit, arrondi vers le haut)
 * 3. Fournit des flags pour vérifier l'existence de pages suivante/précédente
 * 4. Expose des fonctions de navigation avec validation automatique
 *
 * VALIDATION:
 * - Toutes les navigations vérifient que la page est dans les limites (1 à totalPages)
 * - Les fonctions ne font rien si la navigation est invalide (pas d'erreur)
 *
 * @param props - Propriétés de pagination (total, limit, initialPage)
 * @param props.total - Nombre total d'éléments à paginer
 * @param props.limit - Nombre d'éléments par page
 * @param props.initialPage - Page initiale (optionnel, défaut: 1)
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
   * État pour la page courante
   *
   * useState() crée un état réactif qui déclenche un re-render
   * quand la valeur change. La valeur initiale est initialPage (ou 1).
   *
   * Quand setCurrentPage() est appelé, React re-rend le composant
   * et tous les calculs dérivés (hasNextPage, hasPreviousPage) sont recalculés.
   */
  const [currentPage, setCurrentPage] = useState(initialPage);

  // ============================================
  // CALCULS DÉRIVÉS
  // ============================================

  /**
   * Calcule le nombre total de pages
   *
   * FORMULE:
   * totalPages = Math.ceil(total / limit)
   *
   * EXEMPLES:
   * - total: 100, limit: 20 -> totalPages: 5 (100 / 20 = 5)
   * - total: 99, limit: 20 -> totalPages: 5 (99 / 20 = 4.95, arrondi à 5)
   * - total: 0, limit: 20 -> totalPages: 0 (0 / 20 = 0)
   *
   * OPTIMISATION:
   * useMemo() évite de recalculer totalPages à chaque render.
   * Le calcul n'est fait que si total ou limit change.
   *
   * [total, limit]: dépendances - le calcul est refait si total ou limit change
   */
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  /**
   * Vérifie s'il existe une page suivante
   *
   * LOGIQUE:
   * Il y a une page suivante si currentPage < totalPages
   *
   * EXEMPLES:
   * - currentPage: 1, totalPages: 5 -> hasNextPage: true
   * - currentPage: 5, totalPages: 5 -> hasNextPage: false
   * - currentPage: 3, totalPages: 5 -> hasNextPage: true
   *
   * UTILISATION:
   * Utilisé pour désactiver le bouton "Page suivante" quand on est à la dernière page
   */
  const hasNextPage = currentPage < totalPages;

  /**
   * Vérifie s'il existe une page précédente
   *
   * LOGIQUE:
   * Il y a une page précédente si currentPage > 1
   *
   * EXEMPLES:
   * - currentPage: 1 -> hasPreviousPage: false
   * - currentPage: 2 -> hasPreviousPage: true
   * - currentPage: 5 -> hasPreviousPage: true
   *
   * UTILISATION:
   * Utilisé pour désactiver le bouton "Page précédente" quand on est à la première page
   */
  const hasPreviousPage = currentPage > 1;

  // ============================================
  // FONCTIONS DE NAVIGATION
  // ============================================

  /**
   * FONCTION: goToPage
   *
   * Navigue vers une page spécifique avec validation.
   *
   * VALIDATION:
   * - Vérifie que page >= 1 (pas de page négative ou zéro)
   * - Vérifie que page <= totalPages (pas de page au-delà de la dernière)
   * - Si la page est invalide, ne fait rien (pas d'erreur, pas de changement)
   *
   * UTILISATION:
   * Utilisé pour permettre à l'utilisateur de sauter directement à une page
   * (ex: via un input ou un sélecteur de page)
   *
   * EXEMPLES:
   * - goToPage(3) avec totalPages: 5 -> navigue vers la page 3
   * - goToPage(0) avec totalPages: 5 -> ne fait rien (page invalide)
   * - goToPage(10) avec totalPages: 5 -> ne fait rien (page invalide)
   *
   * @param page - Numéro de la page à atteindre (doit être entre 1 et totalPages)
   */
  const goToPage = (page: number) => {
    /**
     * Valider que la page est dans les limites
     * page >= 1: la page doit être au moins 1 (pas de page 0 ou négative)
     * page <= totalPages: la page ne doit pas dépasser le nombre total de pages
     *
     * Si la validation échoue, on ne fait rien (pas d'erreur, pas de changement d'état)
     * Cela évite les erreurs et permet une navigation sécurisée
     */
    if (page >= 1 && page <= totalPages) {
      /**
       * Mettre à jour l'état avec la nouvelle page
       * setCurrentPage() déclenche un re-render et recalcule hasNextPage/hasPreviousPage
       */
      setCurrentPage(page);
    }
  };

  /**
   * FONCTION: goToNextPage
   *
   * Navigue vers la page suivante.
   *
   * VALIDATION:
   * - Vérifie qu'il existe une page suivante (hasNextPage)
   * - Si pas de page suivante, ne fait rien
   *
   * UTILISATION:
   * Utilisé pour le bouton "Page suivante" dans l'interface
   *
   * EXEMPLE:
   * - currentPage: 2, totalPages: 5 -> navigue vers la page 3
   * - currentPage: 5, totalPages: 5 -> ne fait rien (déjà à la dernière page)
   */
  const goToNextPage = () => {
    /**
     * Vérifier qu'il existe une page suivante
     * hasNextPage est true si currentPage < totalPages
     */
    if (hasNextPage) {
      /**
       * Incrémenter la page courante
       * currentPage + 1 est toujours valide car on a vérifié hasNextPage
       */
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * FONCTION: goToPreviousPage
   *
   * Navigue vers la page précédente.
   *
   * VALIDATION:
   * - Vérifie qu'il existe une page précédente (hasPreviousPage)
   * - Si pas de page précédente, ne fait rien
   *
   * UTILISATION:
   * Utilisé pour le bouton "Page précédente" dans l'interface
   *
   * EXEMPLE:
   * - currentPage: 3, totalPages: 5 -> navigue vers la page 2
   * - currentPage: 1, totalPages: 5 -> ne fait rien (déjà à la première page)
   */
  const goToPreviousPage = () => {
    /**
     * Vérifier qu'il existe une page précédente
     * hasPreviousPage est true si currentPage > 1
     */
    if (hasPreviousPage) {
      /**
       * Décrémenter la page courante
       * currentPage - 1 est toujours valide car on a vérifié hasPreviousPage
       */
      setCurrentPage(currentPage - 1);
    }
  };

  /**
   * FONCTION: reset
   *
   * Réinitialise la pagination à la page 1.
   *
   * UTILISATION:
   * Utilisé pour réinitialiser la pagination après un changement de filtres
   * ou une recherche. Cela évite d'être sur une page vide après filtrage.
   *
   * EXEMPLE:
   * - Après avoir changé un filtre, appeler reset() pour revenir à la page 1
   * - Cela garantit que l'utilisateur voit toujours des résultats
   */
  const reset = () => {
    /**
     * Réinitialiser à la page 1
     * setCurrentPage(1) déclenche un re-render et recalcule hasNextPage/hasPreviousPage
     */
    setCurrentPage(1);
  };

  // ============================================
  // RETOUR DU HOOK
  // ============================================

  /**
   * Retourne l'état et les fonctions de pagination.
   *
   * STRUCTURE DE RETOUR:
   * - État: currentPage, totalPages, hasNextPage, hasPreviousPage
   * - Fonctions: goToPage, goToNextPage, goToPreviousPage, reset
   *
   * Tous ces éléments sont réactifs: quand currentPage change,
   * tous les composants utilisant ce hook sont re-rendus.
   */
  return {
    /**
     * Page courante (1 à totalPages)
     * Utilisé pour afficher "Page X sur Y" et pour les requêtes API
     */
    currentPage,

    /**
     * Nombre total de pages calculé (Math.ceil(total / limit))
     * Utilisé pour afficher le nombre total de pages et valider les navigations
     */
    totalPages,

    /**
     * true s'il existe une page suivante (currentPage < totalPages)
     * Utilisé pour désactiver le bouton "Page suivante" à la dernière page
     */
    hasNextPage,

    /**
     * true s'il existe une page précédente (currentPage > 1)
     * Utilisé pour désactiver le bouton "Page précédente" à la première page
     */
    hasPreviousPage,

    /**
     * Fonction pour naviguer vers une page spécifique
     * Valide que la page est dans les limites (1 à totalPages)
     */
    goToPage,

    /**
     * Fonction pour naviguer vers la page suivante
     * Ne fait rien s'il n'y a pas de page suivante
     */
    goToNextPage,

    /**
     * Fonction pour naviguer vers la page précédente
     * Ne fait rien s'il n'y a pas de page précédente
     */
    goToPreviousPage,

    /**
     * Fonction pour réinitialiser à la page 1
     * Utilisé après un changement de filtres ou une recherche
     */
    reset,
  };
}

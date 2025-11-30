/**
 * FICHIER: hooks/useQueryParams.ts
 *
 * DESCRIPTION:
 * Ce hook personnalisé gère les paramètres de requête (query params) de l'URL.
 * Il permet de lire et modifier les paramètres de filtrage et de pagination
 * dans l'URL de manière réactive, sans rechargement de page. Cela permet de
 * partager des URLs avec des filtres spécifiques et de maintenir l'état de
 * navigation dans l'historique du navigateur.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Lecture des paramètres de requête depuis l'URL (parsing automatique)
 * - Mise à jour des paramètres de requête (sans rechargement de page)
 * - Réinitialisation des paramètres (suppression de tous les query params)
 * - Réinitialisation automatique de la page à 1 lors du changement de filtres
 * - Parsing automatique des valeurs (nombres, strings, etc.)
 * - Suppression automatique des paramètres vides
 *
 * PARAMÈTRES SUPPORTÉS:
 * - page: Numéro de page (défaut: 1, parsé en nombre)
 * - limit: Nombre d'éléments par page (défaut: 20, parsé en nombre)
 * - q: Recherche textuelle (string)
 * - category: Catégorie de l'item (CLOTHING, ELECTRONICS, etc.)
 * - condition: Condition de l'item (NEW, GOOD, FAIR, TO_REPAIR)
 * - status: Statut de l'item (AVAILABLE, PENDING, TRADED, ARCHIVED)
 * - ownerId: ID du propriétaire (string)
 * - sort: Tri (défaut: '-createdAt', string)
 *
 * AVANTAGES:
 * - URLs partageables avec filtres inclus
 * - Navigation dans l'historique du navigateur (précédent/suivant)
 * - État persistant lors du rafraîchissement de la page
 * - Synchronisation automatique entre URL et état de l'application
 *
 * EXEMPLE D'UTILISATION:
 * ```tsx
 * const { params, updateParams, resetParams } = useQueryParams();
 *
 * // Lire les paramètres
 * console.log(params.page); // 1
 * console.log(params.q); // "laptop"
 *
 * // Mettre à jour les paramètres
 * updateParams({ q: 'phone', category: 'ELECTRONICS' });
 * // URL devient: /discover?q=phone&category=ELECTRONICS&page=1
 *
 * // Réinitialiser
 * resetParams();
 * // URL devient: /discover
 * ```
 *
 * @module hooks/useQueryParams
 */

// Import de Next.js pour accéder aux paramètres de requête
import { useSearchParams } from 'next/navigation';

// Import de React pour les hooks useCallback et useMemo
import { useCallback, useMemo } from 'react';

// Import des types TypeScript
import { ListItemsParams } from '@/types';

/**
 * HOOK: useQueryParams
 *
 * Hook personnalisé pour gérer les paramètres de requête de l'URL.
 *
 * FONCTIONNEMENT:
 * 1. Récupère les paramètres de requête depuis l'URL via useSearchParams()
 * 2. Parse les paramètres en types appropriés (nombres, strings, etc.)
 * 3. Fournit des fonctions pour mettre à jour et réinitialiser les paramètres
 * 4. Met à jour l'URL sans rechargement de page (pushState)
 *
 * RÉACTIVITÉ:
 * - Quand l'URL change, searchParams change et le hook recalcule params
 * - Les composants utilisant ce hook sont re-rendus automatiquement
 *
 * @returns Objet avec les paramètres parsés et les fonctions de mise à jour
 */
export function useQueryParams() {
  /**
   * Hook Next.js pour récupérer les paramètres de requête de l'URL
   *
   * useSearchParams() retourne un objet URLSearchParams qui contient
   * tous les query params de l'URL actuelle (ex: ?page=1&q=laptop)
   *
   * RÉACTIVITÉ:
   * - Quand l'URL change, searchParams change automatiquement
   * - Cela déclenche un re-render et recalcule params
   */
  const searchParams = useSearchParams();

  // ============================================
  // PARSING DES PARAMÈTRES
  // ============================================

  /**
   * Parse les paramètres de requête depuis l'URL
   *
   * OPTIMISATION:
   * useMemo() évite de recalculer params à chaque render.
   * Le parsing n'est fait que si searchParams change.
   *
   * PARSING:
   * - Nombres (page, limit): parseInt() pour convertir string -> number
   * - Strings (q, ownerId, sort): utiliser directement ou undefined
   * - Enums (category, condition, status): cast en type approprié
   *
   * VALEURS PAR DÉFAUT:
   * - page: 1 si non fourni
   * - limit: 20 si non fourni
   * - sort: '-createdAt' si non fourni
   * - Autres: undefined si non fourni
   */
  const params = useMemo((): ListItemsParams => {
    return {
      /**
       * Page: parser en nombre ou utiliser 1 par défaut
       * searchParams.get('page') retourne la valeur ou null
       * parseInt() convertit la string en nombre
       * ! (non-null assertion) car on vérifie que la valeur existe
       */
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,

      /**
       * Limit: parser en nombre ou utiliser 20 par défaut
       * Même logique que pour page
       */
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,

      /**
       * Recherche textuelle: utiliser la valeur ou undefined
       * || undefined convertit '' (chaîne vide) en undefined
       * Cela permet de distinguer "pas de recherche" de "recherche vide"
       */
      q: searchParams.get('q') || undefined,

      /**
       * Catégorie: utiliser la valeur ou undefined
       * as any: cast nécessaire car TypeScript ne connaît pas le type exact
       * Les valeurs valides sont définies dans ITEM_CATEGORIES
       */
      category: (searchParams.get('category') as any) || undefined,

      /**
       * Condition: utiliser la valeur ou undefined
       * Même logique que pour category
       */
      condition: (searchParams.get('condition') as any) || undefined,

      /**
       * Statut: utiliser la valeur ou undefined
       * Même logique que pour category
       */
      status: (searchParams.get('status') as any) || undefined,

      /**
       * ID du propriétaire: utiliser la valeur ou undefined
       * String simple, pas besoin de parsing
       */
      ownerId: searchParams.get('ownerId') || undefined,

      /**
       * Tri: utiliser la valeur ou '-createdAt' par défaut
       * '-createdAt' signifie tri décroissant par date de création
       */
      sort: searchParams.get('sort') || '-createdAt',
    };
  }, [searchParams]); // Recalculer si searchParams change

  // ============================================
  // FONCTION: updateParams
  // ============================================

  /**
   * FONCTION: updateParams
   *
   * Met à jour les paramètres de requête dans l'URL sans recharger la page.
   *
   * FONCTIONNEMENT:
   * 1. Récupère les paramètres actuels de l'URL
   * 2. Réinitialise la page à 1 si un filtre change (évite les pages vides)
   * 3. Met à jour chaque paramètre (ajoute, modifie, ou supprime)
   * 4. Supprime les paramètres avec des valeurs vides
   * 5. Met à jour l'URL avec pushState (sans rechargement)
   *
   * RÉINITIALISATION DE LA PAGE:
   * Si un filtre change (q, category, condition, status, sort),
   * la page est automatiquement réinitialisée à 1. Cela évite d'être
   * sur une page vide après filtrage (ex: page 5 avec 0 résultats).
   *
   * SUPPRESSION DES PARAMÈTRES VIDES:
   * Les paramètres avec des valeurs vides (undefined, null, '') sont
   * supprimés de l'URL pour garder l'URL propre.
   *
   * OPTIMISATION:
   * useCallback() mémorise la fonction pour éviter les re-créations
   * à chaque render. La fonction est stable et peut être passée en dépendance.
   *
   * @param newParams - Nouveaux paramètres à appliquer (partiels, tous les champs optionnels)
   */
  const updateParams = useCallback((newParams: Partial<ListItemsParams>) => {
    /**
     * Créer un objet URL depuis l'URL actuelle
     * new URL() parse l'URL complète (protocole, host, pathname, search, etc.)
     * window.location.href contient l'URL complète de la page actuelle
     */
    const url = new URL(window.location.href);

    /**
     * Créer un objet URLSearchParams depuis les query params actuels
     * url.search contient la partie "?page=1&q=laptop" de l'URL
     * URLSearchParams permet de manipuler facilement les query params
     */
    const currentParams = new URLSearchParams(url.search);

    /**
     * Réinitialiser la page à 1 si un filtre change
     *
     * POURQUOI:
     * Si l'utilisateur change un filtre (ex: recherche, catégorie),
     * les résultats peuvent changer drastiquement. Si on était sur la page 5
     * et qu'on filtre, il n'y a peut-être plus que 2 pages de résultats.
     * Réinitialiser à 1 évite d'être sur une page vide.
     *
     * FILTRES CONCERNÉS:
     * - q (recherche): change les résultats
     * - category: change les résultats
     * - condition: change les résultats
     * - status: change les résultats
     * - sort: change l'ordre, mais on réinitialise quand même pour cohérence
     */
    if (
      newParams.q !== undefined ||
      newParams.category !== undefined ||
      newParams.condition !== undefined ||
      newParams.status !== undefined ||
      newParams.sort !== undefined
    ) {
      /**
       * Forcer la page à 1
       * newParams.page sera utilisé pour mettre à jour l'URL
       */
      newParams.page = 1;
    }

    /**
     * Mettre à jour chaque paramètre dans newParams
     * Object.entries() itère sur toutes les paires [clé, valeur]
     */
    Object.entries(newParams).forEach(([key, value]) => {
      /**
       * Supprimer les paramètres avec des valeurs vides
       *
       * VALEURS VIDES:
       * - undefined: paramètre non fourni
       * - null: paramètre explicitement null
       * - '': chaîne vide (ex: recherche effacée)
       *
       * POURQUOI SUPPRIMER:
       * Garder l'URL propre en supprimant les paramètres inutiles
       * (ex: ?page=1&q= au lieu de ?page=1&q=&category=)
       */
      if (value === undefined || value === null || value === '') {
        /**
         * Supprimer le paramètre de l'URL
         * currentParams.delete() retire la clé de l'objet URLSearchParams
         */
        currentParams.delete(key);
      } else {
        /**
         * Ajouter ou mettre à jour le paramètre
         * String(value) convertit la valeur en string (requis pour URLSearchParams)
         * currentParams.set() ajoute ou remplace la valeur existante
         */
        currentParams.set(key, String(value));
      }
    });

    /**
     * Mettre à jour l'URL sans recharger la page
     *
     * CONSTRUCTION DE L'URL:
     * - url.pathname: le chemin (ex: /discover)
     * - currentParams.toString(): les query params (ex: page=1&q=laptop)
     * - Résultat: /discover?page=1&q=laptop
     *
     * pushState():
     * - Met à jour l'URL dans la barre d'adresse
     * - Ajoute une entrée dans l'historique du navigateur
     * - Ne recharge PAS la page (contrairement à window.location.href)
     * - Déclenche un événement popstate si on utilise le bouton précédent/suivant
     */
    const newUrl = `${url.pathname}?${currentParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, []); // Pas de dépendances, la fonction est stable

  // ============================================
  // FONCTION: resetParams
  // ============================================

  /**
   * FONCTION: resetParams
   *
   * Réinitialise tous les paramètres de requête en supprimant tous les query params.
   *
   * FONCTIONNEMENT:
   * 1. Récupère le chemin actuel (pathname)
   * 2. Met à jour l'URL avec seulement le chemin (sans query params)
   * 3. L'URL devient propre (ex: /discover au lieu de /discover?page=1&q=laptop)
   *
   * UTILISATION:
   * Utilisé pour réinitialiser tous les filtres et la pagination,
   * revenant à l'état initial de la page.
   *
   * EXEMPLE:
   * - URL avant: /discover?page=3&q=laptop&category=ELECTRONICS
   * - resetParams()
   * - URL après: /discover
   *
   * OPTIMISATION:
   * useCallback() mémorise la fonction pour éviter les re-créations.
   */
  const resetParams = useCallback(() => {
    /**
     * Créer un objet URL depuis l'URL actuelle
     * On a besoin de url.pathname pour garder le chemin
     */
    const url = new URL(window.location.href);

    /**
     * Mettre à jour l'URL avec seulement le chemin (sans query params)
     * url.pathname contient le chemin (ex: /discover)
     * On ignore url.search (les query params) pour les supprimer
     *
     * pushState() met à jour l'URL sans recharger la page
     */
    window.history.pushState({}, '', url.pathname);
  }, []); // Pas de dépendances, la fonction est stable

  // ============================================
  // RETOUR DU HOOK
  // ============================================

  /**
   * Retourne les paramètres parsés et les fonctions de mise à jour.
   *
   * STRUCTURE DE RETOUR:
   * - params: objet avec tous les paramètres parsés depuis l'URL
   * - updateParams: fonction pour mettre à jour les paramètres
   * - resetParams: fonction pour réinitialiser tous les paramètres
   */
  return {
    /**
     * Paramètres parsés depuis l'URL
     * Contient tous les query params avec leurs types appropriés (nombres, strings, etc.)
     * Recalculé automatiquement quand l'URL change
     */
    params,

    /**
     * Fonction pour mettre à jour les paramètres
     * Met à jour l'URL sans recharger la page
     * Réinitialise automatiquement la page à 1 si un filtre change
     */
    updateParams,

    /**
     * Fonction pour réinitialiser tous les paramètres
     * Supprime tous les query params de l'URL
     */
    resetParams,
  };
}

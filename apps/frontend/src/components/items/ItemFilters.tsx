/**
 * FICHIER: components/items/ItemFilters.tsx
 *
 * DESCRIPTION:
 * Ce composant gère les filtres et la recherche pour la liste d'items.
 * Il permet de filtrer par catégorie, condition, statut, de rechercher par texte,
 * et de trier les résultats. Il affiche également les filtres actifs avec la possibilité
 * de les supprimer individuellement.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Recherche textuelle dans les items
 * - Filtrage par catégorie (électronique, vêtements, etc.)
 * - Filtrage par condition (neuf, bon état, etc.)
 * - Filtrage par statut (disponible, réservé, etc.)
 * - Tri des résultats (date, popularité, etc.)
 * - Affichage des filtres actifs avec badges
 * - Suppression individuelle des filtres
 * - Bouton de réinitialisation de tous les filtres
 *
 * UX:
 * - Mise à jour en temps réel des filtres (pas besoin de cliquer sur "Appliquer")
 * - Compteur du nombre de filtres actifs
 * - Badges cliquables pour supprimer rapidement un filtre
 * - Design responsive (colonnes sur mobile, ligne sur desktop)
 */

'use client';

// Import de React pour la gestion de l'état et des effets
import { useState, useEffect } from 'react';
// Import des composants UI réutilisables
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// Import des constantes pour les options de filtrage
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_STATUS,
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
  ITEM_STATUS_LABELS,
  SORT_OPTIONS,
} from '@/lib/constants';
// Import des types TypeScript pour garantir la sécurité des types
import { ListItemsParams } from '@/types';
// Import des icônes Lucide React
import { Search, X, Filter } from 'lucide-react';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ItemFiltersProps {
  params: ListItemsParams; // Paramètres de filtrage actuels (recherche, catégorie, etc.)
  onParamsChange: (params: Partial<ListItemsParams>) => void; // Callback appelé quand un filtre change
  onReset: () => void; // Callback appelé pour réinitialiser tous les filtres
}

/**
 * COMPOSANT PRINCIPAL: ItemFilters
 *
 * Ce composant gère les filtres et la recherche pour la liste d'items.
 *
 * @param params - Paramètres de filtrage actuels
 * @param onParamsChange - Callback appelé quand un filtre change
 * @param onReset - Callback appelé pour réinitialiser tous les filtres
 */
export function ItemFilters({
  params,
  onParamsChange,
  onReset,
}: ItemFiltersProps) {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État local pour stocker les paramètres de filtrage
   * On utilise un état local pour permettre des modifications temporaires
   * avant de les propager au parent via onParamsChange
   */
  const [localParams, setLocalParams] = useState(params);

  /**
   * useEffect pour synchroniser l'état local avec les props
   * Quand les paramètres changent depuis l'extérieur (ex: réinitialisation),
   * on met à jour l'état local
   */
  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // ============================================
  // GESTION DES CHANGEMENTS DE FILTRES
  // ============================================

  /**
   * Fonction appelée quand un filtre change (recherche, catégorie, etc.)
   * Elle met à jour l'état local ET notifie le parent immédiatement
   * pour une mise à jour en temps réel des résultats
   *
   * @param key - La clé du paramètre à modifier (ex: 'q', 'category', 'condition')
   * @param value - La nouvelle valeur du paramètre
   */
  const handleChange = (key: keyof ListItemsParams, value: any) => {
    /**
     * Créer un nouvel objet avec la valeur mise à jour
     * ...localParams: copier tous les paramètres existants
     * [key]: value: mettre à jour le paramètre spécifié
     */
    const newParams = { ...localParams, [key]: value };

    /**
     * Mettre à jour l'état local
     */
    setLocalParams(newParams);

    /**
     * Notifier le parent immédiatement pour mettre à jour les résultats
     * On passe seulement le paramètre modifié (Partial<ListItemsParams>)
     * pour permettre au parent de fusionner avec ses propres paramètres
     */
    onParamsChange({ [key]: value });
  };

  // ============================================
  // CALCUL DES FILTRES ACTIFS
  // ============================================

  /**
   * Vérifier s'il y a des filtres actifs
   * Un filtre est actif s'il n'est pas vide/null/undefined
   * Le tri par défaut (-createdAt) n'est pas considéré comme un filtre actif
   */
  const hasActiveFilters =
    localParams.q || // Recherche textuelle
    localParams.category || // Catégorie sélectionnée
    localParams.condition || // Condition sélectionnée
    localParams.status || // Statut sélectionné
    localParams.sort !== '-createdAt'; // Tri différent du tri par défaut

  /**
   * Compter le nombre de filtres actifs
   * On crée un tableau avec tous les filtres et on compte ceux qui ne sont pas vides
   * filter(Boolean) retire les valeurs falsy (null, undefined, '', 0, false)
   */
  const activeFiltersCount = [
    localParams.q, // Recherche
    localParams.category, // Catégorie
    localParams.condition, // Condition
    localParams.status, // Statut
    localParams.sort !== '-createdAt' ? localParams.sort : null, // Tri (seulement si différent du défaut)
  ].filter(Boolean).length; // Compter seulement les valeurs non vides

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  return (
    <Card>
      <CardContent className="p-6">
        {/*
          Conteneur principal avec layout responsive
          flex-col: colonne sur mobile
          md:flex-row: ligne sur tablette et desktop (≥768px)
          gap-4: espacement de 16px entre les éléments
        */}
        <div className="flex flex-col gap-4 md:flex-row">
          {/* ============================================
              CHAMP DE RECHERCHE TEXTUELLE
              ============================================ */}
          {/*
            Champ de recherche qui prend toute la largeur disponible
            flex-1: prend tout l'espace disponible dans le conteneur flex
          */}
          <div className="flex-1">
            {/*
              Conteneur relatif pour positionner l'icône de recherche
              relative: permet de positionner l'icône en absolute
            */}
            <div className="relative">
              {/*
                Icône de recherche positionnée à gauche du champ
                absolute left-3 top-3: position absolue en haut à gauche
                text-muted-foreground: couleur atténuée
              */}
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              {/*
                Champ de saisie pour la recherche textuelle
                pl-10: padding à gauche de 40px pour laisser de la place à l'icône
                value={localParams.q || ''}: valeur contrôlée depuis l'état local
                onChange: mettre à jour le filtre de recherche en temps réel
              */}
              <Input
                placeholder="Rechercher un objet..."
                value={localParams.q || ''}
                onChange={(e) => handleChange('q', e.target.value)} // Mettre à jour le filtre de recherche
                className="pl-10"
              />
            </div>
          </div>

          {/* ============================================
              FILTRES (CATÉGORIE, CONDITION, STATUT, TRI)
              ============================================ */}
          {/*
            Conteneur pour les sélecteurs de filtres
            flex-col: colonne sur mobile
            md:flex-row: ligne sur tablette et desktop
            gap-2: espacement de 8px entre les sélecteurs
          */}
          <div className="flex flex-col gap-2 md:flex-row">
            {/*
              Sélecteur de catégorie
              value={localParams.category || ''}: valeur contrôlée depuis l'état local
              onChange: mettre à jour le filtre de catégorie
              Si la valeur est vide (''), on passe undefined pour supprimer le filtre
            */}
            <select
              value={localParams.category || ''}
              onChange={
                (e) => handleChange('category', e.target.value || undefined) // undefined si vide pour supprimer le filtre
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {/*
                Option par défaut pour afficher toutes les catégories
                value="": valeur vide signifie "pas de filtre"
              */}
              <option value="">Toutes les catégories</option>
              {/*
                Parcourir toutes les catégories disponibles et créer une option pour chacune
                ITEM_CATEGORIES: liste des catégories (ex: ['ELECTRONICS', 'CLOTHING', ...])
                ITEM_CATEGORY_LABELS: labels traduits (ex: { ELECTRONICS: 'Électronique', ... })
              */}
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {ITEM_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>

            <select
              value={localParams.condition || ''}
              onChange={(e) =>
                handleChange('condition', e.target.value || undefined)
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous les états</option>
              {ITEM_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {ITEM_CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>

            <select
              value={localParams.status || ''}
              onChange={(e) =>
                handleChange('status', e.target.value || undefined)
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous les statuts</option>
              {ITEM_STATUS.map((status) => (
                <option key={status} value={status}>
                  {ITEM_STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <select
              value={localParams.sort || '-createdAt'}
              onChange={(e) => handleChange('sort', e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ============================================
            FILTRES ACTIFS (BADGES)
            ============================================ */}
        {/*
          Afficher la section des filtres actifs seulement s'il y en a
          Cela permet à l'utilisateur de voir rapidement quels filtres sont appliqués
          et de les supprimer individuellement
        */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/*
              Label "Filtres actifs:"
              text-sm: texte petit
              text-muted-foreground: couleur atténuée
            */}
            <span className="text-sm text-muted-foreground">
              Filtres actifs:
            </span>
            {/*
              Badge pour le filtre de recherche textuelle
              Afficher seulement si une recherche est active
            */}
            {localParams.q && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Recherche: "{localParams.q}"
                {/*
                  Bouton pour supprimer le filtre de recherche
                  onClick: passer undefined pour supprimer le filtre
                  hover:text-destructive: couleur rouge au survol pour indiquer la suppression
                */}
                <button
                  onClick={() => handleChange('q', undefined)} // Supprimer le filtre de recherche
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ITEM_CATEGORY_LABELS[localParams.category]}
                <button
                  onClick={() => handleChange('category', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.condition && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ITEM_CONDITION_LABELS[localParams.condition]}
                <button
                  onClick={() => handleChange('condition', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ITEM_STATUS_LABELS[localParams.status]}
                <button
                  onClick={() => handleChange('status', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.sort !== '-createdAt' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {
                  SORT_OPTIONS.find((opt) => opt.value === localParams.sort)
                    ?.label
                }
                <button
                  onClick={() => handleChange('sort', '-createdAt')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {/*
              Bouton pour réinitialiser tous les filtres
              Affiche le nombre de filtres actifs pour informer l'utilisateur
              variant="outline": style avec bordure
              size="sm": petite taille
              onClick={onReset}: appeler le callback de réinitialisation
            */}
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="ml-2"
            >
              <Filter className="mr-2 h-4 w-4" />
              Réinitialiser ({activeFiltersCount})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

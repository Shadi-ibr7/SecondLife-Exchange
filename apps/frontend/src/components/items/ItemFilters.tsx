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
import { useState, useEffect, useCallback } from 'react';
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
  RADIUS_OPTIONS,
} from '@/lib/constants';
// Import des types TypeScript pour garantir la sécurité des types
import { ListItemsParams, CitySuggestion } from '@/types';
// Import des icônes Lucide React
import { Search, X, Filter, MapPin, Loader2, Navigation } from 'lucide-react';
// Import du client API
import { apiClient } from '@/lib/api';
// Import du store de localisation
import { useLocationStore, useUserLocation } from '@/store/location';
// Import du composant CityAutocomplete
import { CityAutocomplete } from '@/components/geo/CityAutocomplete';

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

  // État pour les régions et départements
  const [regions, setRegions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<{ code: string; name: string }[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Store de localisation pour GPS
  const { mode: locationMode, gpsCoordinates, setGpsLocation, setGpsPermission } = useLocationStore();
  const { coords: userCoords, isLocationEnabled } = useUserLocation();
  const [isGeolocating, setIsGeolocating] = useState(false);

  /**
   * useEffect pour synchroniser l'état local avec les props
   * Quand les paramètres changent depuis l'extérieur (ex: réinitialisation),
   * on met à jour l'état local
   */
  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // Charger les régions au montage
  useEffect(() => {
    const loadRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const data = await apiClient.getRegions();
        setRegions(data);
      } catch (error) {
        console.error('Erreur lors du chargement des régions:', error);
      } finally {
        setIsLoadingRegions(false);
      }
    };
    loadRegions();
  }, []);

  // Charger les départements quand la région change
  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const data = await apiClient.getDepartments(localParams.region);
        setDepartments(data);
      } catch (error) {
        console.error('Erreur lors du chargement des départements:', error);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, [localParams.region]);

  // Demander la géolocalisation GPS
  const requestGpsLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsGeolocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      setGpsPermission('granted');
      setGpsLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      // Mettre à jour les params avec les coordonnées GPS
      onParamsChange({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error: any) {
      if (error.code === 1) {
        setGpsPermission('denied');
      }
    } finally {
      setIsGeolocating(false);
    }
  }, [setGpsLocation, setGpsPermission, onParamsChange]);

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
   * Le rayon par défaut (25) n'est pas considéré comme un filtre actif
   */
  const hasActiveFilters =
    localParams.q || // Recherche textuelle
    localParams.category || // Catégorie sélectionnée
    localParams.condition || // Condition sélectionnée
    localParams.status || // Statut sélectionné
    localParams.region || // Région sélectionnée
    localParams.department || // Département sélectionné
    localParams.city || // Ville sélectionnée
    localParams.lat !== undefined || // GPS activé
    (localParams.radiusKm && localParams.radiusKm !== 25) || // Rayon différent du défaut
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
    localParams.region, // Région
    localParams.department, // Département
    localParams.city, // Ville
    localParams.lat !== undefined ? 'gps' : null, // GPS
    localParams.radiusKm && localParams.radiusKm !== 25 ? localParams.radiusKm : null, // Rayon
    localParams.sort !== '-createdAt' ? localParams.sort : null, // Tri (seulement si différent du défaut)
  ].filter(Boolean).length; // Compter seulement les valeurs non vides

  // Désactiver le GPS
  const disableGps = useCallback(() => {
    onParamsChange({ lat: undefined, lng: undefined });
  }, [onParamsChange]);

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
            FILTRES DE LOCALISATION (GPS, RÉGION, DÉPARTEMENT, VILLE)
            ============================================ */}
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
          {/* Bouton GPS */}
          <div className="flex items-center gap-2">
            <Button
              variant={localParams.lat !== undefined ? 'default' : 'outline'}
              size="sm"
              onClick={localParams.lat !== undefined ? disableGps : requestGpsLocation}
              disabled={isGeolocating}
              className="gap-2"
            >
              {isGeolocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {localParams.lat !== undefined ? 'GPS actif' : 'Autour de moi'}
            </Button>
          </div>

          {/* Sélecteur de région */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Région</label>
            <select
              value={localParams.region || ''}
              onChange={(e) => {
                const value = e.target.value || undefined;
                // Réinitialiser département et ville si région change
                handleChange('region', value);
                if (!value) {
                  handleChange('department', undefined);
                  handleChange('city', undefined);
                }
              }}
              disabled={isLoadingRegions}
              className="h-10 min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Toutes les régions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur de département */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Département</label>
            <select
              value={localParams.department || ''}
              onChange={(e) => {
                const value = e.target.value || undefined;
                handleChange('department', value);
                // Réinitialiser ville si département change
                if (!value) {
                  handleChange('city', undefined);
                }
              }}
              disabled={isLoadingDepartments}
              className="h-10 min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Autocomplétion ville */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Ville</label>
            <CityAutocomplete
              value={localParams.city ? { label: localParams.city, city: localParams.city, postalCode: '', department: '', region: '', latitude: 0, longitude: 0 } : null}
              onChange={(city) => {
                if (city) {
                  handleChange('city', city.city);
                  // Si pas de région/département sélectionné, les remplir automatiquement
                  if (!localParams.region) {
                    handleChange('region', city.region);
                  }
                  if (!localParams.department) {
                    handleChange('department', city.department);
                  }
                } else {
                  handleChange('city', undefined);
                }
              }}
              placeholder="Rechercher une ville..."
              showGeolocationButton={false}
            />
          </div>

          {/* Sélecteur de rayon (si localisation active) */}
          {(localParams.lat !== undefined || localParams.city || localParams.department || localParams.region) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Rayon</label>
              <select
                value={localParams.radiusKm || 25}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  handleChange('radiusKm', value === 0 ? undefined : value);
                }}
                className="h-10 min-w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {RADIUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            {/* Badge pour GPS */}
            {localParams.lat !== undefined && (
              <Badge variant="default" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                GPS actif
                <button
                  onClick={disableGps}
                  className="ml-1 hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {/* Badge pour la région */}
            {localParams.region && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {localParams.region}
                <button
                  onClick={() => {
                    handleChange('region', undefined);
                    handleChange('department', undefined);
                    handleChange('city', undefined);
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {/* Badge pour le département */}
            {localParams.department && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Dép. {localParams.department}
                <button
                  onClick={() => {
                    handleChange('department', undefined);
                    handleChange('city', undefined);
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {/* Badge pour la ville */}
            {localParams.city && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {localParams.city}
                <button
                  onClick={() => handleChange('city', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {/* Badge pour le rayon (si différent de 25km) */}
            {localParams.radiusKm && localParams.radiusKm !== 25 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Rayon: {localParams.radiusKm} km
                <button
                  onClick={() => handleChange('radiusKm', 25)}
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

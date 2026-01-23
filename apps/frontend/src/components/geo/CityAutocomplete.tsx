/**
 * FICHIER: components/geo/CityAutocomplete.tsx
 *
 * DESCRIPTION:
 * Composant d'autocomplétion pour la sélection de villes françaises.
 * Utilise l'API Adresse Etalab via le backend pour rechercher les communes.
 *
 * FONCTIONNALITÉS:
 * - Recherche avec debounce (300ms) pour éviter trop de requêtes
 * - Affichage des suggestions avec ville + code postal
 * - Gestion du bouton "Autour de moi" pour la géolocalisation GPS
 * - Stockage des préférences de localisation
 *
 * UTILISATION:
 * <CityAutocomplete
 *   value={selectedCity}
 *   onChange={(city) => setSelectedCity(city)}
 *   onGeolocation={(coords) => setUserCoords(coords)}
 * />
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Crosshair, Loader2, X, ChevronDown } from 'lucide-react';
import { CitySuggestion } from '@/types';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Interface pour les props du composant
 */
interface CityAutocompleteProps {
  /** Ville actuellement sélectionnée */
  value?: CitySuggestion | null;
  /** Callback appelé quand une ville est sélectionnée */
  onChange: (city: CitySuggestion | null) => void;
  /** Callback appelé quand la géolocalisation GPS est utilisée */
  onGeolocation?: (coords: { lat: number; lng: number }) => void;
  /** Label du champ */
  label?: string;
  /** Placeholder du champ */
  placeholder?: string;
  /** Afficher le bouton "Autour de moi" */
  showGeolocationButton?: boolean;
  /** Erreur à afficher */
  error?: string;
  /** Désactiver le champ */
  disabled?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

/**
 * COMPOSANT: CityAutocomplete
 *
 * Champ de saisie avec autocomplétion pour les villes françaises.
 */
export function CityAutocomplete({
  value,
  onChange,
  onGeolocation,
  label = 'Ville',
  placeholder = 'Rechercher une ville...',
  showGeolocationButton = true,
  error,
  disabled = false,
  className,
}: CityAutocompleteProps) {
  // ============================================
  // ÉTATS LOCAUX
  // ============================================

  /** Texte de recherche */
  const [searchText, setSearchText] = useState('');
  /** Suggestions de villes */
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  /** État de chargement des suggestions */
  const [isLoading, setIsLoading] = useState(false);
  /** État de chargement de la géolocalisation */
  const [isGeolocating, setIsGeolocating] = useState(false);
  /** Menu déroulant ouvert */
  const [isOpen, setIsOpen] = useState(false);
  /** Index de la suggestion active (navigation clavier) */
  const [activeIndex, setActiveIndex] = useState(-1);
  /** Erreur de géolocalisation */
  const [geoError, setGeoError] = useState<string | null>(null);

  /** Référence au conteneur pour détecter les clics extérieurs */
  const containerRef = useRef<HTMLDivElement>(null);
  /** Référence au timeout de debounce */
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // EFFETS
  // ============================================

  /**
   * Synchroniser le texte de recherche avec la valeur sélectionnée
   */
  useEffect(() => {
    if (value) {
      setSearchText(value.label);
    }
  }, [value]);

  /**
   * Fermer le menu si on clique en dehors
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // FONCTIONS
  // ============================================

  /**
   * Rechercher des villes avec debounce
   */
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await apiClient.searchCities(query, 10);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } catch (error) {
      console.error('Erreur recherche villes:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Gérer le changement de texte avec debounce
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);

    // Annuler le timeout précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Si le champ est vidé, réinitialiser la sélection
    if (!query) {
      onChange(null);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Debounce de 300ms
    debounceRef.current = setTimeout(() => {
      searchCities(query);
    }, 300);
  };

  /**
   * Sélectionner une ville
   */
  const handleSelectCity = (city: CitySuggestion) => {
    setSearchText(city.label);
    onChange(city);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setGeoError(null);
  };

  /**
   * Gérer la navigation clavier
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelectCity(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  /**
   * Utiliser la géolocalisation GPS
   */
  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGeolocating(true);
    setGeoError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache de 1 minute
        });
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Appeler le callback de géolocalisation
      onGeolocation?.(coords);

      // Rechercher la ville correspondante (reverse geocoding via Etalab)
      // Pour l'instant, on affiche juste "Ma position"
      setSearchText('Ma position GPS');
      onChange(null); // Pas de ville sélectionnée, mais coords disponibles

    } catch (error: any) {
      let message = 'Erreur de géolocalisation';
      if (error.code === 1) {
        message = 'Permission de géolocalisation refusée';
      } else if (error.code === 2) {
        message = 'Position non disponible';
      } else if (error.code === 3) {
        message = 'Délai de géolocalisation dépassé';
      }
      setGeoError(message);
    } finally {
      setIsGeolocating(false);
    }
  };

  /**
   * Effacer la sélection
   */
  const handleClear = () => {
    setSearchText('');
    onChange(null);
    setSuggestions([]);
    setIsOpen(false);
    setGeoError(null);
  };

  // ============================================
  // RENDU
  // ============================================

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Label */}
      {label && <Label className="mb-1.5 block">{label}</Label>}

      {/* Champ de saisie + boutons */}
      <div className="flex gap-2">
        {/* Input avec icône et autocomplétion */}
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled || isGeolocating}
            className="pl-10 pr-10"
          />
          {/* Bouton effacer */}
          {searchText && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* Indicateur de chargement */}
          {isLoading && (
            <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}

          {/* Menu déroulant des suggestions */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              <ul className="max-h-60 overflow-auto py-1">
                {suggestions.map((city, index) => (
                  <li
                    key={`${city.city}-${city.postalCode}`}
                    onClick={() => handleSelectCity(city)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'cursor-pointer px-3 py-2 text-sm',
                      index === activeIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="font-medium">{city.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.department} - {city.region}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bouton "Autour de moi" */}
        {showGeolocationButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGeolocation}
            disabled={disabled || isGeolocating}
            title="Utiliser ma position GPS"
          >
            {isGeolocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Message d'erreur */}
      {(error || geoError) && (
        <p className="mt-1 text-sm text-destructive">{error || geoError}</p>
      )}

      {/* Indication de la ville sélectionnée */}
      {value && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>
            {value.city} ({value.postalCode}) - {value.region}
          </span>
        </div>
      )}
    </div>
  );
}

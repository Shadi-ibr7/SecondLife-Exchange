/**
 * FICHIER: components/geo/LocationBar.tsx
 *
 * DESCRIPTION:
 * Composant de barre de localisation affiché en haut des pages de listing.
 * Permet à l'utilisateur de voir et modifier sa localisation.
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MapPin,
  Crosshair,
  ChevronDown,
  Loader2,
  X,
  Navigation,
} from 'lucide-react';
import { useLocationStore, useUserLocation } from '@/store/location';
import { CityAutocomplete } from './CityAutocomplete';
import { RADIUS_OPTIONS } from '@/lib/constants';
import { CitySuggestion } from '@/types';
import { cn } from '@/lib/utils';

/**
 * COMPOSANT: LocationBar
 *
 * Barre de localisation avec sélection GPS/ville et rayon.
 */
export function LocationBar() {
  const {
    mode,
    setMode,
    setGpsLocation,
    setCityLocation,
    setRadiusKm,
    setGpsPermission,
    selectedCity,
    gpsCoordinates,
  } = useLocationStore();

  const { coords, radiusKm, isLocationEnabled } = useUserLocation();

  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Demander la permission GPS et obtenir la position
   */
  const requestGpsLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée');
      return;
    }

    setIsGeolocating(true);
    setGeoError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      setGpsPermission('granted');
      setGpsLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setGeoError(null);
      setIsOpen(false);
    } catch (error: any) {
      let message = 'Erreur de géolocalisation';
      if (error.code === 1) {
        message = 'Permission refusée';
        setGpsPermission('denied');
      } else if (error.code === 2) {
        message = 'Position non disponible';
      } else if (error.code === 3) {
        message = 'Délai dépassé';
      }
      setGeoError(message);
    } finally {
      setIsGeolocating(false);
    }
  }, [setGpsLocation, setGpsPermission]);

  /**
   * Désactiver la localisation
   */
  const disableLocation = useCallback(() => {
    setMode('none');
    setGeoError(null);
    setIsOpen(false);
  }, [setMode]);

  /**
   * Gérer la sélection d'une ville
   */
  const handleCitySelect = useCallback(
    (city: CitySuggestion | null) => {
      setCityLocation(city);
      if (city) {
        setIsOpen(false);
      }
    },
    [setCityLocation]
  );

  /**
   * Obtenir le label de localisation actuel
   */
  const getLocationLabel = () => {
    if (mode === 'gps' && gpsCoordinates) {
      return 'Ma position';
    }
    if (mode === 'city' && selectedCity) {
      return selectedCity.city;
    }
    return 'Toute la France';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <MapPin className="h-4 w-4 text-muted-foreground" />

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 font-normal"
          >
            <span className={cn(isLocationEnabled && 'text-primary font-medium')}>
              {getLocationLabel()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <h4 className="font-medium">Localisation</h4>

            {/* Bouton GPS */}
            <Button
              variant={mode === 'gps' ? 'default' : 'outline'}
              className="w-full justify-start gap-2"
              onClick={requestGpsLocation}
              disabled={isGeolocating}
            >
              {isGeolocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              Autour de moi
              {mode === 'gps' && gpsCoordinates && (
                <Badge variant="secondary" className="ml-auto">
                  Actif
                </Badge>
              )}
            </Button>

            {geoError && (
              <p className="text-sm text-destructive">{geoError}</p>
            )}

            <DropdownMenuSeparator />

            {/* Autocomplétion ville */}
            <div onClick={(e) => e.stopPropagation()}>
              <CityAutocomplete
                value={selectedCity}
                onChange={handleCitySelect}
                label="Choisir une ville"
                placeholder="Rechercher..."
                showGeolocationButton={false}
              />
            </div>

            {isLocationEnabled && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={disableLocation}
                >
                  <X className="h-4 w-4" />
                  Désactiver la localisation
                </Button>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {isLocationEnabled && (
        <>
          <span className="text-muted-foreground">dans un rayon de</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {RADIUS_OPTIONS.filter((opt) => opt.value > 0).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      )}

      {isLocationEnabled && (
        <Badge variant="outline" className="ml-auto">
          <Navigation className="mr-1 h-3 w-3" />
          {mode === 'gps' ? 'GPS' : 'Ville'}
        </Badge>
      )}
    </div>
  );
}

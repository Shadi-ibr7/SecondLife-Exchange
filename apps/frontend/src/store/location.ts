/**
 * FICHIER: store/location.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion des préférences de localisation.
 * Il gère la position de l'utilisateur (GPS ou ville choisie), le rayon de recherche,
 * et la persistance de ces préférences dans localStorage.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Stockage persistant des préférences de localisation (localStorage)
 * - Gestion de la position GPS de l'utilisateur
 * - Gestion de la ville sélectionnée via autocomplétion
 * - Gestion du rayon de recherche préféré
 * - Priorité GPS > Ville > Aucun
 *
 * ARCHITECTURE:
 * - Pattern: Store Zustand avec middleware de persistance
 * - Persistance: localStorage sous la clé 'location-storage'
 * - Synchronisation avec les composants via hooks
 *
 * UTILISATION:
 * ```tsx
 * const { mode, userLocation, setGpsLocation, setCityLocation } = useLocationStore();
 *
 * // Obtenir les coordonnées pour les requêtes API
 * const { lat, lng } = getUserCoordinates();
 * ```
 *
 * @module store/location
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CitySuggestion } from '@/types';

// ============================================
// INTERFACES
// ============================================

/**
 * INTERFACE: LocationState
 *
 * Définit la structure de l'état de localisation dans le store Zustand.
 */
interface LocationState {
  /**
   * Mode de localisation actif
   * - 'gps': Utiliser la position GPS
   * - 'city': Utiliser la ville sélectionnée
   * - 'none': Aucune localisation (désactivé)
   */
  mode: 'gps' | 'city' | 'none';

  /**
   * Coordonnées GPS de l'utilisateur (si mode = gps)
   * Obtenues via navigator.geolocation
   */
  gpsCoordinates: { lat: number; lng: number } | null;

  /**
   * Ville sélectionnée via autocomplétion (si mode = city)
   */
  selectedCity: CitySuggestion | null;

  /**
   * Rayon de recherche préféré en km
   * Défaut: 25 km
   */
  radiusKm: number;

  /**
   * Permission GPS
   * - 'granted': Permission accordée
   * - 'denied': Permission refusée
   * - 'prompt': En attente de permission
   * - null: Non demandée encore
   */
  gpsPermission: 'granted' | 'denied' | 'prompt' | null;

  /**
   * Timestamp de la dernière mise à jour des coordonnées GPS
   * Utilisé pour savoir si les coordonnées sont récentes
   */
  gpsLastUpdated: number | null;

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Définir les coordonnées GPS et passer en mode GPS
   */
  setGpsLocation: (coords: { lat: number; lng: number }) => void;

  /**
   * Définir la ville sélectionnée et passer en mode ville
   */
  setCityLocation: (city: CitySuggestion | null) => void;

  /**
   * Définir le rayon de recherche
   */
  setRadiusKm: (radius: number) => void;

  /**
   * Définir le mode de localisation
   */
  setMode: (mode: 'gps' | 'city' | 'none') => void;

  /**
   * Définir la permission GPS
   */
  setGpsPermission: (permission: 'granted' | 'denied' | 'prompt') => void;

  /**
   * Réinitialiser les préférences de localisation
   */
  reset: () => void;

  /**
   * Obtenir les coordonnées actuelles selon le mode
   * Retourne null si aucune localisation n'est disponible
   */
  getUserCoordinates: () => { lat: number; lng: number } | null;
}

// ============================================
// STORE ZUSTAND
// ============================================

/**
 * Store Zustand pour la gestion des préférences de localisation.
 * Utilise le middleware persist pour sauvegarder dans localStorage.
 */
export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================

      mode: 'none',
      gpsCoordinates: null,
      selectedCity: null,
      radiusKm: 25,
      gpsPermission: null,
      gpsLastUpdated: null,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Définir les coordonnées GPS et passer en mode GPS
       */
      setGpsLocation: (coords) => {
        set({
          gpsCoordinates: coords,
          mode: 'gps',
          gpsLastUpdated: Date.now(),
        });
      },

      /**
       * Définir la ville sélectionnée et passer en mode ville
       */
      setCityLocation: (city) => {
        set({
          selectedCity: city,
          mode: city ? 'city' : 'none',
        });
      },

      /**
       * Définir le rayon de recherche
       */
      setRadiusKm: (radius) => {
        set({ radiusKm: radius });
      },

      /**
       * Définir le mode de localisation
       */
      setMode: (mode) => {
        set({ mode });
      },

      /**
       * Définir la permission GPS
       */
      setGpsPermission: (permission) => {
        set({ gpsPermission: permission });
      },

      /**
       * Réinitialiser les préférences de localisation
       */
      reset: () => {
        set({
          mode: 'none',
          gpsCoordinates: null,
          selectedCity: null,
          radiusKm: 25,
          gpsPermission: null,
          gpsLastUpdated: null,
        });
      },

      /**
       * Obtenir les coordonnées actuelles selon le mode
       *
       * PRIORITÉ:
       * 1. Si mode = 'gps' et coordonnées GPS disponibles -> coordonnées GPS
       * 2. Si mode = 'city' et ville sélectionnée -> coordonnées de la ville
       * 3. Sinon -> null
       */
      getUserCoordinates: () => {
        const state = get();

        if (state.mode === 'gps' && state.gpsCoordinates) {
          return state.gpsCoordinates;
        }

        if (state.mode === 'city' && state.selectedCity) {
          return {
            lat: state.selectedCity.latitude,
            lng: state.selectedCity.longitude,
          };
        }

        return null;
      },
    }),
    {
      name: 'location-storage', // Clé dans localStorage
      partialize: (state) => ({
        // Sélectionner les propriétés à persister
        mode: state.mode,
        gpsCoordinates: state.gpsCoordinates,
        selectedCity: state.selectedCity,
        radiusKm: state.radiusKm,
        gpsPermission: state.gpsPermission,
        gpsLastUpdated: state.gpsLastUpdated,
      }),
    }
  )
);

// ============================================
// HOOK: useUserLocation
// ============================================

/**
 * Hook personnalisé pour obtenir facilement les coordonnées de l'utilisateur.
 *
 * UTILISATION:
 * ```tsx
 * const { coords, mode, radiusKm, isLocationEnabled } = useUserLocation();
 *
 * if (isLocationEnabled && coords) {
 *   // Utiliser coords.lat et coords.lng pour les requêtes
 * }
 * ```
 */
export const useUserLocation = () => {
  const {
    mode,
    gpsCoordinates,
    selectedCity,
    radiusKm,
    getUserCoordinates,
  } = useLocationStore();

  const coords = getUserCoordinates();
  const isLocationEnabled = mode !== 'none' && coords !== null;

  return {
    /** Coordonnées actuelles (ou null si non disponible) */
    coords,
    /** Mode de localisation actif */
    mode,
    /** Rayon de recherche en km */
    radiusKm,
    /** La localisation est-elle activée et disponible ? */
    isLocationEnabled,
    /** Coordonnées GPS brutes */
    gpsCoordinates,
    /** Ville sélectionnée */
    selectedCity,
  };
};

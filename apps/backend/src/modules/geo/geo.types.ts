/**
 * FICHIER: geo.types.ts
 *
 * DESCRIPTION:
 * Types TypeScript pour le module Geo.
 * Définit les interfaces pour les suggestions de villes et les réponses de l'API.
 */

/**
 * Interface: CitySuggestion
 *
 * Représente une suggestion de ville retournée par l'API d'autocomplétion.
 * Format normalisé pour être utilisé côté frontend.
 */
export interface CitySuggestion {
  /** Label complet pour l'affichage (ex: "Paris (75000)") */
  label: string;
  /** Nom de la ville (ex: "Paris") */
  city: string;
  /** Code postal (ex: "75000") */
  postalCode: string;
  /** Numéro du département (ex: "75") */
  department: string;
  /** Nom de la région (ex: "Île-de-France") */
  region: string;
  /** Latitude GPS */
  latitude: number;
  /** Longitude GPS */
  longitude: number;
}

/**
 * Interface: EtalabApiResponse
 *
 * Structure de la réponse de l'API Adresse Etalab (data.gouv.fr).
 * Documentation: https://adresse.data.gouv.fr/api-doc/adresse
 */
export interface EtalabApiResponse {
  type: 'FeatureCollection';
  features: EtalabFeature[];
  query: string;
  limit: number;
}

/**
 * Interface: EtalabFeature
 *
 * Un résultat individuel de l'API Adresse Etalab.
 */
export interface EtalabFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    label: string; // Ex: "Paris"
    score: number; // Score de pertinence
    id: string; // ID unique
    type: string; // Type: "municipality", "street", "housenumber", etc.
    name: string; // Nom de la commune
    postcode: string; // Code postal (peut contenir plusieurs codes)
    citycode: string; // Code INSEE
    city?: string; // Nom de la ville (si différent de name)
    context: string; // Ex: "75, Paris, Île-de-France"
    importance: number;
    x: number;
    y: number;
  };
}

/**
 * Interface: CacheEntry
 *
 * Entrée du cache mémoire pour les réponses de l'API.
 */
export interface CacheEntry {
  data: CitySuggestion[];
  timestamp: number;
}

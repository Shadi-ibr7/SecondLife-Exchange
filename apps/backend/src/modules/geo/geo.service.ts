/**
 * FICHIER: geo.service.ts
 *
 * DESCRIPTION:
 * Service pour la géolocalisation et l'autocomplétion des villes.
 * Utilise l'API Adresse Etalab (data.gouv.fr) pour rechercher les communes françaises.
 *
 * FONCTIONNALITÉS:
 * - Autocomplétion des villes françaises
 * - Cache mémoire avec TTL de 5 minutes
 * - Normalisation des réponses API
 * - Gestion des erreurs et fallbacks
 *
 * API UTILISÉE:
 * - API Adresse Etalab: https://api-adresse.data.gouv.fr/search/
 * - Documentation: https://adresse.data.gouv.fr/api-doc/adresse
 * - Gratuite, sans clé API, pas de limite de requêtes stricte
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  CitySuggestion,
  EtalabApiResponse,
  EtalabFeature,
  CacheEntry,
} from './geo.types';

/**
 * SERVICE: GeoService
 *
 * Service principal pour les opérations géospatiales.
 */
@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  /**
   * Cache mémoire pour les réponses de l'API.
   * Clé: query string normalisée
   * Valeur: { data: CitySuggestion[], timestamp: number }
   */
  private readonly cache = new Map<string, CacheEntry>();

  /**
   * Durée de vie du cache en millisecondes (5 minutes)
   */
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  /**
   * URL de base de l'API Adresse Etalab
   */
  private readonly ETALAB_API_URL = 'https://api-adresse.data.gouv.fr/search/';

  /**
   * Mapping des codes de département vers les régions françaises.
   * Utilisé quand l'API ne retourne pas le nom de la région.
   */
  private readonly DEPARTMENT_TO_REGION: Record<string, string> = {
    '01': 'Auvergne-Rhône-Alpes',
    '02': 'Hauts-de-France',
    '03': 'Auvergne-Rhône-Alpes',
    '04': "Provence-Alpes-Côte d'Azur",
    '05': "Provence-Alpes-Côte d'Azur",
    '06': "Provence-Alpes-Côte d'Azur",
    '07': 'Auvergne-Rhône-Alpes',
    '08': 'Grand Est',
    '09': 'Occitanie',
    '10': 'Grand Est',
    '11': 'Occitanie',
    '12': 'Occitanie',
    '13': "Provence-Alpes-Côte d'Azur",
    '14': 'Normandie',
    '15': 'Auvergne-Rhône-Alpes',
    '16': 'Nouvelle-Aquitaine',
    '17': 'Nouvelle-Aquitaine',
    '18': 'Centre-Val de Loire',
    '19': 'Nouvelle-Aquitaine',
    '21': 'Bourgogne-Franche-Comté',
    '22': 'Bretagne',
    '23': 'Nouvelle-Aquitaine',
    '24': 'Nouvelle-Aquitaine',
    '25': 'Bourgogne-Franche-Comté',
    '26': 'Auvergne-Rhône-Alpes',
    '27': 'Normandie',
    '28': 'Centre-Val de Loire',
    '29': 'Bretagne',
    '2A': 'Corse',
    '2B': 'Corse',
    '30': 'Occitanie',
    '31': 'Occitanie',
    '32': 'Occitanie',
    '33': 'Nouvelle-Aquitaine',
    '34': 'Occitanie',
    '35': 'Bretagne',
    '36': 'Centre-Val de Loire',
    '37': 'Centre-Val de Loire',
    '38': 'Auvergne-Rhône-Alpes',
    '39': 'Bourgogne-Franche-Comté',
    '40': 'Nouvelle-Aquitaine',
    '41': 'Centre-Val de Loire',
    '42': 'Auvergne-Rhône-Alpes',
    '43': 'Auvergne-Rhône-Alpes',
    '44': 'Pays de la Loire',
    '45': 'Centre-Val de Loire',
    '46': 'Occitanie',
    '47': 'Nouvelle-Aquitaine',
    '48': 'Occitanie',
    '49': 'Pays de la Loire',
    '50': 'Normandie',
    '51': 'Grand Est',
    '52': 'Grand Est',
    '53': 'Pays de la Loire',
    '54': 'Grand Est',
    '55': 'Grand Est',
    '56': 'Bretagne',
    '57': 'Grand Est',
    '58': 'Bourgogne-Franche-Comté',
    '59': 'Hauts-de-France',
    '60': 'Hauts-de-France',
    '61': 'Normandie',
    '62': 'Hauts-de-France',
    '63': 'Auvergne-Rhône-Alpes',
    '64': 'Nouvelle-Aquitaine',
    '65': 'Occitanie',
    '66': 'Occitanie',
    '67': 'Grand Est',
    '68': 'Grand Est',
    '69': 'Auvergne-Rhône-Alpes',
    '70': 'Bourgogne-Franche-Comté',
    '71': 'Bourgogne-Franche-Comté',
    '72': 'Pays de la Loire',
    '73': 'Auvergne-Rhône-Alpes',
    '74': 'Auvergne-Rhône-Alpes',
    '75': 'Île-de-France',
    '76': 'Normandie',
    '77': 'Île-de-France',
    '78': 'Île-de-France',
    '79': 'Nouvelle-Aquitaine',
    '80': 'Hauts-de-France',
    '81': 'Occitanie',
    '82': 'Occitanie',
    '83': "Provence-Alpes-Côte d'Azur",
    '84': "Provence-Alpes-Côte d'Azur",
    '85': 'Pays de la Loire',
    '86': 'Nouvelle-Aquitaine',
    '87': 'Nouvelle-Aquitaine',
    '88': 'Grand Est',
    '89': 'Bourgogne-Franche-Comté',
    '90': 'Bourgogne-Franche-Comté',
    '91': 'Île-de-France',
    '92': 'Île-de-France',
    '93': 'Île-de-France',
    '94': 'Île-de-France',
    '95': 'Île-de-France',
    '971': 'Guadeloupe',
    '972': 'Martinique',
    '973': 'Guyane',
    '974': 'La Réunion',
    '976': 'Mayotte',
  };

  // ============================================
  // MÉTHODE: searchCities
  // ============================================

  /**
   * Recherche des villes françaises via l'API Adresse Etalab.
   *
   * FONCTIONNEMENT:
   * 1. Vérifier le cache mémoire
   * 2. Si cache valide, retourner les données en cache
   * 3. Sinon, appeler l'API Etalab
   * 4. Normaliser les résultats
   * 5. Mettre en cache
   * 6. Retourner les suggestions
   *
   * @param query - Terme de recherche (ex: "Paris", "Lyon 69")
   * @param limit - Nombre maximum de résultats (défaut: 10)
   * @returns Liste de suggestions de villes normalisées
   */
  async searchCities(query: string, limit: number = 10): Promise<CitySuggestion[]> {
    // Normaliser la query pour le cache (lowercase, trim)
    const cacheKey = `${query.toLowerCase().trim()}_${limit}`;

    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for query: ${query}`);
      return cached.data;
    }

    try {
      // Construire l'URL de l'API
      const params = new URLSearchParams({
        q: query,
        type: 'municipality', // Seulement les communes
        limit: String(limit),
        autocomplete: '1', // Mode autocomplétion
      });

      const url = `${this.ETALAB_API_URL}?${params.toString()}`;
      this.logger.debug(`Fetching cities from Etalab API: ${url}`);

      // Appeler l'API avec fetch (natif Node.js 18+)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Etalab API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as EtalabApiResponse;

      // Normaliser les résultats
      const suggestions = this.normalizeEtalabResponse(data.features);

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: suggestions,
        timestamp: Date.now(),
      });

      // Nettoyer le cache périodiquement (supprimer les entrées expirées)
      this.cleanupCache();

      return suggestions;
    } catch (error) {
      this.logger.error(`Error fetching cities: ${error.message}`, error.stack);
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  // ============================================
  // MÉTHODE: normalizeEtalabResponse
  // ============================================

  /**
   * Normalise les réponses de l'API Etalab vers notre format CitySuggestion.
   *
   * TRANSFORMATIONS:
   * - Extrait le département depuis le context (ex: "75, Paris, Île-de-France")
   * - Extrait ou calcule la région
   * - Crée un label lisible (ex: "Paris (75000)")
   * - Extrait les coordonnées GPS
   *
   * @param features - Résultats bruts de l'API Etalab
   * @returns Liste de CitySuggestion normalisées
   */
  private normalizeEtalabResponse(features: EtalabFeature[]): CitySuggestion[] {
    return features.map((feature) => {
      const { properties, geometry } = feature;

      // Extraire le département et la région du context
      // Format: "75, Paris, Île-de-France" ou "69, Rhône, Auvergne-Rhône-Alpes"
      const contextParts = properties.context.split(', ');
      const department = contextParts[0] || '';
      const region = contextParts[2] || this.DEPARTMENT_TO_REGION[department] || '';

      // Extraire le premier code postal (peut contenir plusieurs codes séparés par des espaces)
      const postalCode = properties.postcode?.split(' ')[0] || '';

      // Nom de la ville
      const city = properties.city || properties.name;

      // Créer le label d'affichage
      const label = postalCode ? `${city} (${postalCode})` : city;

      // Extraire les coordonnées GPS
      // Note: GeoJSON utilise [longitude, latitude]
      const [longitude, latitude] = geometry.coordinates;

      return {
        label,
        city,
        postalCode,
        department,
        region,
        latitude,
        longitude,
      };
    });
  }

  // ============================================
  // MÉTHODE: cleanupCache
  // ============================================

  /**
   * Nettoie le cache en supprimant les entrées expirées.
   * Appelée périodiquement pour éviter une consommation mémoire excessive.
   */
  private cleanupCache(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.CACHE_TTL_MS) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`Cleaned up ${deletedCount} expired cache entries`);
    }
  }

  // ============================================
  // MÉTHODE: clearCache
  // ============================================

  /**
   * Vide entièrement le cache.
   * Utile pour les tests ou le débogage.
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Retourne les statistiques du cache.
   */
  getCacheStats(): { size: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxAge: this.CACHE_TTL_MS,
    };
  }
}

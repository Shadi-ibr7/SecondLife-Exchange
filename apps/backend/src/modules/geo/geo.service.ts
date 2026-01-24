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
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * SERVICE: GeoService
 *
 * Service principal pour les opérations géospatiales.
 */
@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  // ============================================
  // MÉTHODES: Régions et Départements depuis DB
  // ============================================

  /**
   * Récupère la liste des régions uniques présentes dans les items de la DB.
   * Utilisé pour le filtre "Région" sur la page Explorer.
   *
   * @returns Liste des régions triées alphabétiquement
   */
  async getRegionsFromDB(): Promise<string[]> {
    try {
      const results = await this.prisma.item.findMany({
        where: {
          region: { not: null },
        },
        select: {
          region: true,
        },
        distinct: ['region'],
      });

      const regions = results
        .map((r) => r.region)
        .filter((r): r is string => r !== null)
        .sort((a, b) => a.localeCompare(b, 'fr'));

      return regions;
    } catch (error) {
      this.logger.error(`Error fetching regions from DB: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère la liste des départements uniques présents dans les items de la DB.
   * Peut être filtré par région.
   *
   * @param region - Optionnel: filtrer par région
   * @returns Liste des départements triés
   */
  async getDepartmentsFromDB(region?: string): Promise<{ code: string; name: string }[]> {
    try {
      const whereClause: any = {
        department: { not: null },
      };

      if (region) {
        whereClause.region = region;
      }

      const results = await this.prisma.item.findMany({
        where: whereClause,
        select: {
          department: true,
          region: true,
        },
        distinct: ['department'],
      });

      // Créer la liste des départements avec leur nom
      const departmentMap = new Map<string, string>();

      results.forEach((r) => {
        if (r.department) {
          // Utiliser le mapping pour obtenir le nom de la région comme proxy du nom du département
          // En réalité, on pourrait avoir un mapping département -> nom complet
          departmentMap.set(r.department, this.getDepartmentName(r.department));
        }
      });

      const departments = Array.from(departmentMap.entries())
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.code.localeCompare(b.code, 'fr'));

      return departments;
    } catch (error) {
      this.logger.error(`Error fetching departments from DB: ${error.message}`);
      return [];
    }
  }

  /**
   * Retourne le nom complet d'un département à partir de son code.
   */
  private getDepartmentName(code: string): string {
    const DEPARTMENT_NAMES: Record<string, string> = {
      '01': 'Ain',
      '02': 'Aisne',
      '03': 'Allier',
      '04': 'Alpes-de-Haute-Provence',
      '05': 'Hautes-Alpes',
      '06': 'Alpes-Maritimes',
      '07': 'Ardèche',
      '08': 'Ardennes',
      '09': 'Ariège',
      '10': 'Aube',
      '11': 'Aude',
      '12': 'Aveyron',
      '13': 'Bouches-du-Rhône',
      '14': 'Calvados',
      '15': 'Cantal',
      '16': 'Charente',
      '17': 'Charente-Maritime',
      '18': 'Cher',
      '19': 'Corrèze',
      '21': 'Côte-d\'Or',
      '22': 'Côtes-d\'Armor',
      '23': 'Creuse',
      '24': 'Dordogne',
      '25': 'Doubs',
      '26': 'Drôme',
      '27': 'Eure',
      '28': 'Eure-et-Loir',
      '29': 'Finistère',
      '2A': 'Corse-du-Sud',
      '2B': 'Haute-Corse',
      '30': 'Gard',
      '31': 'Haute-Garonne',
      '32': 'Gers',
      '33': 'Gironde',
      '34': 'Hérault',
      '35': 'Ille-et-Vilaine',
      '36': 'Indre',
      '37': 'Indre-et-Loire',
      '38': 'Isère',
      '39': 'Jura',
      '40': 'Landes',
      '41': 'Loir-et-Cher',
      '42': 'Loire',
      '43': 'Haute-Loire',
      '44': 'Loire-Atlantique',
      '45': 'Loiret',
      '46': 'Lot',
      '47': 'Lot-et-Garonne',
      '48': 'Lozère',
      '49': 'Maine-et-Loire',
      '50': 'Manche',
      '51': 'Marne',
      '52': 'Haute-Marne',
      '53': 'Mayenne',
      '54': 'Meurthe-et-Moselle',
      '55': 'Meuse',
      '56': 'Morbihan',
      '57': 'Moselle',
      '58': 'Nièvre',
      '59': 'Nord',
      '60': 'Oise',
      '61': 'Orne',
      '62': 'Pas-de-Calais',
      '63': 'Puy-de-Dôme',
      '64': 'Pyrénées-Atlantiques',
      '65': 'Hautes-Pyrénées',
      '66': 'Pyrénées-Orientales',
      '67': 'Bas-Rhin',
      '68': 'Haut-Rhin',
      '69': 'Rhône',
      '70': 'Haute-Saône',
      '71': 'Saône-et-Loire',
      '72': 'Sarthe',
      '73': 'Savoie',
      '74': 'Haute-Savoie',
      '75': 'Paris',
      '76': 'Seine-Maritime',
      '77': 'Seine-et-Marne',
      '78': 'Yvelines',
      '79': 'Deux-Sèvres',
      '80': 'Somme',
      '81': 'Tarn',
      '82': 'Tarn-et-Garonne',
      '83': 'Var',
      '84': 'Vaucluse',
      '85': 'Vendée',
      '86': 'Vienne',
      '87': 'Haute-Vienne',
      '88': 'Vosges',
      '89': 'Yonne',
      '90': 'Territoire de Belfort',
      '91': 'Essonne',
      '92': 'Hauts-de-Seine',
      '93': 'Seine-Saint-Denis',
      '94': 'Val-de-Marne',
      '95': 'Val-d\'Oise',
      '971': 'Guadeloupe',
      '972': 'Martinique',
      '973': 'Guyane',
      '974': 'La Réunion',
      '976': 'Mayotte',
    };

    return DEPARTMENT_NAMES[code] || code;
  }

  /**
   * Retourne toutes les régions françaises (statique, pour les selects).
   */
  getAllRegions(): string[] {
    return [
      'Auvergne-Rhône-Alpes',
      'Bourgogne-Franche-Comté',
      'Bretagne',
      'Centre-Val de Loire',
      'Corse',
      'Grand Est',
      'Guadeloupe',
      'Guyane',
      'Hauts-de-France',
      'Île-de-France',
      'La Réunion',
      'Martinique',
      'Mayotte',
      'Normandie',
      'Nouvelle-Aquitaine',
      'Occitanie',
      'Pays de la Loire',
      "Provence-Alpes-Côte d'Azur",
    ];
  }

  /**
   * Retourne tous les départements d'une région (statique).
   */
  getDepartmentsByRegion(region: string): { code: string; name: string }[] {
    const regionToDepartments: Record<string, string[]> = {
      'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
      'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
      'Bretagne': ['22', '29', '35', '56'],
      'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
      'Corse': ['2A', '2B'],
      'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
      'Guadeloupe': ['971'],
      'Guyane': ['973'],
      'Hauts-de-France': ['02', '59', '60', '62', '80'],
      'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
      'La Réunion': ['974'],
      'Martinique': ['972'],
      'Mayotte': ['976'],
      'Normandie': ['14', '27', '50', '61', '76'],
      'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
      'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
      'Pays de la Loire': ['44', '49', '53', '72', '85'],
      "Provence-Alpes-Côte d'Azur": ['04', '05', '06', '13', '83', '84'],
    };

    const codes = regionToDepartments[region] || [];
    return codes.map((code) => ({
      code,
      name: this.getDepartmentName(code),
    }));
  }
}

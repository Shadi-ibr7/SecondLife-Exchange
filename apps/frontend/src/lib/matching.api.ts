/**
 * FICHIER: lib/matching.api.ts
 *
 * DESCRIPTION:
 * Module API pour gérer les recommandations d'items personnalisées et les préférences utilisateur.
 * Il encapsule tous les appels HTTP vers les endpoints de matching du backend.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Récupération des recommandations personnalisées
 * - Sauvegarde des préférences utilisateur (catégories, conditions, etc.)
 * - Récupération des préférences utilisateur
 * - Gestion gracieuse des erreurs (ex: utilisateur non authentifié)
 *
 * ARCHITECTURE:
 * - Utilise apiClient pour les appels HTTP
 * - Gestion d'erreurs avec fallback pour les utilisateurs non authentifiés
 * - Types TypeScript stricts pour la sécurité des types
 *
 * UX:
 * - Retourne des valeurs par défaut si l'utilisateur n'est pas authentifié
 * - Ne bloque pas l'application en cas d'erreur réseau
 */

// Import du client API centralisé pour les appels HTTP
import { apiClient } from './api';
// Import des types TypeScript pour garantir la sécurité des types
import {
  RecommendationsResponse,
  GetRecommendationsParams,
  SavePreferencesDto,
  PreferencesResponse,
} from '@/types';

/**
 * OBJET: matchingApi
 *
 * Objet contenant toutes les méthodes pour interagir avec l'API de matching.
 * Toutes les méthodes sont asynchrones et retournent des Promises.
 */
export const matchingApi = {
  /**
   * MÉTHODE: getRecommendations
   *
   * Récupère les recommandations d'items personnalisées pour l'utilisateur connecté.
   * Les recommandations sont calculées côté serveur en fonction des préférences
   * utilisateur, de l'historique d'échanges, et de la popularité des items.
   *
   * FLUX:
   * 1. Appeler l'endpoint GET /matching/recommendations avec les paramètres
   * 2. Le serveur calcule les recommandations personnalisées
   * 3. Retourner la liste des recommandations avec leur score
   *
   * GESTION D'ERREURS:
   * - Si l'utilisateur n'est pas authentifié (401), retourner une liste vide
   * - Sinon, propager l'erreur pour que le composant puisse la gérer
   *
   * @param params - Paramètres optionnels pour filtrer/paginer les recommandations
   * @returns Promise qui se résout avec la liste des recommandations
   */
  async getRecommendations(
    params: GetRecommendationsParams = {}
  ): Promise<RecommendationsResponse> {
    try {
      /**
       * Appeler l'endpoint GET /matching/recommendations
       * apiClient.client.get() fait un appel HTTP GET avec les paramètres de requête
       * Le type générique <RecommendationsResponse> garantit le type de la réponse
       */
      const response = await apiClient.client.get<RecommendationsResponse>(
        '/matching/recommendations',
        { params } // Paramètres de requête (ex: limit, offset, etc.)
      );

      /**
       * Retourner les données de la réponse
       * response.data contient le corps de la réponse HTTP
       */
      return response.data;
    } catch (error: any) {
      /**
       * GESTION D'ERREUR SPÉCIALE: Utilisateur non authentifié
       *
       * Si l'erreur est une 401 (Unauthorized), cela signifie que l'utilisateur
       * n'est pas connecté. Au lieu de bloquer l'application, on retourne
       * une liste vide pour permettre à l'utilisateur de voir la page même
       * s'il n'est pas connecté.
       */
      if (error.response?.status === 401) {
        console.warn("Utilisateur non authentifié, retour d'une liste vide");
        /**
         * Retourner une réponse vide mais valide
         * Cela permet à l'UI de s'afficher sans erreur
         */
        return {
          recommendations: [],
          total: 0,
        };
      }

      /**
       * Pour toutes les autres erreurs (réseau, serveur, etc.),
       * propager l'erreur pour que le composant puisse la gérer
       * (ex: afficher un message d'erreur à l'utilisateur)
       */
      throw error;
    }
  },

  /**
   * MÉTHODE: savePreferences
   *
   * Sauvegarde les préférences de matching de l'utilisateur connecté.
   * Les préférences incluent les catégories préférées/détestées, les conditions
   * préférées, et éventuellement la localisation.
   *
   * FLUX:
   * 1. Appeler l'endpoint POST /matching/preferences avec les préférences
   * 2. Le serveur sauvegarde les préférences dans la base de données
   * 3. Retourner les préférences sauvegardées (avec l'ID utilisateur)
   *
   * @param data - Les préférences à sauvegarder (catégories, conditions, etc.)
   * @returns Promise qui se résout avec les préférences sauvegardées
   */
  async savePreferences(
    data: SavePreferencesDto
  ): Promise<PreferencesResponse> {
    /**
     * Appeler l'endpoint POST /matching/preferences
     * apiClient.client.post() fait un appel HTTP POST avec le corps de la requête
     * Le type générique <PreferencesResponse> garantit le type de la réponse
     */
    const response = await apiClient.client.post<PreferencesResponse>(
      '/matching/preferences',
      data // Corps de la requête (les préférences à sauvegarder)
    );

    /**
     * Retourner les données de la réponse
     * Le serveur retourne les préférences sauvegardées avec l'ID utilisateur
     */
    return response.data;
  },

  /**
   * MÉTHODE: getPreferences
   *
   * Récupère les préférences de matching de l'utilisateur connecté.
   * Si l'utilisateur n'a pas encore configuré de préférences, retourne
   * des préférences par défaut (listes vides).
   *
   * FLUX:
   * 1. Appeler l'endpoint GET /matching/preferences
   * 2. Si les préférences existent, les retourner
   * 3. Si elles n'existent pas (404), retourner des préférences par défaut
   *
   * GESTION D'ERREURS:
   * - Si les préférences n'existent pas (404), retourner des préférences par défaut
   * - Sinon, propager l'erreur pour que le composant puisse la gérer
   *
   * @returns Promise qui se résout avec les préférences utilisateur
   */
  async getPreferences(): Promise<PreferencesResponse> {
    try {
      /**
       * Appeler l'endpoint GET /matching/preferences
       * apiClient.client.get() fait un appel HTTP GET
       * Le type générique <PreferencesResponse> garantit le type de la réponse
       */
      const response = await apiClient.client.get<PreferencesResponse>(
        '/matching/preferences',
        {
          // On évite d'afficher un toast lorsque les préférences n'existent pas encore.
          _skipErrorToast: true,
        } as any
      );

      /**
       * Retourner les données de la réponse
       * response.data contient les préférences de l'utilisateur
       */
      return response.data;
    } catch (error: any) {
      /**
       * GESTION D'ERREUR SPÉCIALE: Préférences non trouvées
       *
       * Si l'erreur est une 404 (Not Found), cela signifie que l'utilisateur
       * n'a pas encore configuré de préférences. Au lieu de bloquer l'application,
       * on retourne des préférences par défaut (listes vides) pour permettre
       * à l'utilisateur de commencer à configurer ses préférences.
       */
      if (error.response?.status === 404) {
        console.warn(
          'Préférences non trouvées, retour de préférences par défaut'
        );
        /**
         * Retourner des préférences par défaut (listes vides)
         * Cela permet à l'UI de s'afficher et à l'utilisateur de configurer ses préférences
         */
        return {
          preferences: {
            userId: '', // ID utilisateur vide (sera rempli lors de la sauvegarde)
            preferredCategories: [], // Aucune catégorie préférée
            dislikedCategories: [], // Aucune catégorie détestée
            preferredConditions: [], // Aucune condition préférée
          },
        };
      }

      /**
       * Pour toutes les autres erreurs (réseau, serveur, etc.),
       * propager l'erreur pour que le composant puisse la gérer
       */
      throw error;
    }
  },
};

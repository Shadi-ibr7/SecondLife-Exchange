import { apiClient } from './api';
import {
  RecommendationsResponse,
  GetRecommendationsParams,
  SavePreferencesDto,
  PreferencesResponse,
} from '@/types';

export const matchingApi = {
  /**
   * Récupère les recommandations d'items personnalisées
   */
  async getRecommendations(
    params: GetRecommendationsParams = {}
  ): Promise<RecommendationsResponse> {
    try {
      const response = await apiClient.client.get<RecommendationsResponse>(
        '/matching/recommendations',
        { params }
      );
      return response.data;
    } catch (error: any) {
      // Si l'utilisateur n'est pas authentifié, retourner une liste vide
      if (error.response?.status === 401) {
        console.warn("Utilisateur non authentifié, retour d'une liste vide");
        return {
          recommendations: [],
          total: 0,
        };
      }
      throw error;
    }
  },

  /**
   * Sauvegarde les préférences de matching
   */
  async savePreferences(
    data: SavePreferencesDto
  ): Promise<PreferencesResponse> {
    const response = await apiClient.client.post<PreferencesResponse>(
      '/matching/preferences',
      data
    );
    return response.data;
  },

  /**
   * Récupère les préférences de matching
   */
  async getPreferences(): Promise<PreferencesResponse> {
    try {
      const response = await apiClient.client.get<PreferencesResponse>(
        '/matching/preferences'
      );
      return response.data;
    } catch (error: any) {
      // Si les préférences n'existent pas, retourner des préférences par défaut
      if (error.response?.status === 404) {
        console.warn(
          'Préférences non trouvées, retour de préférences par défaut'
        );
        return {
          preferences: {
            userId: '',
            preferredCategories: [],
            dislikedCategories: [],
            preferredConditions: [],
          },
        };
      }
      throw error;
    }
  },
};

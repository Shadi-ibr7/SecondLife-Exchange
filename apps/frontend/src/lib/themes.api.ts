import { apiClient } from './api';
import {
  WeeklyTheme,
  SuggestedItem,
  PaginatedResponse,
  ListThemesParams,
  ListSuggestionsParams,
} from '@/types';

export const themesApi = {
  /**
   * Récupère le thème actif
   */
  async getActiveTheme(): Promise<WeeklyTheme> {
    try {
      const response =
        await apiClient.client.get<WeeklyTheme>('/themes/active');
      return response.data;
    } catch (error) {
      // Fallback avec des données mockées si le backend n'est pas disponible
      console.warn('Backend non disponible, utilisation des données mockées');
      return {
        id: 'mock-theme-1',
        title: 'Objets Vintage des Années 80',
        slug: 'vintage-80s',
        startOfWeek: '2024-01-15T00:00:00.000Z',
        impactText:
          'Redécouvrez les objets iconiques des années 80 et donnez-leur une seconde vie !',
        isActive: true,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        suggestions: [
          {
            id: 'mock-suggestion-1',
            themeId: 'mock-theme-1',
            name: 'Walkman Sony',
            category: 'ELECTRONICS',
            country: 'Japon',
            era: '1980s',
            materials: 'Plastique, métal',
            ecoReason:
              'Évite la production de nouveaux appareils électroniques',
            repairDifficulty: 'moyenne',
            popularity: 85,
            tags: ['musique', 'portable', 'rétro'],
            photoRef: undefined,
            aiModel: 'gemini-1.5-pro',
            aiPromptHash: undefined,
            aiRaw: undefined,
            createdAt: '2024-01-15T00:00:00.000Z',
          },
          {
            id: 'mock-suggestion-2',
            themeId: 'mock-theme-1',
            name: 'Veste en Jean Vintage',
            category: 'CLOTHING',
            country: 'États-Unis',
            era: '1980s',
            materials: 'Denim, métal',
            ecoReason: 'Réduit la consommation de vêtements neufs',
            repairDifficulty: 'faible',
            popularity: 90,
            tags: ['mode', 'denim', 'classique'],
            photoRef: undefined,
            aiModel: 'gemini-1.5-pro',
            aiPromptHash: undefined,
            aiRaw: undefined,
            createdAt: '2024-01-15T00:00:00.000Z',
          },
          {
            id: 'mock-suggestion-3',
            themeId: 'mock-theme-1',
            name: 'Polaroid 600',
            category: 'ELECTRONICS',
            country: 'États-Unis',
            era: '1980s',
            materials: 'Plastique, verre',
            ecoReason: 'Réutilise un appareil photo fonctionnel',
            repairDifficulty: 'elevee',
            popularity: 75,
            tags: ['photo', 'instantané', 'rétro'],
            photoRef: undefined,
            aiModel: 'gemini-1.5-pro',
            aiPromptHash: undefined,
            aiRaw: undefined,
            createdAt: '2024-01-15T00:00:00.000Z',
          },
        ],
      };
    }
  },

  /**
   * Liste les thèmes dans une période donnée
   */
  async listThemes(params: ListThemesParams = {}): Promise<WeeklyTheme[]> {
    const response = await apiClient.client.get<WeeklyTheme[]>('/themes', {
      params,
    });
    return response.data;
  },

  /**
   * Récupère les suggestions d'un thème
   */
  async getThemeSuggestions(
    themeId: string,
    params: ListSuggestionsParams = {}
  ): Promise<PaginatedResponse<SuggestedItem>> {
    const response = await apiClient.client.get<
      PaginatedResponse<SuggestedItem>
    >(`/themes/${themeId}/suggestions`, { params });
    return response.data;
  },
};

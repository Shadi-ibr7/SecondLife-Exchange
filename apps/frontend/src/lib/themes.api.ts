import { apiClient } from './api';
import {
  WeeklyTheme,
  SuggestedItem,
  PaginatedResponse,
  ListThemesParams,
  ListSuggestionsParams,
  CalendarResponse,
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
    try {
      const response = await apiClient.client.get<{
        themes: WeeklyTheme[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/themes', {
        params,
      });
      return response.data.themes;
    } catch (error) {
      // Fallback avec des données mockées si le backend n'est pas disponible
      console.warn(
        'Backend non disponible, utilisation des données mockées pour listThemes'
      );
      return [
        {
          id: 'theme-1',
          title: 'Objets Vintage des Années 80',
          slug: 'vintage-80s',
          startOfWeek: '2024-01-15T00:00:00.000Z',
          impactText:
            'Redécouvrez les objets iconiques des années 80 et donnez-leur une seconde vie !',
          isActive: true,
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          suggestions: [],
        },
        {
          id: 'theme-2',
          title: 'Artisanat Local',
          slug: 'artisanat-local',
          startOfWeek: '2024-01-08T00:00:00.000Z',
          impactText:
            "Soutenez l'artisanat local et découvrez des créations uniques !",
          isActive: false,
          createdAt: '2024-01-08T00:00:00.000Z',
          updatedAt: '2024-01-08T00:00:00.000Z',
          suggestions: [],
        },
        {
          id: 'theme-3',
          title: 'Électronique Rétro',
          slug: 'electronique-retro',
          startOfWeek: '2024-01-22T00:00:00.000Z',
          impactText:
            'Donnez une seconde chance aux appareils électroniques vintage !',
          isActive: false,
          createdAt: '2024-01-22T00:00:00.000Z',
          updatedAt: '2024-01-22T00:00:00.000Z',
          suggestions: [],
        },
      ];
    }
  },

  /**
   * Récupère les suggestions d'un thème
   */
  async getThemeSuggestions(
    themeId: string,
    params: ListSuggestionsParams = {}
  ): Promise<PaginatedResponse<SuggestedItem>> {
    try {
      const response = await apiClient.client.get<
        PaginatedResponse<SuggestedItem>
      >(`/themes/${themeId}/suggestions`, { params });
      return response.data;
    } catch (error) {
      // Fallback avec des données mockées si le backend n'est pas disponible
      console.warn(
        'Backend non disponible, utilisation des données mockées pour getThemeSuggestions'
      );
      return {
        items: [
          {
            id: 'suggestion-1',
            themeId: themeId,
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
            id: 'suggestion-2',
            themeId: themeId,
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
            id: 'suggestion-3',
            themeId: themeId,
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
        total: 3,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  },

  /**
   * Récupère les 4 semaines du mois actuel
   */
  async getMonthCalendar(month?: string): Promise<CalendarResponse> {
    try {
      const url = month
        ? `/themes/calendar/month?month=${month}`
        : '/themes/calendar/month';
      const response = await apiClient.client.get<CalendarResponse>(url);
      return response.data;
    } catch (error) {
      console.warn(
        'Backend non disponible, utilisation des données mockées pour le calendrier mensuel'
      );
      // Fallback avec données mockées
      const now = new Date();
      const year = month ? parseInt(month.split('-')[0]) : now.getFullYear();
      const monthIndex = month
        ? parseInt(month.split('-')[1]) - 1
        : now.getMonth();

      const firstDay = new Date(year, monthIndex, 1);
      let firstMonday = new Date(firstDay);
      const dayOfWeek = firstMonday.getDay();
      const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
      firstMonday.setDate(firstDay.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));

      const weeks = [];
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + week * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        weeks.push({
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          title: week === 0 ? 'Thème à venir' : 'Thème à venir',
          isActive: false,
          themeId: null,
          theme: null,
        });
      }

      return {
        weeks,
        totalWeeks: 4,
        currentWeek: -1,
      };
    }
  },

  /**
   * Récupère le calendrier des thèmes
   */
  async getCalendar(weeks: number = 12): Promise<CalendarResponse> {
    try {
      const response = await apiClient.client.get<CalendarResponse>(
        `/themes/calendar?weeks=${weeks}`
      );
      return response.data;
    } catch (error) {
      // Fallback avec des données mockées si le backend n'est pas disponible
      console.warn(
        'Backend non disponible, utilisation des données mockées pour le calendrier'
      );

      const now = new Date();
      const weeks = [];

      // Générer 12 semaines (3 passées, 8 futures)
      for (let i = -3; i < 9; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + i * 7);

        // S'assurer que c'est un lundi
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + daysToMonday);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        weeks.push({
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          title: i === 0 ? 'Objets Vintage des Années 80' : 'Aucun thème',
          isActive: i === 0,
          themeId: i === 0 ? 'mock-theme-1' : null,
          theme:
            i === 0
              ? {
                  id: 'mock-theme-1',
                  title: 'Objets Vintage des Années 80',
                  description: 'Redécouvrez les objets iconiques des années 80',
                  startOfWeek: weekStart.toISOString(),
                  slug: 'vintage-80s',
                }
              : null,
        });
      }

      return {
        weeks,
        totalWeeks: 12,
        currentWeek: 3,
      };
    }
  },
};

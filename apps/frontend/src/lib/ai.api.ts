/**
 * FICHIER: ai.api.ts
 *
 * DESCRIPTION:
 * Module API pour les fonctionnalités IA.
 * Encapsule les appels HTTP vers les endpoints IA du backend.
 */

import { apiClient } from './api';

/**
 * Interface pour la requête de suggestion IA
 */
export interface AiItemSuggestRequest {
  title: string;
  description: string;
  imageUrls?: string[];
}

/**
 * Interface pour les infos de quota
 */
export interface QuotaInfo {
  used: number;
  max: number;
  remaining: number;
  resetAt: string;
}

/**
 * Interface pour la réponse de suggestion IA
 */
export interface AiItemSuggestResponse {
  category: string;
  tags: string[];
  summary: string;
  quota: QuotaInfo;
}

/**
 * Erreur spécifique pour le quota dépassé
 */
export class QuotaExceededError extends Error {
  public quota: QuotaInfo;

  constructor(message: string, quota: QuotaInfo) {
    super(message);
    this.name = 'QuotaExceededError';
    this.quota = quota;
  }
}

/**
 * Erreur spécifique pour le service IA indisponible
 */
export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

/**
 * API pour les fonctionnalités IA
 */
export const aiApi = {
  /**
   * Suggère automatiquement category, tags et summary pour un item.
   *
   * @param data - Titre, description et optionnellement URLs des images
   * @returns Suggestions IA + infos quota
   * @throws QuotaExceededError si quota atteint (429)
   * @throws AiServiceError si service IA indisponible (502)
   * @throws Error pour autres erreurs
   */
  async suggestItemFields(
    data: AiItemSuggestRequest
  ): Promise<AiItemSuggestResponse> {
    try {
      const response = await apiClient.client.post<AiItemSuggestResponse>(
        '/ai/items/suggest',
        data
      );
      return response.data;
    } catch (error: any) {
      // Gérer les erreurs spécifiques
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        throw new QuotaExceededError(
          errorData.message || 'Quota journalier atteint',
          errorData.quota || { used: 3, max: 3, remaining: 0, resetAt: '' }
        );
      }

      if (error.response?.status === 502) {
        throw new AiServiceError(
          error.response.data?.message ||
            "Le service IA est temporairement indisponible"
        );
      }

      if (error.response?.status === 401) {
        throw new Error('Authentification requise');
      }

      // Autres erreurs
      throw new Error(
        error.response?.data?.message ||
          'Une erreur est survenue lors de la génération IA'
      );
    }
  },
};

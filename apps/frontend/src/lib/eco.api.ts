import { apiClient } from './api';
import {
  EcoContent,
  PaginatedEcoContentResponse,
  ListEcoContentParams,
  CreateEcoContentDto,
  UpdateEcoContentDto,
  EnrichEcoContentResponse,
  EcoContentStats,
} from '@/types';

export const ecoApi = {
  /**
   * Liste les contenus éco-éducatifs
   */
  async listEcoContent(
    params: ListEcoContentParams = {}
  ): Promise<PaginatedEcoContentResponse> {
    const response = await apiClient.client.get<PaginatedEcoContentResponse>(
      '/eco',
      { params }
    );
    return response.data;
  },

  /**
   * Récupère un contenu éco par ID
   */
  async getEcoContent(id: string): Promise<EcoContent> {
    const response = await apiClient.client.get<EcoContent>(`/eco/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau contenu éco (Admin)
   */
  async createEcoContent(data: CreateEcoContentDto): Promise<EcoContent> {
    const response = await apiClient.client.post<EcoContent>('/eco', data);
    return response.data;
  },

  /**
   * Met à jour un contenu éco (Admin)
   */
  async updateEcoContent(
    id: string,
    data: UpdateEcoContentDto
  ): Promise<EcoContent> {
    const response = await apiClient.client.patch<EcoContent>(
      `/eco/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Supprime un contenu éco (Admin)
   */
  async deleteEcoContent(id: string): Promise<void> {
    await apiClient.client.delete(`/eco/${id}`);
  },

  /**
   * Enrichit un contenu éco avec Gemini (Admin)
   */
  async enrichEcoContent(id: string): Promise<EnrichEcoContentResponse> {
    const response = await apiClient.client.post<EnrichEcoContentResponse>(
      `/eco/${id}/enrich`
    );
    return response.data;
  },

  /**
   * Récupère les statistiques des contenus éco
   */
  async getEcoContentStats(): Promise<EcoContentStats> {
    const response = await apiClient.client.get<EcoContentStats>('/eco/stats');
    return response.data;
  },

  /**
   * Récupère les tags populaires
   */
  async getPopularTags(limit?: number): Promise<string[]> {
    const response = await apiClient.client.get<string[]>('/eco/tags', {
      params: { limit },
    });
    return response.data;
  },
};

import { apiClient } from './api';
import {
  Exchange,
  PaginatedResponse,
  ListExchangesParams,
  CreateExchangeDto,
  UpdateExchangeStatusDto,
} from '@/types';

export const exchangesApi = {
  /**
   * Liste mes échanges avec filtres et pagination
   */
  async listMyExchanges(
    params: ListExchangesParams = {}
  ): Promise<PaginatedResponse<Exchange>> {
    try {
      const response = await apiClient.client.get<PaginatedResponse<Exchange>>(
        '/exchanges/me',
        { params }
      );
      return response.data;
    } catch (error: any) {
      // Si l'utilisateur n'est pas authentifié, retourner une liste vide
      if (error.response?.status === 401) {
        console.warn("Utilisateur non authentifié, retour d'une liste vide");
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };
      }
      throw error;
    }
  },

  /**
   * Récupère un échange par son ID
   */
  async getExchange(id: string): Promise<Exchange> {
    try {
      const response = await apiClient.client.get<Exchange>(`/exchanges/${id}`);
      return response.data;
    } catch (error: any) {
      // Si l'utilisateur n'est pas authentifié, lancer l'erreur
      if (error.response?.status === 401) {
        throw new Error('Authentification requise pour voir cet échange');
      }
      throw error;
    }
  },

  /**
   * Crée un nouvel échange
   */
  async createExchange(data: CreateExchangeDto): Promise<Exchange> {
    const response = await apiClient.client.post<Exchange>('/exchanges', data);
    return response.data;
  },

  /**
   * Met à jour le statut d'un échange
   */
  async updateExchangeStatus(
    id: string,
    data: UpdateExchangeStatusDto
  ): Promise<Exchange> {
    const response = await apiClient.client.patch<Exchange>(
      `/exchanges/${id}/status`,
      data
    );
    return response.data;
  },
};

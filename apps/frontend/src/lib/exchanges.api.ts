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
    const response = await apiClient.client.get<PaginatedResponse<Exchange>>(
      '/exchanges/me',
      { params }
    );
    return response.data;
  },

  /**
   * Récupère un échange par son ID
   */
  async getExchange(id: string): Promise<Exchange> {
    const response = await apiClient.client.get<Exchange>(`/exchanges/${id}`);
    return response.data;
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

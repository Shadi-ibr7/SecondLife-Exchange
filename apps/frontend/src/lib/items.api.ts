import apiClient from './api';
import {
  Item,
  CreateItemDto,
  UpdateItemDto,
  ListItemsParams,
  PaginatedResponse,
  PhotoMeta,
} from '@/types';

export const itemsApi = {
  /**
   * Liste les items avec filtres et pagination
   */
  async listItems(
    params: ListItemsParams = {}
  ): Promise<PaginatedResponse<Item>> {
    const response = await apiClient.client.get('/items', { params });
    return response.data;
  },

  /**
   * Récupère un item par son ID
   */
  async getItem(id: string): Promise<Item> {
    const response = await apiClient.client.get(`/items/${id}`);
    return response.data;
  },

  /**
   * Crée un nouvel item
   */
  async createItem(data: CreateItemDto): Promise<Item> {
    const response = await apiClient.client.post('/items', data);
    return response.data;
  },

  /**
   * Met à jour un item existant
   */
  async updateItem(id: string, data: UpdateItemDto): Promise<Item> {
    const response = await apiClient.client.patch(`/items/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un item
   */
  async deleteItem(id: string): Promise<void> {
    await apiClient.client.delete(`/items/${id}`);
  },

  /**
   * Attache des photos à un item
   */
  async attachPhotos(itemId: string, photos: PhotoMeta[]): Promise<void> {
    await apiClient.client.post(`/items/${itemId}/photos`, { photos });
  },
};

/**
 * FICHIER: items.api.ts
 *
 * DESCRIPTION:
 * Ce fichier contient les fonctions API spécialisées pour les items (objets).
 * Il encapsule les appels HTTP vers les endpoints d'items du backend.
 *
 * FONCTIONNALITÉS:
 * - Liste paginée d'items avec filtres
 * - Récupération d'un item par ID
 * - Création d'un nouvel item
 * - Mise à jour d'un item existant
 * - Suppression d'un item
 * - Attachement de photos à un item
 *
 * AVANTAGES:
 * - Encapsulation des appels API
 * - Typage TypeScript strict
 * - Réutilisabilité dans toute l'application
 * - Facilite les tests et la maintenance
 */

// Import du client API principal
import apiClient from './api';

// Import des types
import {
  Item,
  CreateItemDto,
  UpdateItemDto,
  ListItemsParams,
  PaginatedResponse,
  PhotoMeta,
} from '@/types';

/**
 * OBJET: itemsApi
 *
 * API spécialisée pour les opérations sur les items.
 * Toutes les méthodes utilisent le client API principal (apiClient).
 */
export const itemsApi = {
  /**
   * Liste les items avec filtres et pagination.
   *
   * @param params - Paramètres de filtrage et pagination
   * @returns Liste paginée d'items
   */
  async listItems(
    params: ListItemsParams = {}
  ): Promise<PaginatedResponse<Item>> {
    const response = await apiClient.client.get('/items', { params });
    return response.data;
  },

  /**
   * Récupère un item par son ID.
   *
   * @param id - ID de l'item
   * @returns Détails de l'item
   */
  async getItem(id: string): Promise<Item> {
    const response = await apiClient.client.get(`/items/${id}`);
    return response.data;
  },

  /**
   * Crée un nouvel item.
   *
   * @param data - Données de l'item à créer
   * @returns Item créé
   */
  async createItem(data: CreateItemDto): Promise<Item> {
    const response = await apiClient.client.post('/items', data);
    return response.data;
  },

  /**
   * Met à jour un item existant.
   *
   * @param id - ID de l'item à mettre à jour
   * @param data - Données à mettre à jour (mise à jour partielle)
   * @returns Item mis à jour
   */
  async updateItem(id: string, data: UpdateItemDto): Promise<Item> {
    const response = await apiClient.client.patch(`/items/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un item.
   *
   * @param id - ID de l'item à supprimer
   */
  async deleteItem(id: string): Promise<void> {
    await apiClient.client.delete(`/items/${id}`);
  },

  /**
   * Attache des photos à un item.
   *
   * @param itemId - ID de l'item
   * @param photos - Métadonnées des photos à attacher
   */
  async attachPhotos(itemId: string, photos: PhotoMeta[]): Promise<void> {
    await apiClient.client.post(`/items/${itemId}/photos`, { photos });
  },
};

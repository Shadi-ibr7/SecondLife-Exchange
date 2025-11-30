/**
 * FICHIER: lib/items.api.ts
 *
 * DESCRIPTION:
 * Module API pour gérer les items (objets) dans l'application.
 * Il encapsule tous les appels HTTP vers les endpoints d'items du backend.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Liste paginée d'items avec filtres (recherche, catégorie, condition, statut, tri)
 * - Récupération d'un item par son ID avec tous ses détails
 * - Création d'un nouvel item (titre, description, catégorie, condition, tags, etc.)
 * - Mise à jour d'un item existant (mise à jour partielle)
 * - Suppression d'un item (avec cascade des photos)
 * - Attachement de photos à un item (après upload vers Cloudinary)
 *
 * ARCHITECTURE:
 * - Utilise apiClient pour les appels HTTP
 * - Types TypeScript stricts pour la sécurité des types
 * - Méthodes asynchrones retournant des Promises
 *
 * SÉCURITÉ:
 * - Toutes les opérations nécessitent une authentification JWT
 * - Seul le propriétaire peut modifier/supprimer son item
 * - Validation des données côté serveur
 */

// Import du client API centralisé pour les appels HTTP
import apiClient from './api';

// Import des types TypeScript pour garantir la sécurité des types
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
 * Objet contenant toutes les méthodes pour interagir avec l'API d'items.
 * Toutes les méthodes sont asynchrones et retournent des Promises.
 */
export const itemsApi = {
  /**
   * MÉTHODE: listItems
   *
   * Liste les items avec filtres et pagination.
   * Permet de rechercher, filtrer par catégorie/condition/statut, et trier les résultats.
   *
   * FLUX:
   * 1. Appeler l'endpoint GET /items avec les paramètres de filtrage
   * 2. Le serveur filtre, trie et pagine les items
   * 3. Retourner la liste paginée d'items
   *
   * PARAMÈTRES SUPPORTÉS:
   * - q: recherche textuelle (titre, description, tags)
   * - category: filtre par catégorie
   * - condition: filtre par condition
   * - status: filtre par statut (AVAILABLE, RESERVED, etc.)
   * - sort: tri (ex: '-createdAt', 'popularity', etc.)
   * - page: numéro de page (défaut: 1)
   * - limit: nombre d'items par page (défaut: 20)
   *
   * @param params - Paramètres de filtrage et pagination (optionnels)
   * @returns Promise qui se résout avec la liste paginée d'items
   */
  async listItems(
    params: ListItemsParams = {}
  ): Promise<PaginatedResponse<Item>> {
    /**
     * Appeler l'endpoint GET /items
     * apiClient.client.get() fait un appel HTTP GET avec les paramètres de requête
     * Le type générique <PaginatedResponse<Item>> garantit le type de la réponse
     */
    const response = await apiClient.client.get('/items', { params });

    /**
     * Retourner les données de la réponse
     * response.data contient la liste paginée avec:
     * - items: tableau d'items
     * - total: nombre total d'items correspondant aux filtres
     * - page: numéro de page actuel
     * - limit: nombre d'items par page
     * - totalPages: nombre total de pages
     */
    return response.data;
  },

  /**
   * MÉTHODE: getItem
   *
   * Récupère un item par son ID avec tous ses détails.
   * Inclut les photos, le propriétaire, l'analyse AI, etc.
   *
   * FLUX:
   * 1. Appeler l'endpoint GET /items/:id
   * 2. Le serveur retourne l'item avec toutes ses relations
   * 3. Retourner l'item complet
   *
   * @param id - ID unique de l'item à récupérer
   * @returns Promise qui se résout avec les détails de l'item
   */
  async getItem(id: string): Promise<Item> {
    /**
     * Appeler l'endpoint GET /items/:id
     * apiClient.client.get() fait un appel HTTP GET
     * Le type générique <Item> garantit le type de la réponse
     */
    const response = await apiClient.client.get(`/items/${id}`);

    /**
     * Retourner les données de la réponse
     * response.data contient l'item avec toutes ses propriétés:
     * - Informations de base (titre, description, catégorie, etc.)
     * - Photos (tableau d'URLs)
     * - Propriétaire (informations utilisateur)
     * - Analyse AI (si disponible)
     * - Tags, popularité, etc.
     */
    return response.data;
  },

  /**
   * MÉTHODE: createItem
   *
   * Crée un nouvel item dans la base de données.
   * L'item est associé automatiquement à l'utilisateur connecté (propriétaire).
   *
   * FLUX:
   * 1. Appeler l'endpoint POST /items avec les données de l'item
   * 2. Le serveur valide les données et crée l'item
   * 3. Retourner l'item créé avec son ID généré
   *
   * DONNÉES REQUISES:
   * - title: titre de l'item (obligatoire)
   * - description: description de l'item (obligatoire)
   * - category: catégorie de l'item (obligatoire)
   * - condition: condition de l'item (obligatoire)
   * - tags: tags optionnels pour la recherche
   *
   * @param data - Données de l'item à créer (CreateItemDto)
   * @returns Promise qui se résout avec l'item créé (avec ID généré)
   */
  async createItem(data: CreateItemDto): Promise<Item> {
    /**
     * Appeler l'endpoint POST /items
     * apiClient.client.post() fait un appel HTTP POST avec le corps de la requête
     * Le type générique <Item> garantit le type de la réponse
     */
    const response = await apiClient.client.post('/items', data);

    /**
     * Retourner les données de la réponse
     * Le serveur retourne l'item créé avec:
     * - L'ID généré automatiquement
     * - Les dates de création
     * - Le propriétaire (utilisateur connecté)
     * - Les valeurs par défaut (statut AVAILABLE, etc.)
     */
    return response.data;
  },

  /**
   * MÉTHODE: updateItem
   *
   * Met à jour un item existant (mise à jour partielle).
   * Seul le propriétaire de l'item peut le modifier.
   *
   * FLUX:
   * 1. Appeler l'endpoint PATCH /items/:id avec les données à mettre à jour
   * 2. Le serveur valide les données et met à jour l'item
   * 3. Retourner l'item mis à jour
   *
   * MISE À JOUR PARTIELLE:
   * - Seules les propriétés fournies dans data sont mises à jour
   * - Les autres propriétés restent inchangées
   * - Exemple: { title: 'Nouveau titre' } met à jour seulement le titre
   *
   * @param id - ID de l'item à mettre à jour
   * @param data - Données à mettre à jour (mise à jour partielle, UpdateItemDto)
   * @returns Promise qui se résout avec l'item mis à jour
   */
  async updateItem(id: string, data: UpdateItemDto): Promise<Item> {
    /**
     * Appeler l'endpoint PATCH /items/:id
     * apiClient.client.patch() fait un appel HTTP PATCH avec le corps de la requête
     * PATCH est utilisé pour les mises à jour partielles (contrairement à PUT qui remplace tout)
     * Le type générique <Item> garantit le type de la réponse
     */
    const response = await apiClient.client.patch(`/items/${id}`, data);

    /**
     * Retourner les données de la réponse
     * Le serveur retourne l'item mis à jour avec toutes ses propriétés
     */
    return response.data;
  },

  /**
   * MÉTHODE: deleteItem
   *
   * Supprime un item de la base de données.
   * Seul le propriétaire de l'item peut le supprimer.
   * La suppression est en cascade: les photos associées sont aussi supprimées.
   *
   * FLUX:
   * 1. Appeler l'endpoint DELETE /items/:id
   * 2. Le serveur supprime l'item et ses photos (cascade)
   * 3. Retourner void (pas de données retournées)
   *
   * ATTENTION:
   * - Cette action est irréversible
   * - Toutes les photos associées sont supprimées de Cloudinary
   * - Les échanges liés à cet item peuvent être affectés
   *
   * @param id - ID de l'item à supprimer
   * @returns Promise qui se résout quand la suppression est terminée
   */
  async deleteItem(id: string): Promise<void> {
    /**
     * Appeler l'endpoint DELETE /items/:id
     * apiClient.client.delete() fait un appel HTTP DELETE
     * Pas de corps de requête nécessaire pour une suppression
     * La Promise se résout quand la suppression est terminée
     */
    await apiClient.client.delete(`/items/${id}`);
  },

  /**
   * MÉTHODE: attachPhotos
   *
   * Attache des photos à un item existant.
   * Les photos doivent avoir été uploadées vers Cloudinary au préalable.
   * Cette méthode enregistre les métadonnées des photos dans la base de données.
   *
   * FLUX:
   * 1. Les photos sont uploadées vers Cloudinary (via uploadApi)
   * 2. Appeler l'endpoint POST /items/:id/photos avec les métadonnées
   * 3. Le serveur enregistre les photos dans la base de données
   * 4. Retourner void (pas de données retournées)
   *
   * MÉTADONNÉES REQUISES:
   * - url: URL HTTPS de la photo sur Cloudinary
   * - publicId: ID public Cloudinary (pour suppression/modification)
   * - width: largeur de l'image en pixels
   * - height: hauteur de l'image en pixels
   *
   * @param itemId - ID de l'item auquel attacher les photos
   * @param photos - Tableau des métadonnées des photos à attacher (PhotoMeta[])
   * @returns Promise qui se résout quand les photos sont attachées
   */
  async attachPhotos(itemId: string, photos: PhotoMeta[]): Promise<void> {
    /**
     * Appeler l'endpoint POST /items/:id/photos
     * apiClient.client.post() fait un appel HTTP POST avec le corps de la requête
     * Le corps contient un objet avec le tableau de photos
     */
    await apiClient.client.post(`/items/${itemId}/photos`, { photos });
  },
};

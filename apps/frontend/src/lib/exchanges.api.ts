/**
 * FICHIER: lib/exchanges.api.ts
 *
 * DESCRIPTION:
 * Module API pour gérer les échanges dans l'application.
 * Il encapsule tous les appels HTTP vers les endpoints d'échanges du backend.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Liste paginée des échanges de l'utilisateur connecté avec filtres
 * - Récupération d'un échange par son ID avec tous ses détails
 * - Création d'un nouvel échange (proposition d'échange)
 * - Mise à jour du statut d'un échange (accepter, refuser, compléter, annuler)
 * - Gestion gracieuse des erreurs (ex: utilisateur non authentifié)
 *
 * ARCHITECTURE:
 * - Utilise apiClient pour les appels HTTP
 * - Gestion d'erreurs avec fallback pour les utilisateurs non authentifiés
 * - Types TypeScript stricts pour la sécurité des types
 *
 * UX:
 * - Retourne des valeurs par défaut si l'utilisateur n'est pas authentifié
 * - Messages d'erreur clairs pour guider l'utilisateur
 */

// Import du client API centralisé pour les appels HTTP
import { apiClient } from './api';
// Import des types TypeScript pour garantir la sécurité des types
import {
  Exchange,
  PaginatedResponse,
  ListExchangesParams,
  CreateExchangeDto,
  UpdateExchangeStatusDto,
} from '@/types';

/**
 * OBJET: exchangesApi
 *
 * Objet contenant toutes les méthodes pour interagir avec l'API d'échanges.
 * Toutes les méthodes sont asynchrones et retournent des Promises.
 */
export const exchangesApi = {
  /**
   * MÉTHODE: listMyExchanges
   *
   * Liste les échanges de l'utilisateur connecté avec filtres et pagination.
   * Retourne uniquement les échanges où l'utilisateur est le requester ou le responder.
   *
   * FLUX:
   * 1. Appeler l'endpoint GET /exchanges/me avec les paramètres de filtrage
   * 2. Le serveur filtre les échanges de l'utilisateur connecté
   * 3. Retourner la liste paginée d'échanges
   *
   * PARAMÈTRES SUPPORTÉS:
   * - status: filtre par statut (PENDING, ACCEPTED, DECLINED, COMPLETED, CANCELLED)
   * - sort: tri (ex: '-createdAt', 'status', etc.)
   * - page: numéro de page (défaut: 1)
   * - limit: nombre d'échanges par page (défaut: 20)
   *
   * GESTION D'ERREURS:
   * - Si l'utilisateur n'est pas authentifié (401), retourner une liste vide
   * - Sinon, propager l'erreur pour que le composant puisse la gérer
   *
   * @param params - Paramètres de filtrage et pagination (optionnels)
   * @returns Promise qui se résout avec la liste paginée d'échanges
   */
  async listMyExchanges(
    params: ListExchangesParams = {}
  ): Promise<PaginatedResponse<Exchange>> {
    try {
      /**
       * Appeler l'endpoint GET /exchanges/me
       * /me indique qu'on veut les échanges de l'utilisateur connecté
       * apiClient.client.get() fait un appel HTTP GET avec les paramètres de requête
       * Le type générique <PaginatedResponse<Exchange>> garantit le type de la réponse
       */
      const response = await apiClient.client.get<PaginatedResponse<Exchange>>(
        '/exchanges/me',
        { params } // Paramètres de requête (ex: status, sort, page, limit)
      );

      /**
       * Retourner les données de la réponse
       * response.data contient la liste paginée avec:
       * - items: tableau d'échanges
       * - total: nombre total d'échanges correspondant aux filtres
       * - page: numéro de page actuel
       * - limit: nombre d'échanges par page
       * - totalPages: nombre total de pages
       */
      return response.data;
    } catch (error: any) {
      /**
       * GESTION D'ERREUR SPÉCIALE: Utilisateur non authentifié
       *
       * Si l'erreur est une 401 (Unauthorized), cela signifie que l'utilisateur
       * n'est pas connecté. Au lieu de bloquer l'application, on retourne
       * une liste vide pour permettre à l'utilisateur de voir la page même
       * s'il n'est pas connecté.
       */
      if (error.response?.status === 401) {
        console.warn("Utilisateur non authentifié, retour d'une liste vide");
        /**
         * Retourner une réponse vide mais valide
         * Cela permet à l'UI de s'afficher sans erreur
         */
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };
      }

      /**
       * Pour toutes les autres erreurs (réseau, serveur, etc.),
       * propager l'erreur pour que le composant puisse la gérer
       */
      throw error;
    }
  },

  /**
   * MÉTHODE: getExchange
   *
   * Récupère un échange par son ID avec tous ses détails.
   * Inclut les items échangés, les utilisateurs (requester et responder),
   * les messages de chat, etc.
   *
   * FLUX:
   * 1. Appeler l'endpoint GET /exchanges/:id
   * 2. Le serveur retourne l'échange avec toutes ses relations
   * 3. Retourner l'échange complet
   *
   * SÉCURITÉ:
   * - Seuls les participants de l'échange peuvent le voir
   * - Si l'utilisateur n'est pas authentifié, une erreur est lancée
   *
   * @param id - ID unique de l'échange à récupérer
   * @returns Promise qui se résout avec les détails de l'échange
   * @throws Error si l'utilisateur n'est pas authentifié ou n'a pas accès
   */
  async getExchange(id: string): Promise<Exchange> {
    try {
      /**
       * Appeler l'endpoint GET /exchanges/:id
       * apiClient.client.get() fait un appel HTTP GET
       * Le type générique <Exchange> garantit le type de la réponse
       */
      const response = await apiClient.client.get<Exchange>(`/exchanges/${id}`);

      /**
       * Retourner les données de la réponse
       * response.data contient l'échange avec toutes ses propriétés:
       * - Informations de base (statut, dates, etc.)
       * - Items échangés (requesterItem, responderItem)
       * - Utilisateurs (requester, responder)
       * - Messages de chat (si disponibles)
       */
      return response.data;
    } catch (error: any) {
      /**
       * GESTION D'ERREUR SPÉCIALE: Utilisateur non authentifié
       *
       * Si l'erreur est une 401 (Unauthorized), cela signifie que l'utilisateur
       * n'est pas connecté. Contrairement à listMyExchanges, on lance une erreur
       * explicite car on ne peut pas afficher un échange sans authentification.
       */
      if (error.response?.status === 401) {
        throw new Error('Authentification requise pour voir cet échange');
      }

      /**
       * Pour toutes les autres erreurs (réseau, serveur, 403 Forbidden, etc.),
       * propager l'erreur pour que le composant puisse la gérer
       */
      throw error;
    }
  },

  /**
   * MÉTHODE: createExchange
   *
   * Crée un nouvel échange (proposition d'échange).
   * L'utilisateur connecté devient automatiquement le requester.
   *
   * FLUX:
   * 1. Appeler l'endpoint POST /exchanges avec les données de l'échange
   * 2. Le serveur valide les données et crée l'échange
   * 3. Retourner l'échange créé avec son ID généré
   *
   * DONNÉES REQUISES:
   * - responderItemId: ID de l'item que l'utilisateur veut recevoir (obligatoire)
   * - requesterItemId: ID de l'item que l'utilisateur propose en échange (obligatoire)
   * - message: message optionnel pour accompagner la proposition
   *
   * SÉCURITÉ:
   * - L'utilisateur doit être le propriétaire de requesterItemId
   * - L'utilisateur ne peut pas être le propriétaire de responderItemId
   * - Les deux items doivent être disponibles (status: AVAILABLE)
   *
   * @param data - Données de l'échange à créer (CreateExchangeDto)
   * @returns Promise qui se résout avec l'échange créé (avec ID généré)
   */
  async createExchange(data: CreateExchangeDto): Promise<Exchange> {
    /**
     * Appeler l'endpoint POST /exchanges
     * apiClient.client.post() fait un appel HTTP POST avec le corps de la requête
     * Le type générique <Exchange> garantit le type de la réponse
     */
    const response = await apiClient.client.post<Exchange>('/exchanges', data);

    /**
     * Retourner les données de la réponse
     * Le serveur retourne l'échange créé avec:
     * - L'ID généré automatiquement
     * - Le statut PENDING (en attente)
     * - Les dates de création
     * - Les items et utilisateurs associés
     */
    return response.data;
  },

  /**
   * MÉTHODE: updateExchangeStatus
   *
   * Met à jour le statut d'un échange.
   * Les actions possibles dépendent du rôle de l'utilisateur et du statut actuel.
   *
   * FLUX:
   * 1. Appeler l'endpoint PATCH /exchanges/:id/status avec le nouveau statut
   * 2. Le serveur valide la transition de statut et met à jour l'échange
   * 3. Retourner l'échange mis à jour
   *
   * TRANSITIONS DE STATUT POSSIBLES:
   * - PENDING → ACCEPTED (par le responder)
   * - PENDING → DECLINED (par le responder)
   * - PENDING → CANCELLED (par le requester ou responder)
   * - ACCEPTED → COMPLETED (par le requester ou responder)
   * - ACCEPTED → CANCELLED (par le requester ou responder)
   *
   * SÉCURITÉ:
   * - Seuls les participants de l'échange peuvent modifier le statut
   * - Les transitions de statut sont validées côté serveur
   * - Certaines transitions sont irréversibles (ex: DECLINED, COMPLETED)
   *
   * @param id - ID de l'échange à mettre à jour
   * @param data - Nouveau statut à appliquer (UpdateExchangeStatusDto)
   * @returns Promise qui se résout avec l'échange mis à jour
   */
  async updateExchangeStatus(
    id: string,
    data: UpdateExchangeStatusDto
  ): Promise<Exchange> {
    /**
     * Appeler l'endpoint PATCH /exchanges/:id/status
     * apiClient.client.patch() fait un appel HTTP PATCH avec le corps de la requête
     * PATCH est utilisé pour les mises à jour partielles
     * Le type générique <Exchange> garantit le type de la réponse
     */
    const response = await apiClient.client.patch<Exchange>(
      `/exchanges/${id}/status`,
      data // Corps de la requête: { status: 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED' }
    );

    /**
     * Retourner les données de la réponse
     * Le serveur retourne l'échange mis à jour avec:
     * - Le nouveau statut
     * - Les dates mises à jour (ex: completedAt si COMPLETED)
     * - Toutes les autres propriétés inchangées
     */
    return response.data;
  },
};

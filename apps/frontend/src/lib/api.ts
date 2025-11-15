/**
 * FICHIER: api.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le client API principal pour communiquer avec le backend.
 * Il gère automatiquement l'authentification, le rafraîchissement des tokens,
 * et la gestion des erreurs.
 *
 * FONCTIONNALITÉS:
 * - Client Axios configuré avec l'URL de base de l'API
 * - Intercepteurs pour ajouter automatiquement le token JWT
 * - Rafraîchissement automatique des tokens expirés
 * - File d'attente pour les requêtes en attente de rafraîchissement
 * - Gestion des erreurs avec affichage de toasts
 * - Méthodes pour tous les endpoints de l'API (auth, items, exchanges, etc.)
 *
 * SÉCURITÉ:
 * - Tokens stockés dans localStorage
 * - Rafraîchissement automatique des tokens expirés
 * - Redirection vers /login si l'authentification échoue
 */

// Import d'Axios pour les requêtes HTTP
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Import de react-hot-toast pour afficher les notifications
import { toast } from 'react-hot-toast';

// Import des types TypeScript
import {
  AuthResponse,
  User,
  Item,
  Exchange,
  WeeklyTheme,
  PaginatedResponse,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from '@/types';

/**
 * CLASSE: ApiClient
 *
 * Client API principal pour communiquer avec le backend.
 * Gère l'authentification, le rafraîchissement des tokens, et les erreurs.
 */
class ApiClient {
  /**
   * Instance Axios configurée pour les requêtes HTTP
   */
  public client: AxiosInstance;

  /**
   * Flag pour éviter les rafraîchissements multiples simultanés
   */
  private isRefreshing = false;

  /**
   * File d'attente pour les requêtes qui attendent le rafraîchissement du token
   */
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  /**
   * CONSTRUCTEUR
   *
   * Initialise le client Axios et configure les intercepteurs.
   */
  constructor() {
    // Créer l'instance Axios avec la configuration de base
    this.client = axios.create({
      // URL de base de l'API (depuis les variables d'environnement ou localhost par défaut)
      baseURL:
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
      timeout: 10000, // Timeout de 10 secondes
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configurer les intercepteurs (request et response)
    this.setupInterceptors();
  }

  // ============================================
  // MÉTHODE PRIVÉE: setupInterceptors
  // ============================================

  /**
   * Configure les intercepteurs Axios pour:
   * - Ajouter automatiquement le token JWT aux requêtes
   * - Gérer les erreurs 401 (non autorisé) avec rafraîchissement automatique
   * - Afficher les erreurs à l'utilisateur via des toasts
   */
  private setupInterceptors() {
    // ============================================
    // INTERCEPTEUR DE REQUÊTE
    // ============================================
    /**
     * Ajoute automatiquement le token JWT à toutes les requêtes.
     * Le token est récupéré depuis localStorage et ajouté dans le header Authorization.
     */
    this.client.interceptors.request.use(
      (config) => {
        // Récupérer le token depuis localStorage
        const token = this.getAccessToken();
        if (token) {
          // Ajouter le token dans le header Authorization
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        // En cas d'erreur lors de la préparation de la requête, rejeter
        return Promise.reject(error);
      }
    );

    // ============================================
    // INTERCEPTEUR DE RÉPONSE
    // ============================================
    /**
     * Gère les erreurs de réponse, notamment les erreurs 401 (token expiré).
     * Rafraîchit automatiquement le token et réessaie la requête.
     */
    this.client.interceptors.response.use(
      // Si la réponse est réussie, la retourner telle quelle
      (response) => response,
      // Si une erreur se produit, la gérer
      async (error) => {
        const originalRequest = error.config;

        // ============================================
        // CAS SPÉCIAL: Endpoint de rafraîchissement
        // ============================================
        /**
         * Ne pas intercepter les erreurs de l'endpoint /auth/refresh lui-même
         * pour éviter les boucles infinies.
         */
        if (
          originalRequest?.url?.includes('/auth/refresh') ||
          originalRequest?._skipAuthRefresh
        ) {
          // Si c'est un refresh qui échoue, nettoyer les tokens et rediriger
          if (error.response?.status === 401) {
            this.clearTokens();
            // Ne pas rediriger si on est déjà sur la page de login
            if (
              typeof window !== 'undefined' &&
              !window.location.pathname.includes('/login')
            ) {
              window.location.href = '/login';
            }
          }
          return Promise.reject(error);
        }

        // ============================================
        // GESTION DES ERREURS 401 (TOKEN EXPIRÉ)
        // ============================================
        /**
         * Si l'erreur est 401 (non autorisé) et que la requête n'a pas déjà été réessayée,
         * tenter de rafraîchir le token et réessayer la requête.
         */
        if (error.response?.status === 401 && !originalRequest._retry) {
          // ============================================
          // CAS 1: Un rafraîchissement est déjà en cours
          // ============================================
          /**
           * Si on est déjà en train de rafraîchir le token, mettre cette requête
           * en file d'attente. Elle sera réessayée une fois le nouveau token obtenu.
           */
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              // Ajouter la requête à la file d'attente
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                // Une fois le nouveau token obtenu, réessayer la requête
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          // ============================================
          // CAS 2: Démarrer un nouveau rafraîchissement
          // ============================================
          /**
           * Marquer la requête comme réessayée et activer le flag de rafraîchissement
           * pour éviter les rafraîchissements multiples simultanés.
           */
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Récupérer le refresh token depuis localStorage
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('Aucun refresh token disponible');
            }

            // Appeler l'endpoint de rafraîchissement
            const response = await this.refreshToken(refreshToken);

            // Sauvegarder les nouveaux tokens
            this.setTokens(response.accessToken, response.refreshToken);

            // Réessayer la requête originale avec le nouveau token
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;

            // Traiter toutes les requêtes en file d'attente avec le nouveau token
            this.failedQueue.forEach(({ resolve }) => {
              resolve(response.accessToken);
            });
            this.failedQueue = [];
            this.isRefreshing = false;

            // Réessayer la requête originale
            return this.client(originalRequest);
          } catch (refreshError) {
            // ============================================
            // ÉCHEC DU RAFRAÎCHISSEMENT
            // ============================================
            /**
             * Si le rafraîchissement échoue, nettoyer les tokens et rediriger vers /login.
             * Toutes les requêtes en file d'attente sont rejetées.
             */
            this.clearTokens();
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];
            this.isRefreshing = false;

            // Ne pas rediriger si on est déjà sur la page de login
            if (
              typeof window !== 'undefined' &&
              !window.location.pathname.includes('/login')
            ) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // ============================================
        // AFFICHAGE DES ERREURS À L'UTILISATEUR
        // ============================================
        /**
         * Afficher les erreurs via des toasts (sauf pour les erreurs de refresh
         * et les requêtes marquées comme silencieuses).
         */
        if (
          error.response?.status !== 401 ||
          !originalRequest?.url?.includes('/auth/refresh')
        ) {
          if (error.response?.data?.message) {
            // Ne pas afficher les erreurs pour les requêtes qui ont échoué silencieusement
            if (!originalRequest?._skipErrorToast) {
              toast.error(error.response.data.message);
            }
          } else if (error.message && !originalRequest?._skipErrorToast) {
            toast.error(error.message);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // GESTION DES TOKENS
  // ============================================

  /**
   * Récupère le token d'accès depuis localStorage.
   *
   * @returns Le token d'accès ou null si non disponible
   */
  private getAccessToken(): string | null {
    // Vérifier que window est défini (évite les erreurs SSR)
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Récupère le refresh token depuis localStorage.
   *
   * @returns Le refresh token ou null si non disponible
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  /**
   * Sauvegarde les tokens dans localStorage.
   *
   * @param accessToken - Token d'accès JWT
   * @param refreshToken - Refresh token JWT
   */
  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Supprime les tokens de localStorage.
   * Utilisé lors de la déconnexion ou si l'authentification échoue.
   */
  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // ============================================
  // ENDPOINTS D'AUTHENTIFICATION
  // ============================================

  /**
   * Connecte un utilisateur et sauvegarde les tokens.
   *
   * @param data - Données de connexion (email, password)
   * @returns Réponse d'authentification avec tokens et utilisateur
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    // Sauvegarder les tokens automatiquement
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  /**
   * Inscrit un nouvel utilisateur et sauvegarde les tokens.
   *
   * @param data - Données d'inscription (email, password, displayName)
   * @returns Réponse d'authentification avec tokens et utilisateur
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      '/auth/register',
      data
    );
    // Sauvegarder les tokens automatiquement
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  /**
   * Déconnecte l'utilisateur et supprime les tokens.
   *
   * Envoie une requête au serveur pour révoquer le refresh token,
   * puis supprime les tokens du localStorage.
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        // Tenter de révoquer le refresh token côté serveur
        await this.client.post('/auth/logout', { refreshToken });
      } catch (error) {
        // Ignorer les erreurs de logout (le token peut déjà être expiré)
      }
    }
    // Supprimer les tokens du localStorage
    this.clearTokens();
  }

  /**
   * Rafraîchit le token d'accès en utilisant le refresh token.
   *
   * Cette méthode est marquée pour ne pas déclencher l'interceptor
   * de rafraîchissement (évite les boucles infinies).
   *
   * @param refreshToken - Le refresh token à utiliser
   * @returns Nouveaux tokens (access + refresh)
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Marquer cette requête pour qu'elle ne déclenche pas l'interceptor
    const response = await this.client.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken }, {
      _skipAuthRefresh: true, // Ne pas déclencher le rafraîchissement automatique
      _skipErrorToast: true, // Ne pas afficher d'erreur si ça échoue
    } as any);
    return response.data;
  }

  /**
   * Récupère le profil de l'utilisateur connecté.
   *
   * @returns Informations de l'utilisateur
   */
  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/users/me');
    return response.data;
  }

  // ============================================
  // ENDPOINTS D'ITEMS
  // ============================================

  /**
   * Récupère une liste paginée d'items avec filtres optionnels.
   *
   * @param params - Paramètres de pagination et filtres (page, limit, category, search)
   * @returns Liste paginée d'items
   */
  async getItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<Item>> {
    const response = await this.client.get<PaginatedResponse<Item>>('/items', {
      params,
    });
    return response.data;
  }

  /**
   * Récupère un item par son ID.
   *
   * @param id - ID de l'item
   * @returns Détails de l'item
   */
  async getItem(id: string): Promise<Item> {
    const response = await this.client.get<Item>(`/items/${id}`);
    return response.data;
  }

  /**
   * Crée un nouvel item.
   *
   * @param itemData - Données de l'item à créer
   * @returns Item créé
   */
  async createItem(itemData: {
    title: string;
    description: string;
    category: string;
    condition: string;
    images: string[];
    tags: string[];
  }): Promise<Item> {
    const response = await this.client.post<Item>('/items', itemData);
    return response.data;
  }

  /**
   * Met à jour un item existant.
   *
   * @param id - ID de l'item à mettre à jour
   * @param itemData - Données à mettre à jour (mise à jour partielle)
   * @returns Item mis à jour
   */
  async updateItem(id: string, itemData: Partial<Item>): Promise<Item> {
    const response = await this.client.patch<Item>(`/items/${id}`, itemData);
    return response.data;
  }

  /**
   * Supprime un item.
   *
   * @param id - ID de l'item à supprimer
   */
  async deleteItem(id: string): Promise<void> {
    await this.client.delete(`/items/${id}`);
  }

  /**
   * Récupère la liste des catégories disponibles.
   *
   * @returns Liste des catégories
   */
  async getCategories(): Promise<string[]> {
    const response = await this.client.get<string[]>('/items/categories');
    return response.data;
  }

  // ============================================
  // ENDPOINTS D'ÉCHANGES
  // ============================================

  /**
   * Récupère une liste paginée d'échanges de l'utilisateur connecté.
   *
   * @param params - Paramètres de pagination (page, limit)
   * @returns Liste paginée d'échanges
   */
  async getExchanges(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Exchange>> {
    const response = await this.client.get<PaginatedResponse<Exchange>>(
      '/exchanges',
      { params }
    );
    return response.data;
  }

  /**
   * Récupère un échange par son ID.
   *
   * @param id - ID de l'échange
   * @returns Détails de l'échange
   */
  async getExchange(id: string): Promise<Exchange> {
    const response = await this.client.get<Exchange>(`/exchanges/${id}`);
    return response.data;
  }

  /**
   * Crée une nouvelle proposition d'échange.
   *
   * @param exchangeData - Données de l'échange (itemId, message?)
   * @returns Échange créé
   */
  async createExchange(exchangeData: {
    itemId: string;
    message?: string;
  }): Promise<Exchange> {
    const response = await this.client.post<Exchange>(
      '/exchanges',
      exchangeData
    );
    return response.data;
  }

  /**
   * Met à jour le statut d'un échange.
   *
   * @param id - ID de l'échange
   * @param status - Nouveau statut (PENDING, ACCEPTED, DECLINED, etc.)
   * @param message - Message optionnel
   * @returns Échange mis à jour
   */
  async updateExchange(
    id: string,
    status: string,
    message?: string
  ): Promise<Exchange> {
    const response = await this.client.patch<Exchange>(`/exchanges/${id}`, {
      status,
      message,
    });
    return response.data;
  }

  /**
   * Annule un échange.
   *
   * @param id - ID de l'échange à annuler
   */
  async cancelExchange(id: string): Promise<void> {
    await this.client.delete(`/exchanges/${id}`);
  }

  // ============================================
  // ENDPOINTS DE CHAT
  // ============================================

  /**
   * Récupère les messages d'un échange avec pagination.
   *
   * @param exchangeId - ID de l'échange
   * @param params - Paramètres de pagination (page, limit)
   * @returns Liste paginée de messages
   */
  async getMessages(
    exchangeId: string,
    params?: { page?: number; limit?: number }
  ) {
    const response = await this.client.get(
      `/chat/exchanges/${exchangeId}/messages`,
      { params }
    );
    return response.data;
  }

  // ============================================
  // ENDPOINTS IA
  // ============================================

  /**
   * Récupère le thème hebdomadaire actuel.
   *
   * @returns Thème hebdomadaire actif
   */
  async getCurrentTheme(): Promise<WeeklyTheme> {
    const response = await this.client.get<WeeklyTheme>('/ai/theme');
    return response.data;
  }

  // ============================================
  // ENDPOINTS UTILISATEURS
  // ============================================

  /**
   * Récupère les informations d'un utilisateur par son username.
   *
   * @param username - Nom d'utilisateur
   * @returns Informations de l'utilisateur
   */
  async getUser(username: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${username}`);
    return response.data;
  }

  /**
   * Met à jour le profil de l'utilisateur connecté.
   *
   * @param userData - Données à mettre à jour (displayName, avatarUrl, bio, etc.)
   * @returns Utilisateur mis à jour
   */
  async updateProfile(userData: UpdateProfileDto): Promise<User> {
    const response = await this.client.patch<User>('/users/me', userData);
    return response.data;
  }

  /**
   * Supprime le compte de l'utilisateur connecté.
   *
   * ATTENTION: Cette opération est irréversible!
   */
  async deleteAccount(): Promise<void> {
    await this.client.delete('/users/me');
  }

  /**
   * Récupère les statistiques de l'utilisateur connecté.
   *
   * @returns Statistiques (nombre d'items, d'échanges, etc.)
   */
  async getUserStats() {
    const response = await this.client.get('/users/me/stats');
    return response.data;
  }
}

// ============================================
// EXPORT DU CLIENT API
// ============================================

/**
 * Instance unique du client API.
 * Utilisée dans toute l'application pour faire des requêtes au backend.
 */
export const apiClient = new ApiClient();
export default apiClient;

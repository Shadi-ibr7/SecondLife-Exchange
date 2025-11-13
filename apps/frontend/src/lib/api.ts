import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
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

class ApiClient {
  public client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor pour gérer les erreurs et le refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Ne pas intercepter les erreurs de l'endpoint /auth/refresh lui-même
        if (
          originalRequest?.url?.includes('/auth/refresh') ||
          originalRequest?._skipAuthRefresh
        ) {
          // Si c'est un refresh qui échoue, nettoyer et rediriger
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          // Si on est déjà en train de rafraîchir, mettre la requête en file d'attente
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('Aucun refresh token disponible');
            }

            const response = await this.refreshToken(refreshToken);
            this.setTokens(response.accessToken, response.refreshToken);

            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;

            // Traiter toutes les requêtes en file d'attente
            this.failedQueue.forEach(({ resolve }) => {
              resolve(response.accessToken);
            });
            this.failedQueue = [];
            this.isRefreshing = false;

            return this.client(originalRequest);
          } catch (refreshError) {
            // Échec du refresh, nettoyer et rediriger
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

        // Afficher les erreurs à l'utilisateur (sauf pour les erreurs de refresh)
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

  // Token management
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Auth endpoints
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      '/auth/register',
      data
    );
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.client.post('/auth/logout', { refreshToken });
      } catch (error) {
        // Ignore logout errors
      }
    }
    this.clearTokens();
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Marquer cette requête pour qu'elle ne déclenche pas l'interceptor
    const response = await this.client.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken }, {
      _skipAuthRefresh: true,
      _skipErrorToast: true,
    } as any);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/users/me');
    return response.data;
  }

  // Items endpoints
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

  async getItem(id: string): Promise<Item> {
    const response = await this.client.get<Item>(`/items/${id}`);
    return response.data;
  }

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

  async updateItem(id: string, itemData: Partial<Item>): Promise<Item> {
    const response = await this.client.patch<Item>(`/items/${id}`, itemData);
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await this.client.delete(`/items/${id}`);
  }

  async getCategories(): Promise<string[]> {
    const response = await this.client.get<string[]>('/items/categories');
    return response.data;
  }

  // Exchanges endpoints
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

  async getExchange(id: string): Promise<Exchange> {
    const response = await this.client.get<Exchange>(`/exchanges/${id}`);
    return response.data;
  }

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

  async cancelExchange(id: string): Promise<void> {
    await this.client.delete(`/exchanges/${id}`);
  }

  // Chat endpoints
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

  // AI endpoints
  async getCurrentTheme(): Promise<WeeklyTheme> {
    const response = await this.client.get<WeeklyTheme>('/ai/theme');
    return response.data;
  }

  // Users endpoints
  async getUser(username: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${username}`);
    return response.data;
  }

  async updateProfile(userData: UpdateProfileDto): Promise<User> {
    const response = await this.client.patch<User>('/users/me', userData);
    return response.data;
  }

  async deleteAccount(): Promise<void> {
    await this.client.delete('/users/me');
  }

  async getUserStats() {
    const response = await this.client.get('/users/me/stats');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

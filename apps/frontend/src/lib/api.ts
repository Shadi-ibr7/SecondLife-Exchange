import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import { AuthResponse, User, Item, Exchange, WeeklyTheme, PaginatedResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              this.setTokens(response.accessToken, response.refreshToken);

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Afficher les erreurs à l'utilisateur
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
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
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', userData);
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

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await this.client.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Items endpoints
  async getItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<Item>> {
    const response = await this.client.get<PaginatedResponse<Item>>('/items', { params });
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
  async getExchanges(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Exchange>> {
    const response = await this.client.get<PaginatedResponse<Exchange>>('/exchanges', { params });
    return response.data;
  }

  async getExchange(id: string): Promise<Exchange> {
    const response = await this.client.get<Exchange>(`/exchanges/${id}`);
    return response.data;
  }

  async createExchange(exchangeData: { itemId: string; message?: string }): Promise<Exchange> {
    const response = await this.client.post<Exchange>('/exchanges', exchangeData);
    return response.data;
  }

  async updateExchange(id: string, status: string, message?: string): Promise<Exchange> {
    const response = await this.client.patch<Exchange>(`/exchanges/${id}`, { status, message });
    return response.data;
  }

  async cancelExchange(id: string): Promise<void> {
    await this.client.delete(`/exchanges/${id}`);
  }

  // Chat endpoints
  async getMessages(exchangeId: string, params?: { page?: number; limit?: number }) {
    const response = await this.client.get(`/chat/exchanges/${exchangeId}/messages`, { params });
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

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.client.put<User>('/users/me', userData);
    return response.data;
  }

  async getUserStats() {
    const response = await this.client.get('/users/me/stats');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

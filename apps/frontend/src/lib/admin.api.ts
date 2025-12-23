/**
 * FICHIER: admin.api.ts
 *
 * DESCRIPTION:
 * Client API pour les routes admin.
 */

import axios from 'axios';
import type { AxiosError } from 'axios';
import { ADMIN_API_BASE } from './admin.config';
import { clearAdminToken, getAdminToken, setAdminToken } from './admin.token';

type LoginResponse = {
  accessToken?: string;
  [key: string]: unknown;
};

// Construire l'URL de base de l'API
const getApiBaseURL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  // Le backend a un préfixe global /api/v1, donc on doit l'inclure
  // Si l'URL contient déjà /api/v1, ne pas l'ajouter deux fois
  if (apiUrl.includes('/api/v1')) {
    return apiUrl;
  }
  // Sinon, ajouter /api/v1
  return `${apiUrl}${ADMIN_API_BASE}`;
};

console.log('🔧 Admin API Base URL:', getApiBaseURL());

export const ADMIN_LOGIN_ENDPOINT = '/auth/admin/login';
export const getAdminApiBaseUrl = getApiBaseURL;

const adminApiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token admin
adminApiClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 Token admin injecté');
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAdminToken();
      if (typeof window !== 'undefined') {
        window.location.href = `/${process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7'}/login`;
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Auth
  login: async (
    email: string,
    password: string
  ): Promise<{ data: LoginResponse; status: number }> => {
    try {
      const url = ADMIN_LOGIN_ENDPOINT;
      console.log('LOGIN REQUEST', `${adminApiClient.defaults.baseURL}${url}`, {
        email,
      });

      const response = await adminApiClient.post(url, {
        email,
        password,
      });
      console.log('LOGIN RESPONSE', response.status, response.data);

      if (response.data.accessToken) {
        setAdminToken(response.data.accessToken);
        console.log('✅ Connexion réussie, token sauvegardé');
      }
      return { data: response.data, status: response.status };
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('❌ Erreur de connexion admin:', err);
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
        throw new Error(
          'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:4000'
        );
      }
      throw err;
    }
  },

  // Dashboard
  getDashboardStats: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.get(`/${adminBasePath}/dashboard`);
    return response.data;
  },

  // Users
  getUsers: async (page = 1, limit = 20, search?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    const response = await adminApiClient.get(
      `/${adminBasePath}/users?${params.toString()}`
    );
    return response.data;
  },

  getUserById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.get(`/${adminBasePath}/users/${id}`);
    return response.data;
  },

  banUser: async (id: string, reason?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.patch(
      `/${adminBasePath}/users/${id}/ban`,
      { reason }
    );
    return response.data;
  },

  unbanUser: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.patch(
      `/${adminBasePath}/users/${id}/unban`
    );
    return response.data;
  },

  // Items
  getItems: async (
    page = 1,
    limit = 20,
    filters?: { ownerId?: string; category?: string; status?: string }
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    const response = await adminApiClient.get(
      `/${adminBasePath}/items?${params.toString()}`
    );
    return response.data;
  },

  archiveItem: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.patch(
      `/${adminBasePath}/items/${id}/archive`
    );
    return response.data;
  },

  deleteItem: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.delete(
      `/${adminBasePath}/items/${id}`
    );
    return response.data;
  },

  // Reports
  getReports: async (page = 1, limit = 20, resolved?: boolean) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (resolved !== undefined) params.append('resolved', resolved.toString());
    const response = await adminApiClient.get(
      `/${adminBasePath}/reports?${params.toString()}`
    );
    return response.data;
  },

  resolveReport: async (id: string, banUser = false) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.patch(
      `/${adminBasePath}/reports/${id}/resolve`,
      { banUser }
    );
    return response.data;
  },

  // Themes
  getThemes: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.get(`/${adminBasePath}/themes`);
    // S'assurer qu'on retourne toujours un tableau
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  getThemeById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.get(`/${adminBasePath}/themes/${id}`);
    return response.data;
  },

  createTheme: async (payload: {
    title: string;
    slug: string;
    startOfWeek: string;
    impactText?: string;
    isActive?: boolean;
  }) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.post(
      `/${adminBasePath}/themes`,
      payload
    );
    return response.data;
  },

  updateTheme: async (
    id: string,
    payload: Partial<{
      title: string;
      slug: string;
      startOfWeek: string;
      impactText?: string;
      isActive?: boolean;
    }>
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.patch(
      `/${adminBasePath}/themes/${id}`,
      payload
    );
    return response.data;
  },

  activateTheme: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.patch(
      `/${adminBasePath}/themes/${id}/activate`
    );
    return response.data;
  },

  deleteTheme: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.delete(
      `/${adminBasePath}/themes/${id}`
    );
    return response.data;
  },

  generateThemeSuggestions: async (id: string, locales?: string[]) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.post(
      `/${adminBasePath}/themes/${id}/suggestions`,
      {
        locales,
      }
    );
    return response.data;
  },

  getThemeSuggestions: async (
    id: string,
    page = 1,
    limit = 10,
    sort = '-createdAt'
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
    });
    const response = await adminApiClient.get(
      `/${adminBasePath}/themes/${id}/suggestions?${params.toString()}`
    );
    return response.data;
  },

  getThemeSuggestionStats: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const response = await adminApiClient.get(
      `/${adminBasePath}/themes/${id}/suggestions/stats`
    );
    return response.data;
  },

  generateTheme: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const token = getAdminToken();
    console.log('🔑 Token admin présent:', !!token);
    console.log(
      '📍 URL complète:',
      `${adminApiClient.defaults.baseURL}/${adminBasePath}/themes/generate`
    );
    try {
      const response = await adminApiClient.post(
        `/${adminBasePath}/themes/generate`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('❌ Erreur génération thème:', err);
      console.error(
        '📍 URL tentée:',
        `${adminApiClient.defaults.baseURL}/${adminBasePath}/themes/generate`
      );
      console.error('📊 Status:', err.response?.status);
      console.error('📊 Headers envoyés:', err.config?.headers);
      throw err;
    }
  },

  generateMonthlyThemes: async (month?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    try {
      const response = await adminApiClient.post(
        `/${adminBasePath}/themes/generate-monthly`,
        month ? { month } : {}
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('❌ Erreur génération thèmes mensuels:', err);
      throw err;
    }
  },

  // Eco Content
  getEcoContent: async (page = 1, limit = 20) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await adminApiClient.get(
      `/${adminBasePath}/eco?${params.toString()}`
    );
    return response.data;
  },

  // Logs
  getLogs: async (page = 1, limit = 50, adminId?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'greenroom-core-qlf18scha7';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (adminId) params.append('adminId', adminId);
    const response = await adminApiClient.get(
      `/${adminBasePath}/logs?${params.toString()}`
    );
    return response.data;
  },
};

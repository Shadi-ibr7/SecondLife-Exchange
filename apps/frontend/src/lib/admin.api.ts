/**
 * FICHIER: admin.api.ts
 *
 * DESCRIPTION:
 * Client API pour les routes admin avec authentification par cookies httpOnly.
 *
 * SÉCURITÉ:
 * - Les tokens sont stockés dans des cookies httpOnly (pas accessible en JS)
 * - withCredentials: true pour envoyer/recevoir les cookies cross-origin
 * - Plus de localStorage pour les tokens (vulnérable XSS)
 *
 * COMPATIBILITÉ:
 * - SSR: Les requêtes côté serveur ne peuvent pas accéder aux cookies du navigateur
 * - CSR: Les cookies sont automatiquement envoyés avec withCredentials: true
 */

import axios from 'axios';
import type { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { ADMIN_API_BASE, ADMIN_BASE_PATH } from './admin.config';

/**
 * Réponse du login admin
 */
type LoginResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string;
    avatarUrl: string | null;
  };
  // Tokens inclus pour rétrocompatibilité (période de transition)
  accessToken?: string;
  refreshToken?: string;
  // 2FA: si activé, retourne '2FA_REQUIRED' au lieu des tokens
  requiresTwoFactor?: boolean;
  message?: string;
};

/**
 * Réponse de l'endpoint /auth/admin/me
 */
type AdminMeResponse = {
  id: string;
  email: string;
  displayName: string;
  roles: string;
  avatarUrl: string | null;
  createdAt: string;
  twoFactorEnabled?: boolean;
};

// Construire l'URL de base de l'API
const getApiBaseURL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  // Le backend a un préfixe global /api/v1
  if (apiUrl.includes('/api/v1')) {
    return apiUrl;
  }
  return `${apiUrl}${ADMIN_API_BASE}`;
};

if (typeof window !== 'undefined') {
  console.log('🔧 Admin API Base URL:', getApiBaseURL());
}

export const ADMIN_LOGIN_ENDPOINT = '/auth/admin/login';
export const ADMIN_REFRESH_ENDPOINT = '/auth/admin/refresh';
export const ADMIN_LOGOUT_ENDPOINT = '/auth/admin/logout';
export const ADMIN_ME_ENDPOINT = '/auth/admin/me';
export const ADMIN_2FA_SETUP_ENDPOINT = '/auth/admin/2fa/setup';
export const ADMIN_2FA_ENABLE_ENDPOINT = '/auth/admin/2fa/enable';
export const ADMIN_2FA_VERIFY_ENDPOINT = '/auth/admin/2fa/verify';
export const ADMIN_2FA_DISABLE_ENDPOINT = '/auth/admin/2fa/disable';
export const CSRF_ENDPOINT = '/security/csrf';
export const getAdminApiBaseUrl = getApiBaseURL;

/**
 * Nom du cookie CSRF (non-httpOnly pour que JS puisse le lire)
 */
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/**
 * Nom du header CSRF à envoyer dans les requêtes
 */
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Récupère le token CSRF depuis le cookie
 * @returns Token CSRF ou null si absent
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.split('=')[1];

    if (!cookieValue) return null;

    // Décoder l'URL encoding si nécessaire
    return decodeURIComponent(cookieValue);
  } catch {
    return null;
  }
}

/**
 * Récupère un nouveau token CSRF depuis l'endpoint /security/csrf
 * @returns Token CSRF ou null en cas d'erreur
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await adminApiClient.get<{ csrfToken: string }>(CSRF_ENDPOINT);
    return response.data.csrfToken || null;
  } catch (error) {
    console.warn('[CSRF] Erreur lors de la récupération du token CSRF:', error);
    return null;
  }
}

/**
 * Client Axios configuré pour l'API admin
 *
 * IMPORTANT: withCredentials: true est OBLIGATOIRE pour:
 * - Envoyer les cookies au backend
 * - Recevoir les Set-Cookie du backend
 */
const adminApiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  withCredentials: true, // OBLIGATOIRE pour cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Intercepteur de requête pour ajouter le token CSRF
 * - Récupère le token depuis le cookie XSRF-TOKEN
 * - Si absent, en récupère un nouveau via /security/csrf
 * - Ajoute le header X-CSRF-Token sur toutes les requêtes mutantes
 */
adminApiClient.interceptors.request.use(
  async (config) => {
    // Méthodes HTTP mutantes nécessitant CSRF
    const mutatingMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];

    // Ajouter CSRF uniquement sur les méthodes mutantes
    if (config.method && mutatingMethods.includes(config.method.toUpperCase())) {
      // Essayer de récupérer le token depuis le cookie
      let csrfToken = getCsrfTokenFromCookie();

      // Si absent, en récupérer un nouveau
      if (!csrfToken) {
        csrfToken = await fetchCsrfToken();
      }

      // Ajouter le header CSRF si le token est disponible
      if (csrfToken && config.headers) {
        config.headers[CSRF_HEADER_NAME] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponse pour gérer les erreurs d'authentification et CSRF
 * - 401: Token expiré ou invalide → tenter refresh ou rediriger vers login
 * - 403: CSRF token invalide → récupérer un nouveau token et réessayer
 */
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
      _skipErrorToast?: boolean;
    };

    // Si erreur 401 et pas déjà en retry
    if (error.response?.status === 401 && !originalRequest?._retry) {
      // Ne pas retry pour les endpoints d'auth eux-mêmes
      if (
        originalRequest?.url?.includes('/auth/admin/login') ||
        originalRequest?.url?.includes('/auth/admin/refresh')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Tenter de rafraîchir le token
        await adminApiClient.post(ADMIN_REFRESH_ENDPOINT);
        // Réessayer la requête originale
        return adminApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh échoué → rediriger vers login
        if (typeof window !== 'undefined') {
          const adminBasePath =
            process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
          window.location.href = `/${adminBasePath}/login`;
        }
        return Promise.reject(refreshError);
      }
    }

    // Gérer les erreurs CSRF (403 avec message spécifique)
    const errorData = error.response?.data as { message?: string } | undefined;
    if (
      error.response?.status === 403 &&
      errorData?.message?.includes('CSRF')
    ) {
      const originalRequest = error.config as typeof error.config & {
        _retry?: boolean;
      };

      // Éviter les boucles infinies
      if (originalRequest?._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Récupérer un nouveau token CSRF
        const csrfToken = await fetchCsrfToken();
        if (csrfToken && originalRequest.headers) {
          originalRequest.headers[CSRF_HEADER_NAME] = csrfToken;
        }
        // Réessayer la requête avec le nouveau token
        return adminApiClient(originalRequest);
      } catch (csrfError) {
        console.error('[CSRF] Erreur lors du retry après échec CSRF:', csrfError);
        return Promise.reject(error);
      }
    }

    // ============================================
    // AFFICHAGE DES ERREURS À L'UTILISATEUR
    // ============================================
    /**
     * Afficher les erreurs via des toasts pour informer l'utilisateur.
     *
     * EXCEPTIONS (pas de toast):
     * - Erreurs 401 (gérées par le rafraîchissement automatique)
     * - Erreurs 403 CSRF (gérées par le retry automatique)
     * - Requêtes marquées comme silencieuses (_skipErrorToast)
     *
     * PRIORITÉ DES MESSAGES:
     * 1. error.response?.data?.message: message d'erreur standardisé du serveur (prioritaire)
     * 2. Erreur réseau (pas de response) → "API inaccessible"
     * 3. error.message: message d'erreur générique (fallback)
     *
     * FORMAT BACKEND STANDARDISÉ:
     * Le backend retourne toujours un format standardisé:
     * {
     *   "statusCode": number,
     *   "error": string,
     *   "message": string,
     *   "path": string,
     *   "timestamp": string,
     *   "requestId": string
     * }
     * On extrait toujours message pour l'afficher à l'utilisateur.
     */
    const shouldShowToast =
      error.response?.status !== 401 && // Ne pas afficher pour les 401 (gérées par le rafraîchissement)
      error.response?.status !== 403 && // Ne pas afficher pour les 403 CSRF (gérées par le retry)
      !originalRequest?._skipErrorToast; // Ne pas afficher pour les requêtes silencieuses

    if (shouldShowToast) {
      let userMessage: string;

      // Cas 1: Erreur avec réponse du serveur (format standardisé backend)
      const errorData = error.response?.data as { message?: string } | undefined;
      if (errorData?.message) {
        // Extraire le message standardisé du backend
        userMessage = errorData.message;
      }
      // Cas 2: Erreur réseau (pas de response) → API inaccessible
      else if (!error.response && error.request) {
        // Pas de réponse du serveur = erreur réseau (connexion impossible, timeout, etc.)
        userMessage = 'API inaccessible. Veuillez vérifier votre connexion.';
      }
      // Cas 3: Message d'erreur générique (fallback)
      else if ('message' in error && error.message) {
        // Utiliser le message d'erreur générique seulement si ce n'est pas un message technique
        // Éviter d'afficher des messages techniques comme "Network Error" brut
        const errorMessage = String(error.message);
        const technicalMessages = ['Network Error', 'timeout', 'ECONNREFUSED', 'ENOTFOUND'];
        const isTechnical = technicalMessages.some((msg) =>
          errorMessage.toLowerCase().includes(msg.toLowerCase()),
        );
        userMessage = isTechnical
          ? 'API inaccessible. Veuillez vérifier votre connexion.'
          : errorMessage;
      }
      // Cas 4: Aucun message disponible
      else {
        userMessage = 'Une erreur est survenue. Veuillez réessayer.';
      }

      /**
       * Afficher un toast d'erreur avec le message utilisateur-friendly
       * toast.error() affiche une notification rouge en bas de l'écran
       */
      toast.error(userMessage);
    }

    return Promise.reject(error);
  }
);

export const adminApi = {
  // ============================================
  // AUTH
  // ============================================

  /**
   * Connexion admin
   *
   * Le backend va:
   * 1. Valider les identifiants
   * 2. Générer access + refresh tokens
   * 3. Les stocker dans des cookies httpOnly
   *
   * @param email - Email de l'admin
   * @param password - Mot de passe
   * @returns Infos utilisateur (tokens dans cookies)
   */
  login: async (
    email: string,
    password: string
  ): Promise<{ data: LoginResponse; status: number }> => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('LOGIN REQUEST', `${adminApiClient.defaults.baseURL}${ADMIN_LOGIN_ENDPOINT}`, {
          email,
        });
      }

      const response = await adminApiClient.post<LoginResponse>(
        ADMIN_LOGIN_ENDPOINT,
        { email, password }
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('LOGIN RESPONSE', response.status, response.data);
        console.log('✅ Connexion réussie, cookies définis par le backend');
      }

      return { data: response.data, status: response.status };
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('❌ Erreur de connexion admin:', err);
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
        throw new Error(
          'Impossible de contacter le serveur. Vérifiez que le backend est démarré.'
        );
      }
      throw err;
    }
  },

  /**
   * Rafraîchir les tokens
   *
   * Le refresh token est envoyé automatiquement via cookie.
   * Le backend effectue une rotation et met à jour les cookies.
   */
  refresh: async (): Promise<void> => {
    await adminApiClient.post(ADMIN_REFRESH_ENDPOINT);
  },

  /**
   * Déconnexion admin
   *
   * Le backend va:
   * 1. Révoquer le refresh token en base
   * 2. Supprimer les cookies
   */
  logout: async (): Promise<void> => {
    try {
      await adminApiClient.post(ADMIN_LOGOUT_ENDPOINT);
    } catch (error) {
      // Ignorer les erreurs de logout (peut échouer si déjà déconnecté)
      console.warn('Logout error (ignoré):', error);
    }
    // Rediriger vers login
    if (typeof window !== 'undefined') {
      const adminBasePath =
        process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
      window.location.href = `/${adminBasePath}/login`;
    }
  },

  /**
   * Vérifier code 2FA après login - Crée la session complète
   *
   * @param userId - ID de l'utilisateur (obtenu depuis le login précédent)
   * @param code - Code TOTP à 6 chiffres
   * @returns Informations utilisateur (tokens dans cookies)
   */
  verifyTwoFactor: async (
    userId: string,
    code: string
  ): Promise<{ data: LoginResponse; status: number }> => {
    const response = await adminApiClient.post(ADMIN_2FA_VERIFY_ENDPOINT, {
      userId,
      code,
    });
    return { data: response.data, status: response.status };
  },

  /**
   * Setup 2FA - Génère un secret TOTP et un QR code
   *
   * @returns QR code en base64, secret temporaire, et URL otpauth
   */
  setupTwoFactor: async (): Promise<{
    data: {
      qrCode: string;
      secret: string;
      otpAuthUrl: string;
    };
    status: number;
  }> => {
    const response = await adminApiClient.post(ADMIN_2FA_SETUP_ENDPOINT);
    return { data: response.data, status: response.status };
  },

  /**
   * Activer 2FA - Valide le code TOTP et active le 2FA
   *
   * @param code - Code TOTP à 6 chiffres
   * @param secret - Secret temporaire du setup (base32)
   * @returns Confirmation d'activation
   */
  enableTwoFactor: async (
    code: string,
    secret: string
  ): Promise<{ data: { enabled: boolean }; status: number }> => {
    const response = await adminApiClient.post(ADMIN_2FA_ENABLE_ENDPOINT, {
      code,
      secret,
    });
    return { data: response.data, status: response.status };
  },

  /**
   * Désactiver 2FA
   *
   * @returns Confirmation de désactivation
   */
  disableTwoFactor: async (): Promise<{
    data: { disabled: boolean };
    status: number;
  }> => {
    const response = await adminApiClient.post(ADMIN_2FA_DISABLE_ENDPOINT);
    return { data: response.data, status: response.status };
  },

  /**
   * Vérifier la session / Obtenir les infos de l'admin connecté
   *
   * Utilisé pour:
   * - Vérifier si la session est valide au chargement
   * - Obtenir les infos utilisateur pour le header/sidebar
   *
   * @returns Infos de l'admin ou null si non authentifié
   */
  getMe: async (): Promise<AdminMeResponse | null> => {
    try {
      const response = await adminApiClient.get<AdminMeResponse>(ADMIN_ME_ENDPOINT);
      return response.data;
    } catch (error) {
      // 401 = non authentifié (géré par l'intercepteur)
      return null;
    }
  },

  /**
   * Vérifier si l'admin est authentifié
   *
   * @returns true si authentifié, false sinon
   */
  isAuthenticated: async (): Promise<boolean> => {
    const me = await adminApi.getMe();
    return me !== null;
  },

  // ============================================
  // DASHBOARD
  // ============================================

  getDashboardStats: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/dashboard`);
    return response.data;
  },

  // ============================================
  // USERS
  // ============================================

  getUsers: async (page = 1, limit = 20, search?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/users/${id}`);
    return response.data;
  },

  banUser: async (id: string, reason?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(
      `/${adminBasePath}/users/${id}/ban`,
      { reason }
    );
    return response.data;
  },

  unbanUser: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(
      `/${adminBasePath}/users/${id}/unban`
    );
    return response.data;
  },

  // ============================================
  // ITEMS
  // ============================================

  getItems: async (
    page = 1,
    limit = 20,
    filters?: { ownerId?: string; category?: string; status?: string }
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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

  getItemById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/items/${id}`);
    return response.data;
  },

  archiveItem: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(
      `/${adminBasePath}/items/${id}/archive`
    );
    return response.data;
  },

  deleteItem: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(
      `/${adminBasePath}/items/${id}`
    );
    return response.data;
  },

  // ============================================
  // REPORTS
  // ============================================

  getReports: async (page = 1, limit = 20, resolved?: boolean) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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

  getReportById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/reports/${id}`);
    return response.data;
  },

  resolveReport: async (id: string, banUser = false) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(
      `/${adminBasePath}/reports/${id}/resolve`,
      { banUser }
    );
    return response.data;
  },

  deleteReport: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(`/${adminBasePath}/reports/${id}`);
    return response.data;
  },

  // ============================================
  // THEMES
  // ============================================

  getThemes: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/themes`);
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  getThemeById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(
      `/${adminBasePath}/themes/${id}`,
      payload
    );
    return response.data;
  },

  activateTheme: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(
      `/${adminBasePath}/themes/${id}/activate`
    );
    return response.data;
  },

  deleteTheme: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(
      `/${adminBasePath}/themes/${id}`
    );
    return response.data;
  },

  generateThemeSuggestions: async (id: string, locales?: string[]) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.post(
      `/${adminBasePath}/themes/${id}/suggestions`,
      { locales }
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
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(
      `/${adminBasePath}/themes/${id}/suggestions/stats`
    );
    return response.data;
  },

  generateTheme: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    try {
      const response = await adminApiClient.post(
        `/${adminBasePath}/themes/generate`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('❌ Erreur génération thème:', err);
      throw err;
    }
  },

  generateMonthlyThemes: async (month?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
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

  // ============================================
  // ECO CONTENT
  // ============================================

  getEcoContent: async (page = 1, limit = 20) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await adminApiClient.get(
      `/${adminBasePath}/eco?${params.toString()}`
    );
    return response.data;
  },

  getEcoContentById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/eco/${id}`);
    return response.data;
  },

  createEcoContent: async (data: {
    title: string;
    url: string;
    kind?: string;
    locale?: string;
    summary?: string;
    source?: string;
    tags?: string[];
    published?: boolean;
  }) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.post(`/${adminBasePath}/eco`, data);
    return response.data;
  },

  updateEcoContent: async (
    id: string,
    data: {
      title?: string;
      url?: string;
      kind?: string;
      locale?: string;
      summary?: string;
      source?: string;
      tags?: string[];
      published?: boolean;
    }
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.patch(`/${adminBasePath}/eco/${id}`, data);
    return response.data;
  },

  deleteEcoContent: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(`/${adminBasePath}/eco/${id}`);
    return response.data;
  },

  // ============================================
  // EXCHANGES
  // ============================================

  getExchanges: async (
    page = 1,
    limit = 20,
    filters?: { status?: string; requesterId?: string; responderId?: string }
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requesterId) params.append('requesterId', filters.requesterId);
    if (filters?.responderId) params.append('responderId', filters.responderId);
    const response = await adminApiClient.get(
      `/${adminBasePath}/exchanges?${params.toString()}`
    );
    return response.data;
  },

  getExchangeById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/exchanges/${id}`);
    return response.data;
  },

  deleteExchange: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(
      `/${adminBasePath}/exchanges/${id}`
    );
    return response.data;
  },

  // ============================================
  // COMMUNITY
  // ============================================

  getThreads: async (page = 1, limit = 20, scope?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (scope) params.append('scope', scope);
    const response = await adminApiClient.get(
      `/${adminBasePath}/community/threads?${params.toString()}`
    );
    return response.data;
  },

  getThreadById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(
      `/${adminBasePath}/community/threads/${id}`
    );
    return response.data;
  },

  deleteThread: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(
      `/${adminBasePath}/community/threads/${id}`
    );
    return response.data;
  },

  getPosts: async (
    page = 1,
    limit = 20,
    filters?: { threadId?: string; authorId?: string }
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.threadId) params.append('threadId', filters.threadId);
    if (filters?.authorId) params.append('authorId', filters.authorId);
    const response = await adminApiClient.get(
      `/${adminBasePath}/community/posts?${params.toString()}`
    );
    return response.data;
  },

  getPostById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(
      `/${adminBasePath}/community/posts/${id}`
    );
    return response.data;
  },

  deletePost: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.delete(
      `/${adminBasePath}/community/posts/${id}`
    );
    return response.data;
  },

  // ============================================
  // ANALYTICS
  // ============================================

  getAnalyticsOverview: async (startDate?: string, endDate?: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await adminApiClient.get(
      `/${adminBasePath}/analytics/overview?${params.toString()}`
    );
    return response.data;
  },

  getUserAnalytics: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/analytics/users`);
    return response.data;
  },

  getItemAnalytics: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/analytics/items`);
    return response.data;
  },

  getExchangeAnalytics: async () => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/analytics/exchanges`);
    return response.data;
  },

  // ============================================
  // LOGS
  // ============================================

  getLogs: async (
    page = 1,
    limit = 50,
    filters?: {
      adminId?: string;
      actionType?: string;
      targetType?: string;
      startDate?: string;
      endDate?: string;
      requestId?: string;
    },
  ) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.adminId) params.append('adminId', filters.adminId);
    if (filters?.actionType) params.append('actionType', filters.actionType);
    if (filters?.targetType) params.append('targetType', filters.targetType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.requestId) params.append('requestId', filters.requestId);
    const response = await adminApiClient.get(
      `/${adminBasePath}/logs?${params.toString()}`
    );
    return response.data;
  },

  getLogById: async (id: string) => {
    const adminBasePath =
      process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
    const response = await adminApiClient.get(`/${adminBasePath}/logs/${id}`);
    return response.data;
  },
};

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
import {
  parseApiError,
  formatErrorMessageForToast,
  logApiError,
} from './parse-api-error';

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

/**
 * Construire l'URL de base de l'API admin
 *
 * IMPORTANT:
 * - baseURL = ${API_ORIGIN}/api/v1
 * - ADMIN_BASE_PATH sert UNIQUEMENT au routing Next.js (UI)
 * - Les endpoints API utilisent /admin/... (chemin fixe du backend)
 * - TOUJOURS utiliser /api/v1 comme préfixe pour toutes les requêtes admin
 */
const getApiBaseURL = () => {
  // En production, utiliser l'URL de production
  // En dev, utiliser localhost ou l'URL définie dans .env
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Nettoyer l'URL (enlever trailing slash)
  const cleanUrl = apiUrl.replace(/\/$/, '');

  // IMPORTANT: Toujours ajouter /api/v1 si pas déjà présent
  // Même si l'URL contient /api/v1, on s'assure qu'elle est correcte
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }

  // Si l'URL contient /api/v1 quelque part, l'extraire jusqu'à /api/v1
  if (cleanUrl.includes('/api/v1')) {
    const match = cleanUrl.match(/^(https?:\/\/[^\/]+)\/api\/v1/);
    if (match) {
      return `${match[1]}/api/v1`;
    }
  }

  // Sinon, ajouter /api/v1
  return `${cleanUrl}/api/v1`;
};

// Log en développement ET production pour debug
if (typeof window !== 'undefined') {
  const baseURL = getApiBaseURL();
  if (process.env.NODE_ENV !== 'production') {
    console.info('🔧 Admin API Base URL:', baseURL);
  } else {
    // En production, log une seule fois au chargement
    console.log('[Admin API] Base URL:', baseURL);
  }
}

export const ADMIN_LOGIN_ENDPOINT = '/auth/admin/login';
export const ADMIN_REFRESH_ENDPOINT = '/auth/admin/refresh';
export const ADMIN_LOGOUT_ENDPOINT = '/auth/admin/logout';
export const ADMIN_ME_ENDPOINT = '/auth/admin/me';
export const ADMIN_2FA_SETUP_ENDPOINT = '/auth/admin/2fa/setup';
export const ADMIN_2FA_ENABLE_ENDPOINT = '/auth/admin/2fa/enable';
export const ADMIN_2FA_VERIFY_ENDPOINT = '/auth/admin/2fa/verify';
export const ADMIN_2FA_DISABLE_ENDPOINT = '/auth/admin/2fa/disable';
export const ADMIN_2FA_REGENERATE_BACKUP_CODES_ENDPOINT = '/auth/admin/2fa/regenerate-backup-codes';
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
  // IMPORTANT: Ne pas définir Content-Type par défaut
  // Il sera ajouté automatiquement pour POST/PATCH/PUT/DELETE par Axios
  // Cela évite d'envoyer un body vide sur les GET qui pourrait causer des 422
});

/**
 * Intercepteur de requête pour ajouter le token CSRF
 * - Récupère le token depuis le cookie XSRF-TOKEN
 * - Si absent, en récupère un nouveau via /security/csrf
 * - Ajoute le header X-CSRF-Token sur toutes les requêtes mutantes
 * - Log les requêtes en développement uniquement
 */
adminApiClient.interceptors.request.use(
  async (config) => {
    // Log en DEV et PROD (sans secrets)
    if (config.url && config.method) {
      const fullUrl = `${adminApiClient.defaults.baseURL}${config.url}`;
      if (process.env.NODE_ENV !== 'production') {
        console.info('🔧 [Admin API] Request:', config.method.toUpperCase(), fullUrl);
      } else {
        // Log minimal en prod (pour debugging production)
        // Utiliser console.log avec un préfixe pour faciliter le filtrage
        console.log(`[Admin API] ${config.method.toUpperCase()} ${config.url}`);
      }
    }

    // Méthodes HTTP mutantes nécessitant CSRF et Content-Type
    const mutatingMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];

    // Ajouter Content-Type uniquement pour les méthodes mutantes
    if (config.method && mutatingMethods.includes(config.method.toUpperCase())) {
      // Ajouter Content-Type pour les requêtes avec body
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      // Ajouter CSRF token
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
    } else {
      // Pour les GET, s'assurer qu'on n'envoie pas Content-Type
      // Cela évite que le backend essaie de parser un body vide
      if (config.headers && 'Content-Type' in config.headers) {
        delete config.headers['Content-Type'];
      }
      // S'assurer qu'aucun body n'est envoyé sur GET
      if (config.data !== undefined && (config.data === null || (typeof config.data === 'object' && Object.keys(config.data).length === 0))) {
        delete config.data;
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

    // Gérer les erreurs 422 (Unprocessable Entity) - généralement validation ou CSRF/cookie
    // IMPORTANT: Ne pas retry, arrêter immédiatement pour éviter les boucles infinies
    if (error.response?.status === 422) {
      const errorData = error.response?.data as { message?: string; code?: string; requestId?: string } | undefined;
      console.error('[Admin API] Erreur 422 détectée, arrêt immédiat:', {
        url: originalRequest?.url,
        message: errorData?.message || 'Erreur de validation',
        requestId: errorData?.requestId
      });

      // Afficher un message spécifique pour les 422
      const isValidationError = errorData?.code === 'VALIDATION_ERROR';
      const message = isValidationError
        ? 'Erreur de validation des données. Veuillez vérifier votre connexion et les cookies.'
        : 'Erreur de traitement (422). Vérifiez votre session et rechargez la page.';

      if (!originalRequest?._skipErrorToast) {
        toast.error(message);
      }

      // Ne pas retry sur 422
      return Promise.reject(error);
    }

    // Si erreur 401 et pas déjà en retry
    if (error.response?.status === 401 && !originalRequest?._retry) {
      const url = originalRequest?.url || '';

      // Cas explicite: /auth/admin/me ne doit PAS tenter de refresh
      // (sinon boucle inutile sur la page de login quand aucune session n'existe)
      if (url.includes('/auth/admin/me')) {
        console.log('[Admin API] 401 sur /auth/admin/me, arrêt (pas de refresh)');
        return Promise.reject(error);
      }

      // Ne pas retry pour les endpoints d'auth eux-mêmes
      if (
        originalRequest?.url?.includes('/auth/admin/login') ||
        originalRequest?.url?.includes('/auth/admin/refresh')
      ) {
        // Pour /auth/admin/me, si on reçoit 401, c'est que le token est vraiment invalide
        // Arrêter immédiatement pour éviter les boucles
        if (originalRequest?.url?.includes('/auth/admin/me')) {
          console.log('[Admin API] 401 sur /auth/admin/me, arrêt immédiat (pas de retry)');
          if (typeof window !== 'undefined') {
            const adminBasePath =
              process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
            window.location.href = `/${adminBasePath}/login`;
          }
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Tenter de rafraîchir le token via endpoint exact
        await adminApiClient.post(ADMIN_REFRESH_ENDPOINT);
        // Réessayer la requête originale
        return adminApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh échoué → rediriger vers login admin et arrêter
        console.log('[Admin API] Refresh token échoué, redirection vers login');
        if (typeof window !== 'undefined') {
          const adminBasePath =
            process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ADMIN_BASE_PATH;
          window.location.href = `/${adminBasePath}/login`;
        }
        return Promise.reject(refreshError);
      }
    }

    // Ne pas refresh sur 404/403 (ce ne sont pas des erreurs d'auth)
    if (error.response?.status === 404 || error.response?.status === 403) {
      return Promise.reject(error);
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
     * FORMAT BACKEND STANDARDISÉ:
     * Le backend retourne toujours un format standardisé:
     * {
     *   "code": "AUTH_INVALID_CREDENTIALS" | "VALIDATION_ERROR" | ...,
     *   "message": "Texte lisible user",
     *   "requestId": "...",
     *   "details": [{ "field": "...", "issue": "..." }] // Optionnel
     * }
     */
    const shouldShowToast =
      error.response?.status !== 401 && // Ne pas afficher pour les 401 (gérées par le rafraîchissement)
      error.response?.status !== 403 && // Ne pas afficher pour les 403 CSRF (gérées par le retry)
      !originalRequest?._skipErrorToast; // Ne pas afficher pour les requêtes silencieuses

    if (shouldShowToast) {
      // Parser l'erreur avec le helper centralisé
      const parsedError = parseApiError(error);

      // Logger l'erreur en dev uniquement
      logApiError(error, parsedError);

      // Formater le message avec requestId pour le toast
      const toastMessage = formatErrorMessageForToast(parsedError);

      /**
       * Afficher un toast d'erreur avec le message utilisateur-friendly
       * toast.error() affiche une notification rouge en bas de l'écran
       */
      toast.error(toastMessage);
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
   * @returns Confirmation d'activation avec backup codes
   */
  enableTwoFactor: async (
    code: string,
    secret: string
  ): Promise<{ data: { enabled: boolean; backupCodes: string[] }; status: number }> => {
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
   * Régénérer les backup codes 2FA
   *
   * @returns Nouveaux backup codes en clair
   */
  regenerateBackupCodes: async (): Promise<{
    data: { backupCodes: string[] };
    status: number;
  }> => {
    const response = await adminApiClient.post(ADMIN_2FA_REGENERATE_BACKUP_CODES_ENDPOINT);
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
      const response = await adminApiClient.get<AdminMeResponse>(ADMIN_ME_ENDPOINT, {
        _skipErrorToast: true, // Ne pas afficher de toast pour getMe (géré par AdminGuard)
      } as any);
      return response.data;
    } catch (error: any) {
      // 401 = non authentifié (géré par l'intercepteur)
      // 422 = erreur de validation/CSRF (arrêt immédiat, pas de retry)
      if (error.response?.status === 422) {
        console.error('[Admin API] Erreur 422 sur /auth/admin/me:', error.response?.data);
        // Retourner null pour arrêter la boucle
        return null;
      }
      // 401 = non authentifié (géré par l'intercepteur qui redirige)
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
    const response = await adminApiClient.get('/admin/dashboard');
    return response.data;
  },

  // ============================================
  // USERS
  // ============================================

  getUsers: async (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    const response = await adminApiClient.get(
      `/admin/users?${params.toString()}`
    );
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  banUser: async (id: string, reason?: string) => {
    const response = await adminApiClient.patch(
      `/admin/users/${id}/ban`,
      { reason }
    );
    return response.data;
  },

  unbanUser: async (id: string) => {
    const response = await adminApiClient.patch(
      `/admin/users/${id}/unban`
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    const response = await adminApiClient.get(
      `/admin/items?${params.toString()}`
    );
    return response.data;
  },

  getItemById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/items/${id}`);
    return response.data;
  },

  archiveItem: async (id: string) => {
    const response = await adminApiClient.patch(
      `/admin/items/${id}/archive`
    );
    return response.data;
  },

  deleteItem: async (id: string) => {
    const response = await adminApiClient.delete(
      `/admin/items/${id}`
    );
    return response.data;
  },

  // ============================================
  // REPORTS
  // ============================================

  getReports: async (page = 1, limit = 20, resolved?: boolean) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (resolved !== undefined) params.append('resolved', resolved.toString());
    const response = await adminApiClient.get(
      `/admin/reports?${params.toString()}`
    );
    return response.data;
  },

  getReportById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/reports/${id}`);
    return response.data;
  },

  resolveReport: async (id: string, banUser = false) => {
    const response = await adminApiClient.patch(
      `/admin/reports/${id}/resolve`,
      { banUser }
    );
    return response.data;
  },

  deleteReport: async (id: string) => {
    const response = await adminApiClient.delete(`/admin/reports/${id}`);
    return response.data;
  },

  // ============================================
  // THEMES
  // ============================================

  getThemes: async () => {
    const response = await adminApiClient.get('/admin/themes');
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  getThemeById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/themes/${id}`);
    return response.data;
  },

  createTheme: async (payload: {
    title: string;
    slug: string;
    startOfWeek: string;
    impactText?: string;
    isActive?: boolean;
  }) => {
    const response = await adminApiClient.post(
      '/admin/themes',
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
    const response = await adminApiClient.patch(
      `/admin/themes/${id}`,
      payload
    );
    return response.data;
  },

  activateTheme: async (id: string) => {
    const response = await adminApiClient.patch(
      `/admin/themes/${id}/activate`
    );
    return response.data;
  },

  deleteTheme: async (id: string) => {
    const response = await adminApiClient.delete(
      `/admin/themes/${id}`
    );
    return response.data;
  },

  generateThemeSuggestions: async (id: string, locales?: string[]) => {
    const response = await adminApiClient.post(
      `/admin/themes/${id}/suggestions`,
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
    });
    const response = await adminApiClient.get(
      `/admin/themes/${id}/suggestions?${params.toString()}`
    );
    return response.data;
  },

  getThemeSuggestionStats: async (id: string) => {
    const response = await adminApiClient.get(
      `/admin/themes/${id}/suggestions/stats`
    );
    return response.data;
  },

  generateTheme: async () => {
    try {
      const response = await adminApiClient.post(
        '/admin/themes/generate'
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('❌ Erreur génération thème:', err);
      throw err;
    }
  },

  generateMonthlyThemes: async (month?: string) => {
    try {
      const response = await adminApiClient.post(
        '/admin/themes/generate-monthly',
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await adminApiClient.get(
      `/admin/eco?${params.toString()}`
    );
    return response.data;
  },

  getEcoContentById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/eco/${id}`);
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
    const response = await adminApiClient.post('/admin/eco', data);
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
    const response = await adminApiClient.patch(`/admin/eco/${id}`, data);
    return response.data;
  },

  deleteEcoContent: async (id: string) => {
    const response = await adminApiClient.delete(`/admin/eco/${id}`);
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requesterId) params.append('requesterId', filters.requesterId);
    if (filters?.responderId) params.append('responderId', filters.responderId);
    const response = await adminApiClient.get(
      `/admin/exchanges?${params.toString()}`
    );
    return response.data;
  },

  getExchangeById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/exchanges/${id}`);
    return response.data;
  },

  deleteExchange: async (id: string) => {
    const response = await adminApiClient.delete(
      `/admin/exchanges/${id}`
    );
    return response.data;
  },

  // ============================================
  // COMMUNITY
  // ============================================

  getThreads: async (page = 1, limit = 20, scope?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (scope) params.append('scope', scope);
    const response = await adminApiClient.get(
      `/admin/community/threads?${params.toString()}`
    );
    return response.data;
  },

  getThreadById: async (id: string) => {
    const response = await adminApiClient.get(
      `/admin/community/threads/${id}`
    );
    return response.data;
  },

  deleteThread: async (id: string) => {
    const response = await adminApiClient.delete(
      `/admin/community/threads/${id}`
    );
    return response.data;
  },

  getPosts: async (
    page = 1,
    limit = 20,
    filters?: { threadId?: string; authorId?: string }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.threadId) params.append('threadId', filters.threadId);
    if (filters?.authorId) params.append('authorId', filters.authorId);
    const response = await adminApiClient.get(
      `/admin/community/posts?${params.toString()}`
    );
    return response.data;
  },

  getPostById: async (id: string) => {
    const response = await adminApiClient.get(
      `/admin/community/posts/${id}`
    );
    return response.data;
  },

  deletePost: async (id: string) => {
    const response = await adminApiClient.delete(
      `/admin/community/posts/${id}`
    );
    return response.data;
  },

  // ============================================
  // ANALYTICS
  // ============================================

  getAnalyticsOverview: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await adminApiClient.get(
      `/admin/analytics/overview?${params.toString()}`
    );
    return response.data;
  },

  getUserAnalytics: async () => {
    const response = await adminApiClient.get('/admin/analytics/users');
    return response.data;
  },

  getItemAnalytics: async () => {
    const response = await adminApiClient.get('/admin/analytics/items');
    return response.data;
  },

  getExchangeAnalytics: async () => {
    const response = await adminApiClient.get('/admin/analytics/exchanges');
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
      `/admin/logs?${params.toString()}`
    );
    return response.data;
  },

  getLogById: async (id: string) => {
    const response = await adminApiClient.get(`/admin/logs/${id}`);
    return response.data;
  },
};

/**
 * FICHIER: lib/api.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le client API principal pour communiquer avec le backend NestJS.
 * Il gère automatiquement l'authentification, le rafraîchissement des tokens JWT,
 * et la gestion des erreurs. C'est le point d'entrée unique pour toutes les requêtes HTTP
 * vers le backend, garantissant une gestion cohérente de l'authentification et des erreurs.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Client Axios configuré avec l'URL de base de l'API
 * - Intercepteurs pour ajouter automatiquement le token JWT à toutes les requêtes
 * - Rafraîchissement automatique des tokens expirés (access token)
 * - File d'attente pour les requêtes en attente de rafraîchissement (évite les doublons)
 * - Gestion des erreurs avec affichage de toasts pour l'utilisateur
 * - Méthodes pour tous les endpoints de l'API (auth, items, exchanges, chat, AI, users)
 * - Gestion automatique des tokens (sauvegarde, récupération, suppression)
 *
 * ARCHITECTURE:
 * - Pattern Singleton: une seule instance partagée dans toute l'application
 * - Intercepteurs Axios: logique centralisée pour toutes les requêtes
 * - File d'attente: évite les rafraîchissements multiples simultanés
 *
 * SÉCURITÉ:
 * - Tokens stockés dans localStorage (accessible uniquement côté client)
 * - Rafraîchissement automatique des tokens expirés (access token)
 * - Redirection vers /login si l'authentification échoue définitivement
 * - Tokens envoyés dans le header Authorization (Bearer token)
 *
 * FLUX D'AUTHENTIFICATION:
 * 1. Requête avec access token dans le header
 * 2. Si 401 (token expiré), rafraîchir avec refresh token
 * 3. Si refresh réussit, réessayer la requête avec le nouveau access token
 * 4. Si refresh échoue, nettoyer les tokens et rediriger vers /login
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
 * Client API principal pour communiquer avec le backend NestJS.
 * Gère l'authentification, le rafraîchissement des tokens JWT, et les erreurs.
 * Utilise le pattern Singleton (une seule instance partagée).
 *
 * RESPONSABILITÉS:
 * - Configuration du client Axios avec l'URL de base
 * - Ajout automatique du token JWT aux requêtes
 * - Rafraîchissement automatique des tokens expirés
 * - Gestion de la file d'attente pour éviter les rafraîchissements multiples
 * - Gestion des erreurs avec affichage de toasts
 * - Méthodes pour tous les endpoints de l'API
 */
class ApiClient {
  /**
   * PROPRIÉTÉ: client
   *
   * Instance Axios configurée pour les requêtes HTTP.
   * Cette instance est utilisée pour toutes les requêtes vers le backend.
   * Elle est configurée avec l'URL de base, le timeout, et les headers par défaut.
   */
  public client: AxiosInstance;

  /**
   * PROPRIÉTÉ: isRefreshing
   *
   * Flag pour éviter les rafraîchissements multiples simultanés.
   * Si plusieurs requêtes échouent avec un 401 en même temps, on ne veut
   * rafraîchir le token qu'une seule fois. Les autres requêtes attendent
   * dans la file d'attente (failedQueue).
   *
   * true = un rafraîchissement est en cours
   * false = aucun rafraîchissement en cours
   */
  private isRefreshing = false;

  /**
   * PROPRIÉTÉ: failedQueue
   *
   * File d'attente pour les requêtes qui attendent le rafraîchissement du token.
   * Quand plusieurs requêtes échouent avec un 401 en même temps:
   * - La première déclenche le rafraîchissement
   * - Les autres sont mises en file d'attente
   * - Une fois le nouveau token obtenu, toutes les requêtes en attente sont réessayées
   *
   * STRUCTURE:
   * - resolve: fonction à appeler quand le nouveau token est disponible
   * - reject: fonction à appeler si le rafraîchissement échoue
   */
  private failedQueue: Array<{
    resolve: (value?: any) => void; // Appelée avec le nouveau access token
    reject: (error?: any) => void; // Appelée si le rafraîchissement échoue
  }> = [];

  /**
   * CONSTRUCTEUR
   *
   * Initialise le client Axios et configure les intercepteurs.
   * Cette méthode est appelée une seule fois lors de la création de l'instance.
   */
  constructor() {
    /**
     * Créer l'instance Axios avec la configuration de base
     * axios.create() crée une nouvelle instance avec des paramètres par défaut
     * qui seront appliqués à toutes les requêtes faites avec cette instance
     */
    this.client = axios.create({
      /**
       * URL de base de l'API
       * - process.env.NEXT_PUBLIC_API_URL: variable d'environnement (ex: https://api.example.com)
       * - Fallback: http://localhost:4000/api/v1 (pour le développement local)
       *
       * NOTE: NEXT_PUBLIC_* permet d'exposer la variable au client (browser)
       */
      baseURL:
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',

      /**
       * Timeout de 10 secondes (10000 millisecondes)
       * Si une requête prend plus de 10 secondes, elle sera annulée automatiquement
       * Cela évite que les requêtes pendent indéfiniment
       */
      timeout: 10000, // 10 secondes

      /**
       * Headers par défaut pour toutes les requêtes
       * Content-Type: application/json indique que le corps de la requête est en JSON
       */
      headers: {
        'Content-Type': 'application/json',
      },
    });

    /**
     * Configurer les intercepteurs (request et response)
     * Les intercepteurs permettent d'exécuter du code avant chaque requête
     * et après chaque réponse, sans modifier le code des méthodes individuelles
     */
    this.setupInterceptors();
  }

  // ============================================
  // MÉTHODE PRIVÉE: setupInterceptors
  // ============================================

  /**
   * MÉTHODE PRIVÉE: setupInterceptors
   *
   * Configure les intercepteurs Axios pour:
   * - Ajouter automatiquement le token JWT aux requêtes (intercepteur de requête)
   * - Gérer les erreurs 401 (non autorisé) avec rafraîchissement automatique (intercepteur de réponse)
   * - Afficher les erreurs à l'utilisateur via des toasts (intercepteur de réponse)
   *
   * INTERCEPTEURS:
   * - Request interceptor: exécuté AVANT chaque requête HTTP
   * - Response interceptor: exécuté APRÈS chaque réponse HTTP (succès ou erreur)
   *
   * AVANTAGES:
   * - Logique centralisée: pas besoin d'ajouter le token dans chaque méthode
   * - Gestion automatique: rafraîchissement transparent pour l'utilisateur
   * - Cohérence: toutes les requêtes suivent les mêmes règles
   */
  private setupInterceptors() {
    // ============================================
    // INTERCEPTEUR DE REQUÊTE (REQUEST INTERCEPTOR)
    // ============================================
    /**
     * Intercepteur exécuté AVANT chaque requête HTTP.
     * Il ajoute automatiquement le token JWT dans le header Authorization.
     *
     * FLUX:
     * 1. Récupérer le access token depuis localStorage
     * 2. Si un token existe, l'ajouter dans le header Authorization
     * 3. Retourner la configuration modifiée
     */
    this.client.interceptors.request.use(
      /**
       * Fonction appelée avant chaque requête
       * @param config - Configuration de la requête Axios (headers, URL, méthode, etc.)
       * @returns Configuration modifiée avec le token ajouté
       */
      (config) => {
        /**
         * Récupérer le access token depuis localStorage
         * getAccessToken() gère la vérification que window est défini (SSR-safe)
         */
        const token = this.getAccessToken();

        /**
         * Si un token existe, l'ajouter dans le header Authorization
         * Format: "Bearer <token>"
         * Le backend attend ce format pour authentifier l'utilisateur
         */
        if (token) {
          /**
           * Ajouter le token dans le header Authorization
           * config.headers contient tous les headers de la requête
           * Authorization est le header standard pour les tokens JWT
           */
          config.headers.Authorization = `Bearer ${token}`;
        }

        /**
         * Retourner la configuration modifiée
         * Axios utilisera cette configuration pour faire la requête
         */
        return config;
      },
      /**
       * Fonction appelée en cas d'erreur lors de la préparation de la requête
       * (rare, mais peut arriver si la configuration est invalide)
       * @param error - Erreur lors de la préparation de la requête
       * @returns Promise rejetée avec l'erreur
       */
      (error) => {
        /**
         * En cas d'erreur lors de la préparation de la requête, rejeter la Promise
         * Cela permet au code appelant de gérer l'erreur
         */
        return Promise.reject(error);
      }
    );

    // ============================================
    // INTERCEPTEUR DE RÉPONSE (RESPONSE INTERCEPTOR)
    // ============================================
    /**
     * Intercepteur exécuté APRÈS chaque réponse HTTP (succès ou erreur).
     * Il gère les erreurs de réponse, notamment les erreurs 401 (token expiré),
     * en rafraîchissant automatiquement le token et en réessayant la requête.
     *
     * FLUX PRINCIPAL:
     * 1. Si la réponse est réussie (2xx), la retourner telle quelle
     * 2. Si erreur 401 (token expiré):
     *    a. Vérifier si un rafraîchissement est déjà en cours
     *    b. Si oui, mettre la requête en file d'attente
     *    c. Si non, démarrer un nouveau rafraîchissement
     *    d. Une fois le nouveau token obtenu, réessayer toutes les requêtes en attente
     * 3. Si le rafraîchissement échoue, nettoyer les tokens et rediriger vers /login
     * 4. Pour les autres erreurs, afficher un toast à l'utilisateur
     */
    this.client.interceptors.response.use(
      /**
       * Fonction appelée quand la réponse est réussie (status 2xx)
       * On retourne simplement la réponse sans modification
       * @param response - Réponse HTTP réussie
       * @returns Réponse telle quelle
       */
      (response) => response,

      /**
       * Fonction appelée quand une erreur se produit (status 4xx, 5xx, ou erreur réseau)
       * Cette fonction est asynchrone car elle peut avoir besoin de rafraîchir le token
       * @param error - Erreur Axios (peut contenir response, request, message, etc.)
       * @returns Promise rejetée ou résolue selon le cas
       */
      async (error) => {
        /**
         * Sauvegarder la configuration de la requête originale
         * error.config contient toutes les informations de la requête (URL, méthode, headers, etc.)
         * On en a besoin pour réessayer la requête après le rafraîchissement du token
         */
        const originalRequest = error.config;

        // ============================================
        // CAS SPÉCIAL: Endpoint de rafraîchissement
        // ============================================
        /**
         * Ne pas intercepter les erreurs de l'endpoint /auth/refresh lui-même
         * pour éviter les boucles infinies.
         *
         * PROBLÈME ÉVITÉ:
         * Si l'endpoint /auth/refresh échoue avec un 401, on ne veut pas essayer
         * de le rafraîchir à nouveau (ce qui créerait une boucle infinie).
         *
         * CONDITIONS:
         * - originalRequest?.url?.includes('/auth/refresh'): l'URL contient '/auth/refresh'
         * - originalRequest?._skipAuthRefresh: la requête est marquée pour ignorer le rafraîchissement
         */
        if (
          originalRequest?.url?.includes('/auth/refresh') ||
          originalRequest?._skipAuthRefresh
        ) {
          /**
           * Si c'est un refresh qui échoue avec un 401, cela signifie que:
           * - Le refresh token est expiré ou invalide
           * - L'utilisateur doit se reconnecter
           *
           * Dans ce cas, nettoyer les tokens et rediriger vers /login
           */
          if (error.response?.status === 401) {
            /**
             * Supprimer les tokens du localStorage
             * clearTokens() supprime accessToken et refreshToken
             */
            this.clearTokens();

            /**
             * Rediriger vers /login seulement si on n'est pas déjà sur la page de login
             * Cela évite les redirections inutiles et les boucles
             *
             * typeof window !== 'undefined': vérifier que window existe (SSR-safe)
             * !window.location.pathname.includes('/login'): vérifier qu'on n'est pas déjà sur /login
             */
            if (
              typeof window !== 'undefined' &&
              !window.location.pathname.includes('/login')
            ) {
              /**
               * Rediriger vers la page de login
               * window.location.href force un rechargement complet de la page
               * (contrairement à Next.js router.push qui fait une navigation SPA)
               */
              window.location.href = '/login';
            }
          }

          /**
           * Rejeter la Promise pour que le code appelant puisse gérer l'erreur
           * On ne réessaie pas cette requête car c'est le rafraîchissement lui-même qui a échoué
           */
          return Promise.reject(error);
        }

        // ============================================
        // GESTION DES ERREURS 401 (TOKEN EXPIRÉ)
        // ============================================
        /**
         * Si l'erreur est 401 (non autorisé) et que la requête n'a pas déjà été réessayée,
         * tenter de rafraîchir le token et réessayer la requête.
         *
         * CONDITIONS:
         * - error.response?.status === 401: le serveur a retourné "Unauthorized"
         * - !originalRequest._retry: la requête n'a pas déjà été réessayée (évite les boucles)
         *
         * SCÉNARIOS:
         * 1. Un rafraîchissement est déjà en cours -> mettre en file d'attente
         * 2. Aucun rafraîchissement en cours -> démarrer un nouveau rafraîchissement
         */
        if (error.response?.status === 401 && !originalRequest._retry) {
          // ============================================
          // CAS 1: Un rafraîchissement est déjà en cours
          // ============================================
          /**
           * Si on est déjà en train de rafraîchir le token, mettre cette requête
           * en file d'attente. Elle sera réessayée une fois le nouveau token obtenu.
           *
           * POURQUOI:
           * Si plusieurs requêtes échouent avec un 401 en même temps, on ne veut
           * rafraîchir le token qu'une seule fois. Les autres requêtes attendent
           * dans la file d'attente et seront toutes réessayées avec le nouveau token.
           */
          if (this.isRefreshing) {
            /**
             * Créer une nouvelle Promise qui sera résolue quand le nouveau token sera disponible
             * Cette Promise est ajoutée à la file d'attente (failedQueue)
             */
            return new Promise((resolve, reject) => {
              /**
               * Ajouter la requête à la file d'attente
               * resolve: sera appelée avec le nouveau access token
               * reject: sera appelée si le rafraîchissement échoue
               */
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                /**
                 * Une fois le nouveau token obtenu (via resolve(token)),
                 * mettre à jour le header Authorization de la requête originale
                 * et la réessayer
                 */
                originalRequest.headers.Authorization = `Bearer ${token}`;
                /**
                 * Réessayer la requête originale avec le nouveau token
                 * this.client(originalRequest) exécute la requête avec la configuration originale
                 */
                return this.client(originalRequest);
              })
              .catch((err) => {
                /**
                 * Si le rafraîchissement échoue (via reject(err)),
                 * rejeter la Promise pour que le code appelant puisse gérer l'erreur
                 */
                return Promise.reject(err);
              });
          }

          // ============================================
          // CAS 2: Démarrer un nouveau rafraîchissement
          // ============================================
          /**
           * Aucun rafraîchissement n'est en cours, donc on démarre un nouveau rafraîchissement.
           *
           * FLUX:
           * 1. Marquer la requête comme réessayée (évite les boucles)
           * 2. Activer le flag isRefreshing (empêche d'autres requêtes de démarrer un nouveau rafraîchissement)
           * 3. Récupérer le refresh token depuis localStorage
           * 4. Appeler l'endpoint /auth/refresh pour obtenir de nouveaux tokens
           * 5. Sauvegarder les nouveaux tokens
           * 6. Réessayer la requête originale avec le nouveau token
           * 7. Traiter toutes les requêtes en file d'attente
           * 8. Désactiver le flag isRefreshing
           */
          originalRequest._retry = true; // Marquer comme réessayée pour éviter les boucles
          this.isRefreshing = true; // Activer le flag pour indiquer qu'un rafraîchissement est en cours

          try {
            /**
             * Récupérer le refresh token depuis localStorage
             * Le refresh token est utilisé pour obtenir un nouveau access token
             * Il a une durée de vie plus longue que l'access token
             */
            const refreshToken = this.getRefreshToken();

            /**
             * Si aucun refresh token n'est disponible, lancer une erreur
             * Cela signifie que l'utilisateur n'est pas authentifié ou que la session a expiré
             */
            if (!refreshToken) {
              throw new Error('Aucun refresh token disponible');
            }

            /**
             * Appeler l'endpoint de rafraîchissement
             * refreshToken() fait un appel POST /auth/refresh avec le refresh token
             * Le serveur retourne un nouveau access token et un nouveau refresh token
             */
            const response = await this.refreshToken(refreshToken);

            /**
             * Sauvegarder les nouveaux tokens dans localStorage
             * setTokens() sauvegarde accessToken et refreshToken
             * Ces tokens seront utilisés pour les prochaines requêtes
             */
            this.setTokens(response.accessToken, response.refreshToken);

            /**
             * Mettre à jour le header Authorization de la requête originale
             * avec le nouveau access token
             */
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;

            /**
             * Traiter toutes les requêtes en file d'attente avec le nouveau token
             * Chaque requête en attente reçoit le nouveau token via resolve()
             * Elles seront ensuite réessayées automatiquement
             */
            this.failedQueue.forEach(({ resolve }) => {
              resolve(response.accessToken); // Résoudre la Promise avec le nouveau token
            });

            /**
             * Vider la file d'attente et désactiver le flag
             * La file est vide car toutes les requêtes ont été traitées
             */
            this.failedQueue = [];
            this.isRefreshing = false;

            /**
             * Réessayer la requête originale avec le nouveau token
             * this.client(originalRequest) exécute la requête avec la configuration originale
             * mais avec le nouveau token dans le header Authorization
             */
            return this.client(originalRequest);
          } catch (refreshError) {
            // ============================================
            // ÉCHEC DU RAFRAÎCHISSEMENT
            // ============================================
            /**
             * Si le rafraîchissement échoue, cela signifie que:
             * - Le refresh token est expiré ou invalide
             * - L'utilisateur doit se reconnecter
             *
             * ACTIONS:
             * 1. Nettoyer les tokens (supprimer du localStorage)
             * 2. Rejeter toutes les requêtes en file d'attente
             * 3. Vider la file d'attente
             * 4. Désactiver le flag isRefreshing
             * 5. Rediriger vers /login (si pas déjà sur /login)
             */
            this.clearTokens(); // Supprimer les tokens du localStorage

            /**
             * Rejeter toutes les requêtes en file d'attente
             * Chaque requête en attente reçoit l'erreur via reject()
             * Le code appelant pourra gérer l'erreur (ex: afficher un message)
             */
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError); // Rejeter la Promise avec l'erreur
            });

            /**
             * Vider la file d'attente et désactiver le flag
             */
            this.failedQueue = [];
            this.isRefreshing = false;

            /**
             * Rediriger vers /login seulement si on n'est pas déjà sur la page de login
             * Cela évite les redirections inutiles et les boucles
             */
            if (
              typeof window !== 'undefined' &&
              !window.location.pathname.includes('/login')
            ) {
              window.location.href = '/login';
            }

            /**
             * Rejeter la Promise pour que le code appelant puisse gérer l'erreur
             */
            return Promise.reject(refreshError);
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
         * - Erreurs de l'endpoint /auth/refresh (pour éviter les toasts redondants)
         * - Requêtes marquées comme silencieuses (_skipErrorToast)
         *
         * PRIORITÉ DES MESSAGES:
         * 1. error.response?.data?.message: message d'erreur du serveur (prioritaire)
         * 2. error.message: message d'erreur générique (fallback)
         */
        if (
          error.response?.status !== 401 || // Ne pas afficher pour les 401 (gérées par le rafraîchissement)
          !originalRequest?.url?.includes('/auth/refresh') // Ne pas afficher pour les erreurs de refresh
        ) {
          /**
           * Si le serveur a retourné un message d'erreur personnalisé,
           * l'utiliser pour le toast
           */
          if (error.response?.data?.message) {
            /**
             * Ne pas afficher les erreurs pour les requêtes marquées comme silencieuses
             * _skipErrorToast est utilisé pour les requêtes où on ne veut pas afficher de toast
             * (ex: vérifications en arrière-plan, requêtes de polling, etc.)
             */
            if (!originalRequest?._skipErrorToast) {
              /**
               * Afficher un toast d'erreur avec le message du serveur
               * toast.error() affiche une notification rouge en bas de l'écran
               */
              toast.error(error.response.data.message);
            }
          } else if (error.message && !originalRequest?._skipErrorToast) {
          /**
           * Si pas de message du serveur, utiliser le message d'erreur générique
           * (ex: "Network Error", "Timeout", etc.)
           */
            /**
             * Afficher un toast d'erreur avec le message générique
             */
            toast.error(error.message);
          }
        }

        /**
         * Rejeter la Promise pour que le code appelant puisse gérer l'erreur
         * (ex: afficher un message personnalisé, réessayer, etc.)
         */
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // GESTION DES TOKENS (MÉTHODES PRIVÉES)
  // ============================================

  /**
   * MÉTHODE PRIVÉE: getAccessToken
   *
   * Récupère le token d'accès depuis localStorage.
   * Le access token est utilisé pour authentifier les requêtes API.
   * Il a une durée de vie courte (ex: 15 minutes) pour des raisons de sécurité.
   *
   * SÉCURITÉ SSR:
   * - Vérifie que window est défini avant d'accéder à localStorage
   * - Retourne null si window n'est pas défini (côté serveur)
   * - Évite les erreurs lors du Server-Side Rendering (SSR) de Next.js
   *
   * @returns Le token d'accès (string) ou null si non disponible ou côté serveur
   */
  private getAccessToken(): string | null {
    /**
     * Vérifier que window est défini (évite les erreurs SSR)
     * typeof window === 'undefined' est true côté serveur (Node.js)
     * typeof window === 'object' est true côté client (browser)
     */
    if (typeof window === 'undefined') return null;

    /**
     * Récupérer le token depuis localStorage
     * localStorage.getItem() retourne la valeur ou null si la clé n'existe pas
     */
    return localStorage.getItem('accessToken');
  }

  /**
   * MÉTHODE PRIVÉE: getRefreshToken
   *
   * Récupère le refresh token depuis localStorage.
   * Le refresh token est utilisé pour obtenir un nouveau access token quand celui-ci expire.
   * Il a une durée de vie plus longue (ex: 7 jours) que l'access token.
   *
   * SÉCURITÉ SSR:
   * - Vérifie que window est défini avant d'accéder à localStorage
   * - Retourne null si window n'est pas défini (côté serveur)
   *
   * @returns Le refresh token (string) ou null si non disponible ou côté serveur
   */
  private getRefreshToken(): string | null {
    /**
     * Vérifier que window est défini (évite les erreurs SSR)
     */
    if (typeof window === 'undefined') return null;

    /**
     * Récupérer le refresh token depuis localStorage
     */
    return localStorage.getItem('refreshToken');
  }

  /**
   * MÉTHODE PRIVÉE: setTokens
   *
   * Sauvegarde les tokens dans localStorage.
   * Utilisée après une connexion réussie ou un rafraîchissement de token.
   *
   * TOKENS:
   * - accessToken: Token d'accès JWT (durée de vie courte, ex: 15 minutes)
   * - refreshToken: Refresh token JWT (durée de vie longue, ex: 7 jours)
   *
   * SÉCURITÉ SSR:
   * - Vérifie que window est défini avant d'accéder à localStorage
   * - Ne fait rien si window n'est pas défini (côté serveur)
   *
   * @param accessToken - Token d'accès JWT à sauvegarder
   * @param refreshToken - Refresh token JWT à sauvegarder
   */
  private setTokens(accessToken: string, refreshToken: string) {
    /**
     * Vérifier que window est défini (évite les erreurs SSR)
     */
    if (typeof window === 'undefined') return;

    /**
     * Sauvegarder les tokens dans localStorage
     * localStorage.setItem() stocke les valeurs de manière persistante
     * Les valeurs restent même après la fermeture du navigateur
     */
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * MÉTHODE PRIVÉE: clearTokens
   *
   * Supprime les tokens de localStorage.
   * Utilisée lors de la déconnexion ou si l'authentification échoue définitivement.
   *
   * UTILISATION:
   * - Déconnexion de l'utilisateur (logout)
   * - Échec du rafraîchissement du token (refresh token expiré)
   * - Erreur d'authentification irrécupérable
   *
   * SÉCURITÉ SSR:
   * - Vérifie que window est défini avant d'accéder à localStorage
   * - Ne fait rien si window n'est pas défini (côté serveur)
   */
  private clearTokens() {
    /**
     * Vérifier que window est défini (évite les erreurs SSR)
     */
    if (typeof window === 'undefined') return;

    /**
     * Supprimer les tokens de localStorage
     * localStorage.removeItem() supprime la clé et sa valeur
     * Les tokens sont supprimés pour forcer l'utilisateur à se reconnecter
     */
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // ============================================
  // ENDPOINTS D'AUTHENTIFICATION
  // ============================================

  /**
   * MÉTHODE: login
   *
   * Connecte un utilisateur et sauvegarde automatiquement les tokens.
   *
   * FLUX:
   * 1. Envoyer les identifiants (email, password) au serveur
   * 2. Le serveur valide les identifiants et génère les tokens JWT
   * 3. Sauvegarder les tokens dans localStorage
   * 4. Retourner la réponse avec les tokens et les informations utilisateur
   *
   * SÉCURITÉ:
   * - Les mots de passe sont hashés côté serveur (jamais envoyés en clair)
   * - Les tokens sont stockés dans localStorage (accessible uniquement côté client)
   * - Le serveur valide les identifiants avant de générer les tokens
   *
   * @param data - Données de connexion (email: string, password: string)
   * @returns Promise qui se résout avec la réponse d'authentification (tokens + utilisateur)
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    /**
     * Appeler l'endpoint POST /auth/login
     * Le serveur valide les identifiants et retourne les tokens JWT + informations utilisateur
     * Le type générique <AuthResponse> garantit le type de la réponse
     */
    const response = await this.client.post<AuthResponse>('/auth/login', data);

    /**
     * Sauvegarder les tokens automatiquement dans localStorage
     * setTokens() stocke accessToken et refreshToken
     * Ces tokens seront utilisés pour les prochaines requêtes via l'intercepteur
     */
    this.setTokens(response.data.accessToken, response.data.refreshToken);

    /**
     * Retourner la réponse complète avec les tokens et les informations utilisateur
     * response.data contient:
     * - accessToken: token d'accès JWT
     * - refreshToken: refresh token JWT
     * - user: informations de l'utilisateur connecté
     */
    return response.data;
  }

  /**
   * MÉTHODE: register
   *
   * Inscrit un nouvel utilisateur et sauvegarde automatiquement les tokens.
   * Après l'inscription, l'utilisateur est automatiquement connecté.
   *
   * FLUX:
   * 1. Envoyer les données d'inscription (email, password, displayName) au serveur
   * 2. Le serveur crée le compte et génère les tokens JWT
   * 3. Sauvegarder les tokens dans localStorage
   * 4. Retourner la réponse avec les tokens et les informations utilisateur
   *
   * VALIDATION:
   * - Email: doit être valide et unique
   * - Password: doit respecter les critères de sécurité (longueur, complexité)
   * - DisplayName: optionnel, utilisé pour l'affichage
   *
   * SÉCURITÉ:
   * - Les mots de passe sont hashés côté serveur avec bcrypt
   * - Les tokens sont stockés dans localStorage
   *
   * @param data - Données d'inscription (email: string, password: string, displayName?: string)
   * @returns Promise qui se résout avec la réponse d'authentification (tokens + utilisateur)
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    /**
     * Appeler l'endpoint POST /auth/register
     * Le serveur crée le compte et retourne les tokens JWT + informations utilisateur
     * Le type générique <AuthResponse> garantit le type de la réponse
     */
    const response = await this.client.post<AuthResponse>(
      '/auth/register',
      data
    );

    /**
     * Sauvegarder les tokens automatiquement dans localStorage
     * setTokens() stocke accessToken et refreshToken
     * L'utilisateur est maintenant connecté et authentifié
     */
    this.setTokens(response.data.accessToken, response.data.refreshToken);

    /**
     * Retourner la réponse complète avec les tokens et les informations utilisateur
     */
    return response.data;
  }

  /**
   * MÉTHODE: logout
   *
   * Déconnecte l'utilisateur et supprime les tokens.
   *
   * FLUX:
   * 1. Récupérer le refresh token depuis localStorage
   * 2. Envoyer une requête au serveur pour révoquer le refresh token (optionnel)
   * 3. Supprimer les tokens du localStorage (toujours fait, même si la requête échoue)
   *
   * RÉVOCATION DU TOKEN:
   * - Le serveur peut révoquer le refresh token pour empêcher son utilisation future
   * - Si la requête échoue (ex: token déjà expiré), on ignore l'erreur
   * - Les tokens sont toujours supprimés du localStorage pour garantir la déconnexion
   *
   * SÉCURITÉ:
   * - Supprime les tokens même si la requête serveur échoue
   * - Force l'utilisateur à se reconnecter pour les prochaines requêtes
   */
  async logout(): Promise<void> {
    /**
     * Récupérer le refresh token depuis localStorage
     * On a besoin du refresh token pour le révoquer côté serveur
     */
    const refreshToken = this.getRefreshToken();

    /**
     * Si un refresh token existe, tenter de le révoquer côté serveur
     * Cela empêche l'utilisation future du token même s'il n'est pas encore expiré
     */
    if (refreshToken) {
      try {
        /**
         * Tenter de révoquer le refresh token côté serveur
         * POST /auth/logout envoie le refresh token au serveur pour révocations
         * Le serveur peut alors le marquer comme révoqué dans la base de données
         */
        await this.client.post('/auth/logout', { refreshToken });
      } catch (error) {
        /**
         * Ignorer les erreurs de logout (le token peut déjà être expiré)
         * Même si la révocations échoue, on supprime quand même les tokens du localStorage
         * pour garantir que l'utilisateur est déconnecté côté client
         */
      }
    }

    /**
     * Supprimer les tokens du localStorage
     * Cette opération est toujours effectuée, même si la révocations serveur a échoué
     * clearTokens() supprime accessToken et refreshToken
     */
    this.clearTokens();
  }

  /**
   * MÉTHODE: refreshToken
   *
   * Rafraîchit le token d'accès en utilisant le refresh token.
   *
   * FLUX:
   * 1. Envoyer le refresh token au serveur
   * 2. Le serveur valide le refresh token et génère de nouveaux tokens
   * 3. Retourner les nouveaux tokens (access + refresh)
   *
   * IMPORTANT:
   * Cette méthode est marquée pour ne pas déclencher l'intercepteur de rafraîchissement.
   * Si cette requête échoue, on ne veut pas essayer de la rafraîchir à nouveau
   * (ce qui créerait une boucle infinie).
   *
   * MARQUEURS SPÉCIAUX:
   * - _skipAuthRefresh: empêche l'intercepteur de rafraîchir cette requête
   * - _skipErrorToast: empêche l'affichage d'un toast d'erreur si ça échoue
   *
   * UTILISATION:
   * Cette méthode est appelée par l'intercepteur de réponse quand un 401 est détecté.
   * Elle ne doit pas être appelée directement par le code applicatif.
   *
   * @param refreshToken - Le refresh token à utiliser pour obtenir de nouveaux tokens
   * @returns Promise qui se résout avec les nouveaux tokens (accessToken + refreshToken)
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    /**
     * Appeler l'endpoint POST /auth/refresh
     * Le serveur valide le refresh token et retourne de nouveaux tokens
     *
     * MARQUEURS SPÉCIAUX (passés dans la config Axios):
     * - _skipAuthRefresh: true -> empêche l'intercepteur de rafraîchir cette requête
     *   (évite les boucles infinies si /auth/refresh échoue)
     * - _skipErrorToast: true -> empêche l'affichage d'un toast d'erreur
     *   (l'erreur est gérée par l'intercepteur qui redirige vers /login)
     *
     * as any: nécessaire car Axios ne connaît pas ces propriétés personnalisées
     */
    const response = await this.client.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken }, {
      _skipAuthRefresh: true, // Ne pas déclencher le rafraîchissement automatique
      _skipErrorToast: true, // Ne pas afficher d'erreur si ça échoue
    } as any);

    /**
     * Retourner les nouveaux tokens
     * response.data contient:
     * - accessToken: nouveau token d'accès JWT
     * - refreshToken: nouveau refresh token JWT (rotation des tokens)
     */
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

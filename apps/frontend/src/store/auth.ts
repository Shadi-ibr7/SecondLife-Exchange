/**
 * FICHIER: store/auth.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion de l'état d'authentification.
 * Il gère l'utilisateur connecté, l'état de chargement, et toutes les actions
 * liées à l'authentification (login, register, logout, etc.). Ce store est le
 * point central pour toute la logique d'authentification dans l'application.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Stockage persistant de l'état d'authentification (localStorage)
 * - Gestion de l'utilisateur connecté (user)
 * - Gestion de l'état de chargement (isLoading)
 * - Actions pour login, register, logout
 * - Vérification automatique de l'authentification (checkAuth)
 * - Mise à jour et suppression du profil (updateProfile, deleteAccount)
 *
 * ARCHITECTURE:
 * - Pattern: Store Zustand avec middleware de persistance
 * - Persistance: localStorage sous la clé 'auth-storage'
 * - Seuls user et isAuthenticated sont persistés (pas isLoading)
 * - Synchronisation avec l'API via apiClient
 *
 * FLUX D'AUTHENTIFICATION:
 * 1. Login/Register: Appel API -> Sauvegarde tokens -> Mise à jour store
 * 2. CheckAuth: Vérifie token -> Récupère profil -> Mise à jour store
 * 3. Logout: Révoque token -> Nettoie tokens -> Réinitialise store
 *
 * UTILISATION:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuthStore();
 *
 * if (isAuthenticated) {
 *   return <div>Bonjour {user?.displayName}</div>;
 * }
 * ```
 *
 * @module store/auth
 */

// Import de Zustand pour la gestion d'état global
import { create } from 'zustand';

// Import du middleware de persistance pour sauvegarder dans localStorage
import { persist } from 'zustand/middleware';

// Import des types TypeScript
import { User, LoginDto, RegisterDto, UpdateProfileDto } from '@/types';

// Import du client API pour les appels backend
import apiClient from '@/lib/api';

/**
 * INTERFACE: AuthState
 *
 * Définit la structure de l'état d'authentification dans le store Zustand.
 * Cette interface décrit toutes les propriétés et méthodes disponibles
 * dans le store d'authentification.
 *
 * PROPRIÉTÉS:
 * - user: Utilisateur connecté (null si non connecté)
 * - isAuthenticated: Flag indiquant si l'utilisateur est authentifié
 * - isLoading: Flag indiquant si une opération asynchrone est en cours
 *
 * ACTIONS:
 * - login: Connecte un utilisateur avec email/password
 * - register: Inscrit un nouvel utilisateur
 * - logout: Déconnecte l'utilisateur actuel
 * - checkAuth: Vérifie si l'utilisateur est toujours authentifié
 * - updateProfile: Met à jour le profil de l'utilisateur
 * - deleteAccount: Supprime le compte de l'utilisateur
 */
interface AuthState {
  /**
   * Utilisateur connecté
   * - null: Aucun utilisateur connecté
   * - User: Objet utilisateur avec toutes ses informations
   *
   * PERSISTÉ: Oui (sauvegardé dans localStorage)
   */
  user: User | null;

  /**
   * Flag indiquant si l'utilisateur est authentifié
   * - true: Utilisateur connecté (user !== null)
   * - false: Utilisateur non connecté (user === null)
   *
   * PERSISTÉ: Oui (sauvegardé dans localStorage)
   */
  isAuthenticated: boolean;

  /**
   * Flag indiquant si une opération asynchrone est en cours
   * - true: Une action (login, register, logout, etc.) est en cours
   * - false: Aucune action en cours
   *
   * PERSISTÉ: Non (pas sauvegardé, réinitialisé à false au chargement)
   */
  isLoading: boolean;

  /**
   * Fonction de connexion
   * Appelle l'API /auth/login et met à jour le store
   *
   * @param data - Données de connexion (email, password)
   * @throws Error si la connexion échoue
   */
  login: (data: LoginDto) => Promise<void>;

  /**
   * Fonction d'inscription
   * Appelle l'API /auth/register et met à jour le store
   *
   * @param data - Données d'inscription (email, password, displayName)
   * @throws Error si l'inscription échoue
   */
  register: (data: RegisterDto) => Promise<void>;

  /**
   * Fonction de déconnexion
   * Appelle l'API /auth/logout et nettoie le store
   *
   * @throws Error si la déconnexion échoue (erreur ignorée)
   */
  logout: () => Promise<void>;

  /**
   * Vérifie si l'utilisateur est toujours authentifié
   * Appelle l'API /users/me pour vérifier que le token est valide
   *
   * @throws Error si la vérification échoue
   */
  checkAuth: () => Promise<void>;

  /**
   * Met à jour le profil de l'utilisateur
   * Appelle l'API /users/me (PATCH) et met à jour le store
   *
   * @param userData - Données à mettre à jour (displayName, avatarUrl, bio, etc.)
   * @throws Error si la mise à jour échoue
   */
  updateProfile: (userData: UpdateProfileDto) => Promise<void>;

  /**
   * Supprime le compte de l'utilisateur
   * Appelle l'API /users/me (DELETE) et nettoie le store
   *
   * ATTENTION: Cette opération est irréversible!
   *
   * @throws Error si la suppression échoue
   */
  deleteAccount: () => Promise<void>;
}

/**
 * STORE: useAuthStore
 *
 * Store Zustand pour la gestion de l'authentification.
 * Utilise le middleware persist pour sauvegarder l'état dans localStorage.
 *
 * ARCHITECTURE:
 * - create<AuthState>()(): Crée le store avec TypeScript
 * - persist(): Middleware qui sauvegarde automatiquement dans localStorage
 * - (set, get) => ({ ... }): Fonction qui retourne l'état initial et les actions
 *
 * PERSISTANCE:
 * - Clé localStorage: 'auth-storage'
 * - Données persistées: user, isAuthenticated
 * - Données non persistées: isLoading (réinitialisé à false)
 *
 * UTILISATION:
 * ```tsx
 * const { user, isAuthenticated, login } = useAuthStore();
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    /**
     * Fonction qui définit l'état initial et les actions du store
     *
     * PARAMÈTRES:
     * - set: Fonction pour mettre à jour l'état (set({ user: ... }))
     * - get: Fonction pour lire l'état actuel (get().user)
     *
     * RETOUR:
     * Objet contenant l'état initial et toutes les actions
     */
    (set, get) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================

      /**
       * Utilisateur connecté
       * Initialisé à null (aucun utilisateur connecté)
       * Sera mis à jour après login/register ou checkAuth
       */
      user: null,

      /**
       * Flag d'authentification
       * Initialisé à false (non authentifié)
       * Sera mis à jour après login/register ou checkAuth
       */
      isAuthenticated: false,

      /**
       * Flag de chargement
       * Initialisé à false (aucune opération en cours)
       * Sera mis à true pendant les opérations asynchrones
       */
      isLoading: false,

      // ============================================
      // ACTION: login
      // ============================================
      /**
       * ACTION: login
       *
       * Connecte un utilisateur avec email et password.
       *
       * FLUX:
       * 1. Active le flag isLoading (affiche un indicateur de chargement)
       * 2. Appelle l'API /auth/login avec les identifiants
       * 3. L'API valide les identifiants et retourne les tokens + utilisateur
       * 4. apiClient.login() sauvegarde automatiquement les tokens dans localStorage
       * 5. Met à jour le store avec l'utilisateur connecté
       * 6. Désactive le flag isLoading
       *
       * GESTION D'ERREUR:
       * - Si l'API échoue (mauvais identifiants, erreur réseau, etc.)
       * - Le flag isLoading est désactivé
       * - L'erreur est propagée pour que le composant puisse l'afficher
       *
       * SÉCURITÉ:
       * - Les tokens sont sauvegardés automatiquement par apiClient
       * - Les tokens seront utilisés pour les prochaines requêtes via l'intercepteur
       *
       * @param data - Données de connexion (email: string, password: string)
       * @throws Error si la connexion échoue (mauvais identifiants, erreur réseau, etc.)
       */
      login: async (data: LoginDto) => {
        /**
         * Activer le flag de chargement
         * Cela permet aux composants d'afficher un indicateur de chargement
         * (ex: spinner, bouton désactivé, etc.)
         */
        set({ isLoading: true });

        try {
          /**
           * Appeler l'API de connexion
           * apiClient.login() fait:
           * 1. POST /auth/login avec email et password
           * 2. Le serveur valide les identifiants
           * 3. Le serveur retourne accessToken, refreshToken, et user
           * 4. apiClient.login() sauvegarde automatiquement les tokens dans localStorage
           * 5. Retourne { accessToken, refreshToken, user }
           */
          const response = await apiClient.login(data);

          /**
           * Mettre à jour l'état avec l'utilisateur connecté
           *
           * PROPRIÉTÉS MISES À JOUR:
           * - user: L'utilisateur retourné par l'API (avec toutes ses informations)
           * - isAuthenticated: true (l'utilisateur est maintenant connecté)
           * - isLoading: false (l'opération est terminée)
           *
           * PERSISTANCE:
           * - user et isAuthenticated sont automatiquement sauvegardés dans localStorage
           * - isLoading n'est pas persisté (sera false au prochain chargement)
           */
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          /**
           * En cas d'erreur, désactiver le flag de chargement
           * et propager l'erreur pour que le composant puisse l'afficher
           * (ex: toast d'erreur, message dans le formulaire, etc.)
           */
          set({ isLoading: false });
          throw error;
        }
      },

      // ============================================
      // ACTION: register
      // ============================================
      /**
       * ACTION: register
       *
       * Inscrit un nouvel utilisateur et le connecte automatiquement.
       *
       * FLUX:
       * 1. Active le flag isLoading
       * 2. Appelle l'API /auth/register avec les données d'inscription
       * 3. L'API crée le compte et retourne les tokens + utilisateur
       * 4. apiClient.register() sauvegarde automatiquement les tokens dans localStorage
       * 5. Met à jour le store avec l'utilisateur créé
       * 6. Désactive le flag isLoading
       *
       * VALIDATION:
       * - Email: doit être valide et unique (vérifié côté serveur)
       * - Password: doit respecter les critères de sécurité (vérifié côté serveur)
       * - DisplayName: optionnel, utilisé pour l'affichage
       *
       * GESTION D'ERREUR:
       * - Si l'API échoue (email déjà utilisé, password trop faible, etc.)
       * - Le flag isLoading est désactivé
       * - L'erreur est propagée pour que le composant puisse l'afficher
       *
       * SÉCURITÉ:
       * - Les mots de passe sont hashés côté serveur avec bcrypt
       * - Les tokens sont sauvegardés automatiquement par apiClient
       *
       * @param data - Données d'inscription (email: string, password: string, displayName?: string)
       * @throws Error si l'inscription échoue (email déjà utilisé, erreur réseau, etc.)
       */
      register: async (data: RegisterDto) => {
        /**
         * Activer le flag de chargement
         */
        set({ isLoading: true });

        try {
          /**
           * Appeler l'API d'inscription
           * apiClient.register() fait:
           * 1. POST /auth/register avec email, password, displayName
           * 2. Le serveur crée le compte (hash le password, valide l'email, etc.)
           * 3. Le serveur retourne accessToken, refreshToken, et user
           * 4. apiClient.register() sauvegarde automatiquement les tokens dans localStorage
           * 5. Retourne { accessToken, refreshToken, user }
           */
          const response = await apiClient.register(data);

          /**
           * Mettre à jour l'état avec l'utilisateur créé
           * L'utilisateur est maintenant connecté automatiquement après l'inscription
           */
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          /**
           * En cas d'erreur, désactiver le flag de chargement
           * et propager l'erreur
           */
          set({ isLoading: false });
          throw error;
        }
      },

      // ============================================
      // ACTION: logout
      // ============================================
      /**
       * ACTION: logout
       *
       * Déconnecte l'utilisateur et nettoie l'état.
       *
       * FLUX:
       * 1. Active le flag isLoading
       * 2. Appelle l'API /auth/logout pour révoquer le refresh token (optionnel)
       * 3. apiClient.logout() supprime automatiquement les tokens du localStorage
       * 4. Nettoie l'état local (user: null, isAuthenticated: false)
       * 5. Désactive le flag isLoading
       *
       * RÉVOCATION DU TOKEN:
       * - L'API peut révoquer le refresh token pour empêcher son utilisation future
       * - Si la requête échoue (ex: token déjà expiré), on ignore l'erreur
       * - Les tokens sont toujours supprimés du localStorage pour garantir la déconnexion
       *
       * GESTION D'ERREUR:
       * - Les erreurs de logout sont ignorées (le token peut déjà être expiré)
       * - L'état local est toujours nettoyé dans le bloc finally
       * - Cela garantit que l'utilisateur est déconnecté même si l'API échoue
       *
       * SÉCURITÉ:
       * - Les tokens sont supprimés du localStorage (apiClient.logout())
       * - L'utilisateur devra se reconnecter pour les prochaines requêtes
       */
      logout: async () => {
        /**
         * Activer le flag de chargement
         */
        set({ isLoading: true });

        try {
          /**
           * Appeler l'API de déconnexion
           * apiClient.logout() fait:
           * 1. Récupère le refresh token depuis localStorage
           * 2. POST /auth/logout avec le refresh token (pour révocations)
           * 3. Supprime accessToken et refreshToken du localStorage
           *
           * NOTE: Même si cette requête échoue, les tokens sont supprimés
           */
          await apiClient.logout();
        } catch (error) {
          /**
           * Ignorer les erreurs de logout
           *
           * POURQUOI:
           * - Le token peut déjà être expiré (erreur 401)
           * - Il peut y avoir une erreur réseau
           * - Dans tous les cas, on veut quand même nettoyer l'état local
           *
           * L'état local sera nettoyé dans le bloc finally
           */
        } finally {
          /**
           * Toujours nettoyer l'état local
           *
           * IMPORTANT:
           * Le bloc finally s'exécute toujours, même si une erreur est levée.
           * Cela garantit que l'utilisateur est déconnecté côté client,
           * même si la révocations serveur a échoué.
           *
           * PROPRIÉTÉS RÉINITIALISÉES:
           * - user: null (aucun utilisateur connecté)
           * - isAuthenticated: false (non authentifié)
           * - isLoading: false (opération terminée)
           */
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // ============================================
      // ACTION: checkAuth
      // ============================================
      /**
       * ACTION: checkAuth
       *
       * Vérifie si l'utilisateur est toujours authentifié en récupérant son profil.
       *
       * FLUX:
       * 1. Vérifie qu'aucune autre opération n'est en cours (évite les appels multiples)
       * 2. Vérifie qu'un access token existe dans localStorage
       * 3. Si pas de token, nettoie l'état et retourne
       * 4. Active le flag isLoading
       * 5. Appelle l'API /users/me pour récupérer le profil
       * 6. Si succès, met à jour le store avec l'utilisateur
       * 7. Si erreur, nettoie l'état
       *
       * VÉRIFICATION DU TOKEN:
       * - L'appel à /users/me nécessite un token valide
       * - Si le token est expiré, l'intercepteur API tentera de le rafraîchir
       * - Si le rafraîchissement échoue, l'intercepteur redirige vers /login
       *
       * OPTIMISATION:
       * - Évite les appels multiples si isLoading est déjà true
       * - Vérifie d'abord l'existence du token avant de faire l'appel API
       *
       * UTILISATION:
       * - Appelé au chargement de l'application (dans layout.tsx ou providers.tsx)
       * - Appelé après un rafraîchissement de page
       * - Permet de restaurer l'état d'authentification depuis localStorage
       */
      checkAuth: async () => {
        /**
         * Éviter les appels répétés si on est déjà en train de charger
         *
         * POURQUOI:
         * Si checkAuth() est appelé plusieurs fois rapidement (ex: plusieurs composants),
         * on ne veut pas faire plusieurs appels API simultanés.
         * On attend que le premier appel se termine.
         */
        if (get().isLoading) {
          return;
        }

        /**
         * Vérifier qu'un access token existe dans localStorage
         *
         * POURQUOI:
         * Si pas de token, il n'y a pas besoin de faire un appel API.
         * On sait déjà que l'utilisateur n'est pas authentifié.
         */
        const token = localStorage.getItem('accessToken');
        if (!token) {
          /**
           * Pas de token, nettoyer l'état et retourner
           * L'utilisateur n'est pas authentifié
           */
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        /**
         * Activer le flag de chargement
         */
        set({ isLoading: true });

        try {
          /**
           * Récupérer le profil pour vérifier que le token est valide
           *
           * apiClient.getProfile() fait:
           * 1. GET /users/me avec le token dans le header Authorization
           * 2. Le serveur valide le token et retourne les informations utilisateur
           * 3. Si le token est expiré, l'intercepteur tentera de le rafraîchir
           * 4. Si le rafraîchissement échoue, l'intercepteur redirige vers /login
           */
          const user = await apiClient.getProfile();

          /**
           * Mettre à jour l'état avec l'utilisateur
           * Le token est valide, l'utilisateur est authentifié
           */
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          /**
           * En cas d'erreur, nettoyer l'état
           *
           * CAS D'ERREUR:
           * - 401 (Unauthorized): Token invalide ou expiré
           *   -> L'intercepteur a tenté de rafraîchir, mais a échoué
           *   -> L'intercepteur a déjà redirigé vers /login
           * - Autres erreurs (500, réseau, etc.)
           *   -> Nettoyer l'état pour éviter un état incohérent
           */
          if (error?.response?.status === 401) {
            /**
             * Erreur 401: Token invalide ou expiré
             * L'intercepteur API a déjà géré le rafraîchissement ou la redirection
             * On nettoie juste l'état local
             */
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            /**
             * Autres erreurs (500, réseau, etc.)
             * Nettoyer l'état pour éviter un état incohérent
             */
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },

      // ============================================
      // ACTION: updateProfile
      // ============================================
      /**
       * ACTION: updateProfile
       *
       * Met à jour le profil de l'utilisateur connecté.
       *
       * FLUX:
       * 1. Active le flag isLoading
       * 2. Appelle l'API /users/me (PATCH) avec les nouvelles données
       * 3. Le serveur met à jour le profil et retourne l'utilisateur mis à jour
       * 4. Met à jour le store avec l'utilisateur mis à jour
       * 5. Désactive le flag isLoading
       *
       * DONNÉES MODIFIABLES:
       * - displayName: Nom d'affichage de l'utilisateur
       * - avatarUrl: URL de l'avatar (photo de profil)
       * - bio: Biographie de l'utilisateur
       * - Autres champs selon UpdateProfileDto
       *
       * GESTION D'ERREUR:
       * - Si l'API échoue (validation, erreur réseau, etc.)
       * - Le flag isLoading est désactivé
       * - L'erreur est propagée pour que le composant puisse l'afficher
       *
       * @param userData - Données à mettre à jour (displayName?: string, avatarUrl?: string, bio?: string, etc.)
       * @throws Error si la mise à jour échoue (validation, erreur réseau, etc.)
       */
      updateProfile: async (userData: UpdateProfileDto) => {
        /**
         * Activer le flag de chargement
         */
        set({ isLoading: true });

        try {
          /**
           * Appeler l'API de mise à jour
           * apiClient.updateProfile() fait:
           * 1. PATCH /users/me avec les nouvelles données
           * 2. Le serveur valide et met à jour le profil
           * 3. Le serveur retourne l'utilisateur mis à jour
           */
          const updatedUser = await apiClient.updateProfile(userData);

          /**
           * Mettre à jour l'utilisateur dans l'état
           *
           * IMPORTANT:
           * On remplace complètement l'objet user avec la nouvelle version
           * Cela garantit que toutes les modifications sont reflétées dans le store
           */
          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error) {
          /**
           * En cas d'erreur, désactiver le flag de chargement
           * et propager l'erreur
           */
          set({ isLoading: false });
          throw error;
        }
      },

      // ============================================
      // ACTION: deleteAccount
      // ============================================
      /**
       * ACTION: deleteAccount
       *
       * Supprime le compte de l'utilisateur connecté.
       *
       * ⚠️ ATTENTION: Cette opération est irréversible!
       *
       * FLUX:
       * 1. Active le flag isLoading
       * 2. Appelle l'API /users/me (DELETE)
       * 3. Le serveur supprime le compte et toutes ses données
       * 4. Nettoie l'état local (déconnecte l'utilisateur)
       * 5. Désactive le flag isLoading
       *
       * SUPPRESSION:
       * - Le compte est supprimé de la base de données
       * - Toutes les données associées sont supprimées (items, exchanges, etc.)
       * - Les tokens sont invalidés
       *
       * GESTION D'ERREUR:
       * - Si l'API échoue (erreur réseau, permissions, etc.)
       * - Le flag isLoading est désactivé
       * - L'erreur est propagée pour que le composant puisse l'afficher
       *
       * SÉCURITÉ:
       * - Cette action nécessite une authentification valide
       * - Le serveur vérifie que l'utilisateur supprime son propre compte
       *
       * @throws Error si la suppression échoue (erreur réseau, permissions, etc.)
       */
      deleteAccount: async () => {
        /**
         * Activer le flag de chargement
         */
        set({ isLoading: true });

        try {
          /**
           * Appeler l'API de suppression
           * apiClient.deleteAccount() fait:
           * 1. DELETE /users/me
           * 2. Le serveur supprime le compte et toutes ses données
           * 3. Les tokens sont invalidés côté serveur
           */
          await apiClient.deleteAccount();

          /**
           * Nettoyer l'état local
           *
           * IMPORTANT:
           * Même si l'API réussit, on nettoie l'état local
           * car l'utilisateur n'existe plus et ne peut plus être authentifié
           */
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          /**
           * En cas d'erreur, désactiver le flag de chargement
           * et propager l'erreur
           */
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      // ============================================
      // CONFIGURATION DE LA PERSISTANCE
      // ============================================
      /**
       * Nom de la clé dans localStorage
       *
       * Les données seront sauvegardées sous la clé 'auth-storage'
       * Format: { user: {...}, isAuthenticated: true/false }
       */
      name: 'auth-storage',

      /**
       * Fonction pour déterminer quelles parties de l'état sont persistées
       *
       * POURQUOI PARTIALIZE:
       * On ne veut pas sauvegarder isLoading dans localStorage.
       * isLoading doit être false au chargement de la page (pas de chargement en cours).
       *
       * DONNÉES PERSISTÉES:
       * - user: L'utilisateur connecté (pour restaurer l'état après rechargement)
       * - isAuthenticated: Le flag d'authentification (pour savoir si l'utilisateur est connecté)
       *
       * DONNÉES NON PERSISTÉES:
       * - isLoading: Toujours false au chargement (pas de chargement en cours)
       *
       * RESTAURATION:
       * Au chargement de la page, Zustand restaure automatiquement user et isAuthenticated
       * depuis localStorage. Cela permet de maintenir l'état d'authentification
       * même après un rafraîchissement de page.
       *
       * @param state - L'état complet du store
       * @returns Objet avec seulement les propriétés à persister
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

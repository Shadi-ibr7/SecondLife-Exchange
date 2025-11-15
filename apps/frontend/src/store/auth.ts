/**
 * FICHIER: auth.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le store Zustand pour la gestion de l'état d'authentification.
 * Il gère l'utilisateur connecté, l'état de chargement, et toutes les actions
 * liées à l'authentification (login, register, logout, etc.).
 *
 * FONCTIONNALITÉS:
 * - Stockage persistant de l'état d'authentification (localStorage)
 * - Gestion de l'utilisateur connecté
 * - Actions pour login, register, logout
 * - Vérification automatique de l'authentification
 * - Mise à jour et suppression du profil
 *
 * PERSISTANCE:
 * - L'état est sauvegardé dans localStorage sous la clé 'auth-storage'
 * - Seuls user et isAuthenticated sont persistés (pas isLoading)
 */

// Import de Zustand pour la gestion d'état
import { create } from 'zustand';

// Import du middleware de persistance
import { persist } from 'zustand/middleware';

// Import des types TypeScript
import { User, LoginDto, RegisterDto, UpdateProfileDto } from '@/types';

// Import du client API
import apiClient from '@/lib/api';

/**
 * INTERFACE: AuthState
 *
 * Définit la structure de l'état d'authentification.
 */
interface AuthState {
  user: User | null; // Utilisateur connecté (null si non connecté)
  isAuthenticated: boolean; // true si l'utilisateur est authentifié
  isLoading: boolean; // true pendant les opérations asynchrones
  login: (data: LoginDto) => Promise<void>; // Fonction de connexion
  register: (data: RegisterDto) => Promise<void>; // Fonction d'inscription
  logout: () => Promise<void>; // Fonction de déconnexion
  checkAuth: () => Promise<void>; // Vérifier l'authentification
  updateProfile: (userData: UpdateProfileDto) => Promise<void>; // Mettre à jour le profil
  deleteAccount: () => Promise<void>; // Supprimer le compte
}

/**
 * STORE: useAuthStore
 *
 * Store Zustand pour la gestion de l'authentification.
 * Utilise le middleware persist pour sauvegarder l'état dans localStorage.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ============================================
      // ÉTAT INITIAL
      // ============================================
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // ============================================
      // ACTION: login
      // ============================================
      /**
       * Connecte un utilisateur.
       *
       * @param data - Données de connexion (email, password)
       * @throws Error si la connexion échoue
       */
      login: async (data: LoginDto) => {
        set({ isLoading: true });
        try {
          // Appeler l'API de connexion
          const response = await apiClient.login(data);
          // Mettre à jour l'état avec l'utilisateur connecté
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // ============================================
      // ACTION: register
      // ============================================
      /**
       * Inscrit un nouvel utilisateur.
       *
       * @param data - Données d'inscription (email, password, displayName)
       * @throws Error si l'inscription échoue
       */
      register: async (data: RegisterDto) => {
        set({ isLoading: true });
        try {
          // Appeler l'API d'inscription
          const response = await apiClient.register(data);
          // Mettre à jour l'état avec l'utilisateur créé
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // ============================================
      // ACTION: logout
      // ============================================
      /**
       * Déconnecte l'utilisateur.
       *
       * Appelle l'API de déconnexion pour révoquer le refresh token,
       * puis nettoie l'état local.
       */
      logout: async () => {
        set({ isLoading: true });
        try {
          // Appeler l'API de déconnexion
          await apiClient.logout();
        } catch (error) {
          // Ignorer les erreurs de logout (le token peut déjà être expiré)
        } finally {
          // Toujours nettoyer l'état local
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
       * Vérifie si l'utilisateur est toujours authentifié.
       *
       * Récupère le profil depuis l'API pour vérifier que le token est valide.
       * Si le token est invalide, l'interceptor API gérera le rafraîchissement
       * ou la redirection vers /login.
       */
      checkAuth: async () => {
        // Éviter les appels répétés si on est déjà en train de charger
        if (get().isLoading) {
          return;
        }

        // Vérifier qu'un token existe
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // Récupérer le profil pour vérifier que le token est valide
          const user = await apiClient.getProfile();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Si l'erreur est 401, l'interceptor s'occupera du refresh ou de la redirection
          if (error?.response?.status === 401) {
            // L'interceptor s'occupera du refresh ou de la redirection
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // Pour les autres erreurs, nettoyer l'état
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
       * Met à jour le profil de l'utilisateur connecté.
       *
       * @param userData - Données à mettre à jour (displayName, avatarUrl, bio, etc.)
       * @throws Error si la mise à jour échoue
       */
      updateProfile: async (userData: UpdateProfileDto) => {
        set({ isLoading: true });
        try {
          // Appeler l'API de mise à jour
          const updatedUser = await apiClient.updateProfile(userData);
          // Mettre à jour l'utilisateur dans l'état
          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // ============================================
      // ACTION: deleteAccount
      // ============================================
      /**
       * Supprime le compte de l'utilisateur connecté.
       *
       * ATTENTION: Cette opération est irréversible!
       *
       * @throws Error si la suppression échoue
       */
      deleteAccount: async () => {
        set({ isLoading: true });
        try {
          // Appeler l'API de suppression
          await apiClient.deleteAccount();
          // Nettoyer l'état local
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
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
       */
      name: 'auth-storage',

      /**
       * Fonction pour déterminer quelles parties de l'état sont persistées.
       * Seuls user et isAuthenticated sont sauvegardés (pas isLoading).
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

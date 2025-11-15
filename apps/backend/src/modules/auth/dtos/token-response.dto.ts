/**
 * FICHIER: token-response.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la structure de la réponse retournée par les endpoints
 * d'authentification (register, login, refresh).
 *
 * STRUCTURE:
 * - accessToken: Token JWT de courte durée pour authentifier les requêtes API
 * - refreshToken: Token JWT de longue durée pour rafraîchir l'access token
 * - user: Informations de l'utilisateur (id, email, displayName, avatarUrl, roles, createdAt)
 *
 * UTILISATION:
 * - Type de retour des méthodes register() et login() de AuthService
 * - Type de retour des routes POST /auth/register et POST /auth/login
 */

// Import de Zod pour définir le schéma de validation
import { z } from 'zod';

// ============================================
// SCHÉMA ZOD POUR LA RÉPONSE
// ============================================
/**
 * Schéma Zod qui définit la structure exacte de la réponse d'authentification.
 *
 * Ce schéma peut être utilisé pour:
 * - Valider la réponse avant de l'envoyer au client
 * - Typer automatiquement les réponses dans TypeScript
 * - Générer de la documentation API
 */
export const TokenResponseSchema = z.object({
  // Access Token: Token JWT de courte durée (15 minutes)
  // Utilisé pour authentifier les requêtes API
  accessToken: z.string(),

  // Refresh Token: Token JWT de longue durée (7 jours)
  // Utilisé pour obtenir de nouveaux access tokens
  refreshToken: z.string(),

  // Informations de l'utilisateur
  user: z.object({
    id: z.string(), // ID unique de l'utilisateur
    email: z.string(), // Email de l'utilisateur
    displayName: z.string(), // Nom d'affichage
    avatarUrl: z.string().nullable(), // URL de l'avatar (peut être null)
    roles: z.array(z.enum(['USER', 'ADMIN'])), // Rôles de l'utilisateur
    createdAt: z.date(), // Date de création du compte
  }),
});

/**
 * TYPE: TokenResponse
 *
 * Type TypeScript inféré depuis le schéma Zod.
 * Utilisé pour typer les valeurs de retour des méthodes d'authentification.
 *
 * EXEMPLE D'UTILISATION:
 * async register(input: AuthRegisterInput): Promise<TokenResponse> {
 *   // ... logique ...
 *   return { accessToken, refreshToken, user };
 * }
 */
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

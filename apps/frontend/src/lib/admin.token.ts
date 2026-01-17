/**
 * FICHIER: admin.token.ts
 *
 * ⚠️ DÉPRÉCIÉ - NE PLUS UTILISER
 *
 * Ce fichier est conservé uniquement pour la rétrocompatibilité pendant la période de transition.
 * L'authentification utilise maintenant des cookies httpOnly gérés par le backend.
 *
 * Les tokens ne sont plus stockés en localStorage (vulnérable XSS).
 * Utilisez adminApi.getMe() pour vérifier l'authentification.
 *
 * @deprecated Depuis la migration vers cookies httpOnly
 */

/**
 * @deprecated Ne plus utiliser - les tokens sont maintenant dans les cookies httpOnly
 */
export const ADMIN_TOKEN_KEY = 'secondlife_admin_access_token';

/**
 * @deprecated Ne plus utiliser - les tokens sont maintenant dans les cookies httpOnly
 */
const LEGACY_TOKEN_KEY = 'admin_access_token';

const isBrowser = typeof window !== 'undefined';

/**
 * @deprecated Les tokens sont maintenant stockés dans des cookies httpOnly par le backend.
 * Cette fonction ne fait plus rien mais est conservée pour éviter les erreurs de build.
 */
export const setAdminToken = (_token: string) => {
  // Ne fait plus rien - les cookies sont gérés par le backend
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] setAdminToken() est déprécié. Les tokens sont maintenant dans des cookies httpOnly.'
    );
  }
};

/**
 * @deprecated Les tokens sont maintenant stockés dans des cookies httpOnly.
 * Utilisez adminApi.getMe() pour vérifier l'authentification.
 * @returns null - les tokens ne sont plus accessibles côté client
 */
export const getAdminToken = (): string | null => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] getAdminToken() est déprécié. Utilisez adminApi.getMe() pour vérifier l\'auth.'
    );
  }
  // Retourner null - les tokens sont dans des cookies httpOnly (pas accessible en JS)
  return null;
};

/**
 * @deprecated Utilisez adminApi.logout() qui supprime les cookies via le backend.
 * Cette fonction nettoie uniquement les anciens tokens localStorage pour la transition.
 */
export const clearAdminToken = () => {
  if (!isBrowser) return;
  // Nettoyer les anciennes clés localStorage (migration)
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

/**
 * @deprecated Utilisez adminApi.isAuthenticated() ou adminApi.getMe() à la place.
 * @returns false - impossible de vérifier côté client avec cookies httpOnly
 */
export const hasAdminToken = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] hasAdminToken() est déprécié. Utilisez adminApi.isAuthenticated().'
    );
  }
  return false;
};

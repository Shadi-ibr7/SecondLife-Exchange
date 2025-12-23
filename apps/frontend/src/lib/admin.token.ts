/**
 * Gestion centralisée du token admin.
 * Sécurisé pour SSR : aucun accès à localStorage côté serveur.
 */

export const ADMIN_TOKEN_KEY = 'secondlife_admin_access_token';
const LEGACY_TOKEN_KEY = 'admin_access_token';

const isBrowser = typeof window !== 'undefined';

export const setAdminToken = (token: string) => {
  if (!isBrowser) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  // Nettoie l'ancien nom de clé si présent
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const getAdminToken = (): string | null => {
  if (!isBrowser) return null;
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) return token;
  // Fallback legacy pour ne pas déconnecter un admin déjà loggé
  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(ADMIN_TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  }
  return null;
};

export const clearAdminToken = () => {
  if (!isBrowser) return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const hasAdminToken = () => !!getAdminToken();

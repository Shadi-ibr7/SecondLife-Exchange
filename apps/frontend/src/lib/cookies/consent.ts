/**
 * FICHIER: consent.ts
 * 
 * DESCRIPTION:
 * Gestion du consentement cookies conforme RGPD.
 * Stocke le consentement dans un cookie avec une durée de 6 mois.
 */

// ============================================
// TYPES
// ============================================

export type ConsentCategoryId = 'necessary' | 'preferences' | 'analytics' | 'marketing';

export interface ConsentCategory {
  id: ConsentCategoryId;
  label: string;
  description: string;
  required: boolean;
  defaultEnabled: boolean;
}

export interface ConsentState {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface StoredConsent {
  version: string;
  date: string;
  consent: ConsentState;
}

// ============================================
// CONSTANTES
// ============================================

export const CONSENT_COOKIE_NAME = 'sl_cookie_consent';
export const CONSENT_VERSION = 'v1';
export const CONSENT_DURATION_DAYS = 180; // 6 mois

export const COOKIE_CATEGORIES: ConsentCategory[] = [
  {
    id: 'necessary',
    label: 'Cookies nécessaires',
    description: 'Essentiels au fonctionnement du site. Ils permettent la navigation, la sécurité et l\'authentification. Ces cookies ne peuvent pas être désactivés.',
    required: true,
    defaultEnabled: true,
  },
  {
    id: 'preferences',
    label: 'Cookies de préférences',
    description: 'Permettent de mémoriser vos choix (thème sombre/clair, langue, localisation) pour une expérience personnalisée.',
    required: false,
    defaultEnabled: false,
  },
  {
    id: 'analytics',
    label: 'Cookies statistiques',
    description: 'Nous aident à comprendre comment vous utilisez le site pour l\'améliorer. Les données sont anonymisées.',
    required: false,
    defaultEnabled: false,
  },
  {
    id: 'marketing',
    label: 'Cookies marketing',
    description: 'Utilisés pour afficher des publicités pertinentes et mesurer l\'efficacité de nos campagnes.',
    required: false,
    defaultEnabled: false,
  },
];

// ============================================
// FONCTIONS
// ============================================

/**
 * Récupère le consentement stocké dans le cookie
 */
export function getConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
      ?.split('=')[1];
    
    if (!cookieValue) return null;
    
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded) as StoredConsent;
    
    // Vérifier que le consentement est valide et pas trop ancien
    if (parsed.version !== CONSENT_VERSION) {
      clearConsent();
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Enregistre le consentement dans un cookie
 */
export function setConsent(consent: ConsentState): void {
  if (typeof window === 'undefined') return;
  
  const storedConsent: StoredConsent = {
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    consent: {
      // Nécessaires toujours à true
      necessary: true,
      preferences: consent.preferences,
      analytics: consent.analytics,
      marketing: consent.marketing,
    },
  };
  
  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_DURATION_DAYS);
  
  const cookieValue = encodeURIComponent(JSON.stringify(storedConsent));
  document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  
  // Dispatch un événement custom pour que les providers puissent réagir
  window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: storedConsent }));
}

/**
 * Supprime le cookie de consentement
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Accepte tous les cookies
 */
export function acceptAll(): void {
  setConsent({
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Refuse tous les cookies optionnels (garde les nécessaires)
 */
export function rejectAll(): void {
  setConsent({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });
}

/**
 * Vérifie si une catégorie est acceptée
 */
export function isCategoryAccepted(categoryId: ConsentCategoryId): boolean {
  const storedConsent = getConsent();
  if (!storedConsent) return false;
  return storedConsent.consent[categoryId] === true;
}

/**
 * Retourne le consentement par défaut (tout refusé sauf nécessaires)
 */
export function getDefaultConsent(): ConsentState {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };
}

/**
 * Vérifie si un consentement a été donné (peu importe lequel)
 */
export function hasConsent(): boolean {
  return getConsent() !== null;
}

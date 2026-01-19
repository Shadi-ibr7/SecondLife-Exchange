/**
 * FICHIER: parse-api-error.ts
 *
 * DESCRIPTION:
 * Helper centralisé pour parser et formater les erreurs API.
 * Utilisé par tous les clients API (api.ts, admin.api.ts) pour gérer les erreurs de manière cohérente.
 *
 * FONCTIONNALITÉS:
 * - Parse les erreurs Axios et extrait le format standardisé du backend
 * - Supporte le nouveau format (code, message, requestId, details) et l'ancien format (fallback)
 * - Retourne un objet structuré pour affichage dans les toasts
 * - Log les erreurs en dev uniquement
 *
 * FORMAT BACKEND STANDARDISÉ:
 * {
 *   code: "AUTH_INVALID_CREDENTIALS" | "VALIDATION_ERROR" | ...,
 *   message: "Texte lisible user",
 *   requestId: "...",
 *   details?: [{ field: "...", issue: "..." }]
 * }
 */

import { AxiosError } from 'axios';

/**
 * INTERFACE: ParsedApiError
 *
 * Format standardisé des erreurs parsées pour le frontend.
 */
export interface ParsedApiError {
  code: string;
  message: string;
  requestId?: string;
  details?: Array<{ field: string; issue: string }>;
  isNetworkError: boolean;
}

/**
 * INTERFACE: ErrorResponse (format backend)
 *
 * Format standardisé des réponses d'erreur du backend.
 */
interface ErrorResponse {
  code?: string;
  message?: string;
  requestId?: string;
  details?: Array<{ field: string; issue: string }>;
  // Support fallback pour l'ancien format
  statusCode?: number;
  error?: string;
  path?: string;
  timestamp?: string;
}

/**
 * FONCTION: parseApiError
 *
 * Parse une erreur Axios et retourne un objet structuré.
 *
 * @param error - Erreur Axios ou Error générique
 * @returns Erreur parsée avec code, message, requestId, etc.
 */
export function parseApiError(error: unknown): ParsedApiError {
  // Cas 1: Erreur Axios avec réponse du serveur
  if (error instanceof AxiosError && error.response?.data) {
    const errorData = error.response.data as ErrorResponse;

    // Nouveau format standardisé (prioritaire)
    if (errorData.code && errorData.message) {
      return {
        code: errorData.code,
        message: errorData.message,
        requestId: errorData.requestId,
        details: errorData.details,
        isNetworkError: false,
      };
    }

    // Ancien format (fallback temporaire)
    if (errorData.message) {
      return {
        code: errorData.error || `HTTP_${error.response.status}`,
        message: errorData.message,
        requestId: errorData.requestId,
        isNetworkError: false,
      };
    }
  }

  // Cas 2: Erreur réseau (pas de réponse du serveur)
  if (error instanceof AxiosError && !error.response && error.request) {
    return {
      code: 'NETWORK_ERROR',
      message: 'API inaccessible. Veuillez vérifier votre connexion.',
      isNetworkError: true,
    };
  }

  // Cas 3: Erreur générique (Error)
  if (error instanceof Error) {
    const errorMessage = error.message;
    const technicalMessages = ['Network Error', 'timeout', 'ECONNREFUSED', 'ENOTFOUND'];

    // Détecter si c'est une erreur technique réseau
    const isTechnical = technicalMessages.some((msg) =>
      errorMessage.toLowerCase().includes(msg.toLowerCase()),
    );

    return {
      code: isTechnical ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      message: isTechnical
        ? 'API inaccessible. Veuillez vérifier votre connexion.'
        : errorMessage || 'Une erreur est survenue. Veuillez réessayer.',
      isNetworkError: isTechnical,
    };
  }

  // Cas 4: Erreur inconnue
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Une erreur est survenue. Veuillez réessayer.',
    isNetworkError: false,
  };
}

/**
 * FONCTION: formatErrorMessageForToast
 *
 * Formate le message d'erreur pour affichage dans un toast.
 * Ajoute le requestId de manière discrète si disponible.
 *
 * @param parsedError - Erreur parsée
 * @returns Message formaté pour le toast
 */
export function formatErrorMessageForToast(parsedError: ParsedApiError): string {
  let message = parsedError.message;

  // Ajouter le requestId de manière discrète si disponible
  if (parsedError.requestId) {
    message += ` (Réf: ${parsedError.requestId.substring(0, 8)})`;
  }

  return message;
}

/**
 * FONCTION: logApiError
 *
 * Log une erreur API en console (uniquement en développement).
 *
 * @param error - Erreur originale
 * @param parsedError - Erreur parsée
 */
export function logApiError(error: unknown, parsedError: ParsedApiError): void {
  // Logger uniquement en développement
  // Vérifier si on est en dev (process.env.NODE_ENV ou window.location.hostname)
  const isDev =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));

  if (isDev) {
    console.error('[API Error]', {
      code: parsedError.code,
      message: parsedError.message,
      requestId: parsedError.requestId,
      details: parsedError.details,
      originalError: error,
    });
  }
}

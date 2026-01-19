/**
 * FICHIER: error-response.types.ts
 *
 * DESCRIPTION:
 * Types TypeScript pour le format standardisé des réponses d'erreur de l'API.
 * Toutes les erreurs retournées par l'API suivent ce format.
 *
 * FORMAT STANDARDISÉ:
 * {
 *   code: string,           // Code d'erreur unique (ex: "AUTH_INVALID_CREDENTIALS")
 *   message: string,        // Message lisible pour l'utilisateur
 *   requestId: string,      // ID unique de la requête (pour le support)
 *   details?: Array<{       // Détails optionnels (ex: erreurs de validation)
 *     field: string,
 *     issue: string
 *   }>
 * }
 */

/**
 * CODE D'ERREUR: ErrorCode
 *
 * Liste exhaustive des codes d'erreur possibles.
 * Chaque code correspond à un type d'erreur spécifique.
 */
export type ErrorCode =
  // Authentification
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_2FA_REQUIRED'
  | 'AUTH_2FA_INVALID'
  // Validation
  | 'VALIDATION_ERROR'
  // CORS
  | 'CORS_FORBIDDEN'
  // Prisma
  | 'UNIQUE_CONSTRAINT_VIOLATION'
  | 'RECORD_NOT_FOUND'
  | 'FOREIGN_KEY_CONSTRAINT_VIOLATION'
  | 'INVALID_RELATION'
  | 'DATABASE_CONNECTION_ERROR'
  // Générique
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

/**
 * INTERFACE: ValidationErrorDetail
 *
 * Détail d'une erreur de validation pour un champ spécifique.
 */
export interface ValidationErrorDetail {
  field: string;
  issue: string;
}

/**
 * INTERFACE: ErrorResponse
 *
 * Format standardisé des réponses d'erreur de l'API.
 * Utilisé par HttpExceptionFilter pour formater toutes les erreurs.
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  requestId: string;
  details?: ValidationErrorDetail[];
}

/**
 * MAPPING: HTTP_STATUS_TO_ERROR_CODE
 *
 * Mappe les codes HTTP vers les codes d'erreur correspondants.
 * Utilisé pour les erreurs génériques qui n'ont pas de code spécifique.
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'AUTH_UNAUTHORIZED',
  403: 'AUTH_FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * MAPPING: PRISMA_ERROR_CODE_TO_ERROR_CODE
 *
 * Mappe les codes d'erreur Prisma vers les codes d'erreur de l'API.
 */
export const PRISMA_ERROR_CODE_TO_ERROR_CODE: Record<string, ErrorCode> = {
  P2002: 'UNIQUE_CONSTRAINT_VIOLATION',
  P2025: 'RECORD_NOT_FOUND',
  P2003: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  P2014: 'INVALID_RELATION',
  P1001: 'DATABASE_CONNECTION_ERROR',
  P1008: 'DATABASE_CONNECTION_ERROR',
  P1010: 'DATABASE_CONNECTION_ERROR',
};

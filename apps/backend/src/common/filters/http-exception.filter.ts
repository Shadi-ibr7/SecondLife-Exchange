/**
 * FICHIER: http-exception.filter.ts
 *
 * DESCRIPTION:
 * Filtre global d'exception pour standardiser les réponses d'erreur de l'API.
 * Toutes les erreurs sont interceptées et formatées selon un format unique.
 *
 * FONCTIONNALITÉS:
 * - Format standardisé pour toutes les erreurs (code, message, requestId, details?)
 * - Gestion des erreurs Prisma (P2002 → UNIQUE_CONSTRAINT_VIOLATION, etc.)
 * - Gestion des HttpException de NestJS
 * - Gestion des erreurs de validation (VALIDATION_ERROR avec details)
 * - Gestion des erreurs inconnues (500)
 * - Pas de stacktrace exposée en production (uniquement en développement)
 * - Logging des erreurs avec détails complets (seulement dans les logs)
 *
 * SÉCURITÉ:
 * - Ne jamais exposer les stacktraces en production
 * - Ne jamais exposer les messages d'erreur techniques en production
 * - Messages utilisateur-friendly pour toutes les erreurs
 * - Tous les détails techniques sont loggés mais pas renvoyés au client
 *
 * FORMAT DE RÉPONSE:
 * {
 *   "code": "AUTH_INVALID_CREDENTIALS" | "VALIDATION_ERROR" | ...,
 *   "message": "Texte lisible user",
 *   "requestId": "...",
 *   "details": [{ "field": "...", "issue": "..." }] // Optionnel
 * }
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { RequestWithId } from '../middleware/request-id.middleware';
import {
  ErrorResponse,
  ErrorCode,
  HTTP_STATUS_TO_ERROR_CODE,
  PRISMA_ERROR_CODE_TO_ERROR_CODE,
  ValidationErrorDetail,
} from '../types/error-response.types';

/**
 * FILTRE: HttpExceptionFilter
 *
 * Filtre global qui intercepte toutes les exceptions et les formate.
 * S'applique à toutes les exceptions (HttpException, Prisma, erreurs inconnues).
 */
@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * MÉTHODE PRINCIPALE: catch
   *
   * Intercepte toutes les exceptions et les formate selon le format standardisé.
   *
   * @param exception - L'exception levée (HttpException, Prisma error, Error, etc.)
   * @param host - Contexte d'exécution (contient Request et Response)
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    // Récupérer les informations de la requête
    const path = request.url;
    const requestId = request.requestId || 'unknown';
    const isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';

    // LOG DE DIAGNOSTIC TEMPORAIRE pour /auth/admin/me
    if (path?.includes('/auth/admin/me')) {
      console.log(`[DIAG HttpExceptionFilter.catch] URL: ${path}`);
      console.log(`[DIAG HttpExceptionFilter.catch] requestId: ${requestId}`);
      if (exception instanceof HttpException) {
        const statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        console.log(`[DIAG HttpExceptionFilter.catch] StatusCode: ${statusCode}`);
        console.log(`[DIAG HttpExceptionFilter.catch] Exception type: ${exception.constructor.name}`);
        console.log(`[DIAG HttpExceptionFilter.catch] Exception response:`, typeof exceptionResponse === 'object' ? JSON.stringify(exceptionResponse) : exceptionResponse);
      } else {
        console.log(`[DIAG HttpExceptionFilter.catch] Exception type: ${exception?.constructor?.name || 'unknown'}`);
      }
    }

    // Formater l'erreur selon son type
    const errorResponse = this.formatError(exception, path, requestId, isProduction);

    // Logger l'erreur avec tous les détails (mais ne pas les renvoyer au client)
    this.logError(exception, request, errorResponse, isProduction);

    // Déterminer le status HTTP à partir du code d'erreur
    const httpStatus = this.getHttpStatusFromErrorCode(errorResponse.code);

    // LOG DE DIAGNOSTIC TEMPORAIRE pour /auth/admin/me
    if (path?.includes('/auth/admin/me')) {
      console.log(`[DIAG HttpExceptionFilter.catch] Final HTTP status: ${httpStatus}`);
      console.log(`[DIAG HttpExceptionFilter.catch] Error response code: ${errorResponse.code}`);
      console.log(`[DIAG HttpExceptionFilter.catch] Error response message: ${errorResponse.message}`);
    }

    // Envoyer la réponse formatée au client (sans statusCode dans le body)
    response.status(httpStatus).json(errorResponse);
  }

  /**
   * Formate l'erreur selon son type (HttpException, Prisma, Error, etc.)
   *
   * @param exception - L'exception à formater
   * @param path - Chemin de la requête (pour logging uniquement)
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatError(
    exception: unknown,
    path: string,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    // Cas 1: HttpException (exceptions NestJS standard)
    if (exception instanceof HttpException) {
      return this.formatHttpException(exception, requestId, isProduction);
    }

    // Cas 2: Erreurs Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.formatPrismaError(exception, requestId, isProduction);
    }

    // Cas 3: Erreurs Prisma de validation
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides',
        requestId,
      };
    }

    // Cas 4: Erreur générique (Error)
    if (exception instanceof Error) {
      return this.formatGenericError(exception, requestId, isProduction);
    }

    // Cas 5: Erreur inconnue (type non reconnu)
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur inattendue est survenue',
      requestId,
    };
  }

  /**
   * Formate une HttpException (exceptions NestJS)
   *
   * @param exception - L'exception HttpException
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatHttpException(
    exception: HttpException,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // LOG DE DIAGNOSTIC TEMPORAIRE pour /auth/admin/me
    // Note: on ne peut pas accéder à request ici, donc on log dans catch() plus haut

    // Détecter le code d'erreur à partir du message ou du status
    let code: ErrorCode = HTTP_STATUS_TO_ERROR_CODE[statusCode] || 'INTERNAL_SERVER_ERROR';
    let message: string;
    let details: ValidationErrorDetail[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      // Essayer de détecter des codes spécifiques depuis le message
      code = this.detectErrorCodeFromMessage(message, statusCode);
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as any;

      // Cas spécial: erreurs de validation (422)
      if (statusCode === HttpStatus.UNPROCESSABLE_ENTITY && response.errors) {
        code = 'VALIDATION_ERROR';
        message = response.message || 'Erreurs de validation';
        // Extraire les détails de validation depuis response.errors
        details = this.extractValidationDetails(response.errors);
      } else if (response.message) {
        // Message simple ou array de messages
        if (Array.isArray(response.message)) {
          message = response.message[0] || 'Erreur de validation';
          // Si c'est un array de strings, essayer d'extraire les détails
          if (response.errors && Array.isArray(response.errors)) {
            details = this.extractValidationDetails(response.errors);
          }
        } else {
          message = response.message;
        }
        // Détecter le code depuis le message
        code = this.detectErrorCodeFromMessage(message, statusCode);
      } else {
        message = 'Une erreur est survenue';
      }
    } else {
      message = 'Une erreur est survenue';
    }

    // Normaliser le message pour la production (pas de détails techniques)
    if (isProduction && statusCode >= 500) {
      message = 'Une erreur serveur est survenue';
      code = 'INTERNAL_SERVER_ERROR';
    }

    return {
      code,
      message,
      requestId,
      ...(details && details.length > 0 ? { details } : {}),
    };
  }

  /**
   * Détecte le code d'erreur à partir du message et du status HTTP
   *
   * @param message - Message d'erreur
   * @param statusCode - Code HTTP
   * @returns Code d'erreur détecté
   */
  private detectErrorCodeFromMessage(message: string, statusCode: number): ErrorCode {
    const lowerMessage = message.toLowerCase();

    // Détection basée sur le contenu du message
    if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('identifiants invalides')) {
      return 'AUTH_INVALID_CREDENTIALS';
    }
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('non autorisé')) {
      return 'AUTH_UNAUTHORIZED';
    }
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('interdit')) {
      return 'AUTH_FORBIDDEN';
    }
    if (lowerMessage.includes('token expired') || lowerMessage.includes('token expiré')) {
      return 'AUTH_TOKEN_EXPIRED';
    }
    if (lowerMessage.includes('invalid token') || lowerMessage.includes('token invalide') ||
        lowerMessage.includes('token admin invalide') || lowerMessage.includes('token admin manquant') ||
        lowerMessage.includes('token admin expiré')) {
      return 'AUTH_TOKEN_INVALID';
    }
    if (lowerMessage.includes('2fa') || lowerMessage.includes('two factor')) {
      if (lowerMessage.includes('required') || lowerMessage.includes('requis')) {
        return 'AUTH_2FA_REQUIRED';
      }
      if (lowerMessage.includes('invalid') || lowerMessage.includes('invalide')) {
        return 'AUTH_2FA_INVALID';
      }
    }
    // IMPORTANT: Ne pas détecter "token invalide" comme validation_error
    // Vérifier d'abord les erreurs d'auth avant les erreurs de validation
    if ((lowerMessage.includes('validation') || lowerMessage.includes('invalide')) &&
        !lowerMessage.includes('token') && !lowerMessage.includes('auth') && !lowerMessage.includes('admin')) {
      return 'VALIDATION_ERROR';
    }
    if (lowerMessage.includes('not found') || lowerMessage.includes('introuvable')) {
      return 'NOT_FOUND';
    }
    if (lowerMessage.includes('already exists') || lowerMessage.includes('déjà utilisé')) {
      return 'UNIQUE_CONSTRAINT_VIOLATION';
    }

    // Fallback sur le mapping HTTP status
    return HTTP_STATUS_TO_ERROR_CODE[statusCode] || 'INTERNAL_SERVER_ERROR';
  }

  /**
   * Extrait les détails de validation depuis un array d'erreurs
   *
   * @param errors - Array d'erreurs (strings ou objets)
   * @returns Détails de validation formatés
   */
  private extractValidationDetails(errors: any[]): ValidationErrorDetail[] {
    return errors.map((error, index) => {
      if (typeof error === 'string') {
        // Si c'est une string, essayer de parser "field: issue" ou utiliser l'index
        const parts = error.split(':');
        if (parts.length >= 2) {
          return {
            field: parts[0].trim(),
            issue: parts.slice(1).join(':').trim(),
          };
        }
        return {
          field: `field_${index}`,
          issue: error,
        };
      } else if (error && typeof error === 'object') {
        // Si c'est un objet avec property et constraints (class-validator)
        if (error.property && error.constraints) {
          const constraintMessages = Object.values(error.constraints) as string[];
          return {
            field: error.property,
            issue: constraintMessages.join(', '),
          };
        }
        // Si c'est un objet avec field et issue
        if (error.field && error.issue) {
          return {
            field: error.field,
            issue: error.issue,
          };
        }
      }
      // Fallback
      return {
        field: `field_${index}`,
        issue: String(error),
      };
    });
  }

  /**
   * Formate une erreur Prisma
   *
   * MAPPING DES CODES PRISMA:
   * - P2002: Unique constraint violation → UNIQUE_CONSTRAINT_VIOLATION
   * - P2025: Record not found → RECORD_NOT_FOUND
   * - P2003: Foreign key constraint → FOREIGN_KEY_CONSTRAINT_VIOLATION
   * - P2014: Invalid ID → INVALID_RELATION
   * - P1001/P1008/P1010: Database connection → DATABASE_CONNECTION_ERROR
   *
   * @param exception - L'erreur Prisma
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    // Extraire le message d'erreur Prisma
    const prismaMessage = exception.message;

    // Obtenir le code d'erreur depuis le mapping
    const code = PRISMA_ERROR_CODE_TO_ERROR_CODE[exception.code] || 'BAD_REQUEST';

    // Mapper selon le code d'erreur Prisma
    switch (exception.code) {
      // P2002: Unique constraint violation (ex: email déjà utilisé)
      case 'P2002': {
        const target = (exception.meta as any)?.target as string[] | undefined;
        const field = target?.[0] || 'champ';
        return {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `Cette ${field} est déjà utilisée`,
          requestId,
        };
      }

      // P2025: Record not found
      case 'P2025': {
        return {
          code: 'RECORD_NOT_FOUND',
          message: 'Ressource introuvable',
          requestId,
        };
      }

      // P2003: Foreign key constraint violation
      case 'P2003': {
        return {
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Données de référence invalides',
          requestId,
        };
      }

      // P2014: Invalid ID (required relation missing)
      case 'P2014': {
        return {
          code: 'INVALID_RELATION',
          message: 'Données de relation invalides',
          requestId,
        };
      }

      // P1001: Cannot reach database server
      // P1008: Operations timed out
      // P1010: User, database or password not found
      case 'P1001':
      case 'P1008':
      case 'P1010': {
        return {
          code: 'DATABASE_CONNECTION_ERROR',
          message: isProduction
            ? 'Service temporairement indisponible'
            : `Erreur de connexion à la base de données: ${prismaMessage}`,
          requestId,
        };
      }

      // Par défaut: BAD_REQUEST
      default: {
        return {
          code: 'BAD_REQUEST',
          message: isProduction ? 'Requête invalide' : `Erreur Prisma: ${prismaMessage}`,
          requestId,
        };
      }
    }
  }

  /**
   * Formate une erreur générique (Error)
   *
   * @param exception - L'erreur Error
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatGenericError(
    exception: Error,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    // En production, ne jamais exposer le message d'erreur technique
    const message = isProduction
      ? 'Une erreur serveur est survenue'
      : exception.message || 'Une erreur inattendue est survenue';

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      requestId,
    };
  }

  /**
   * Convertit un code d'erreur en code HTTP
   *
   * @param code - Code d'erreur
   * @returns Code HTTP correspondant
   */
  private getHttpStatusFromErrorCode(code: ErrorCode): number {
    const mapping: Record<ErrorCode, number> = {
      // Authentification
      AUTH_INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
      AUTH_UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
      AUTH_TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,
      AUTH_TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
      AUTH_FORBIDDEN: HttpStatus.FORBIDDEN,
      AUTH_2FA_REQUIRED: HttpStatus.UNAUTHORIZED,
      AUTH_2FA_INVALID: HttpStatus.UNAUTHORIZED,
      // Validation
      VALIDATION_ERROR: HttpStatus.UNPROCESSABLE_ENTITY,
      // CORS
      CORS_FORBIDDEN: HttpStatus.FORBIDDEN,
      // Prisma
      UNIQUE_CONSTRAINT_VIOLATION: HttpStatus.CONFLICT,
      RECORD_NOT_FOUND: HttpStatus.NOT_FOUND,
      FOREIGN_KEY_CONSTRAINT_VIOLATION: HttpStatus.BAD_REQUEST,
      INVALID_RELATION: HttpStatus.BAD_REQUEST,
      DATABASE_CONNECTION_ERROR: HttpStatus.SERVICE_UNAVAILABLE,
      // Générique
      BAD_REQUEST: HttpStatus.BAD_REQUEST,
      NOT_FOUND: HttpStatus.NOT_FOUND,
      CONFLICT: HttpStatus.CONFLICT,
      INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
      SERVICE_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
    };

    return mapping[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Log l'erreur avec tous les détails (pour le debugging, jamais exposé au client)
   *
   * @param exception - L'exception originale
   * @param request - La requête HTTP
   * @param errorResponse - La réponse formatée (pour logger aussi)
   * @param isProduction - Si on est en production
   */
  private logError(
    exception: unknown,
    request: RequestWithId,
    errorResponse: ErrorResponse,
    isProduction: boolean,
  ) {
    const { method, url, ip } = request;
    const userId = (request as any).user?.id || null;
    const httpStatus = this.getHttpStatusFromErrorCode(errorResponse.code);

    // Construire le log d'erreur
    const logData: any = {
      requestId: errorResponse.requestId,
      method,
      path: url,
      statusCode: httpStatus,
      code: errorResponse.code,
      message: errorResponse.message,
      userId: userId || undefined,
      ip,
    };

    // Ajouter les détails de validation si présents
    if (errorResponse.details && errorResponse.details.length > 0) {
      logData.details = errorResponse.details;
    }

    // En production, logger les détails complets mais ne jamais les exposer
    // En dev, inclure aussi la stacktrace dans les logs
    if (!isProduction && exception instanceof Error) {
      logData.stack = exception.stack;
    }

    // Logger selon le niveau de sévérité
    if (httpStatus >= 500) {
      this.logger.error(JSON.stringify(logData));
    } else if (httpStatus >= 400) {
      this.logger.warn(JSON.stringify(logData));
    }
  }
}

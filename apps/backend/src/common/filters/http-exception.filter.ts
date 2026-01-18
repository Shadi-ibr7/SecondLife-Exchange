/**
 * FICHIER: http-exception.filter.ts
 *
 * DESCRIPTION:
 * Filtre global d'exception pour standardiser les réponses d'erreur de l'API.
 * Toutes les erreurs sont interceptées et formatées selon un format unique.
 *
 * FONCTIONNALITÉS:
 * - Format standardisé pour toutes les erreurs (statusCode, error, message, path, timestamp, requestId)
 * - Gestion des erreurs Prisma (P2002 → 409, P2025 → 404, validation → 400/422, etc.)
 * - Gestion des HttpException de NestJS
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
 *   "statusCode": number,
 *   "error": "BadRequest" | "Unauthorized" | "Forbidden" | "NotFound" | "Conflict" | "InternalServerError",
 *   "message": string,
 *   "path": string,
 *   "timestamp": string (ISO 8601),
 *   "requestId": string (UUID)
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

/**
 * INTERFACE: ErrorResponse
 *
 * Format standardisé des réponses d'erreur de l'API.
 */
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  requestId: string;
  stack?: string; // Uniquement en développement
}

/**
 * MAPPING DES CODES HTTP VERS NOMS D'ERREUR
 */
const HTTP_STATUS_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BadRequest',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'NotFound',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'MethodNotAllowed',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UnprocessableEntity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TooManyRequests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'InternalServerError',
  [HttpStatus.BAD_GATEWAY]: 'BadGateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'ServiceUnavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'GatewayTimeout',
};

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

    // Formater l'erreur selon son type
    const errorResponse = this.formatError(exception, path, requestId, isProduction);

    // Logger l'erreur avec tous les détails (mais ne pas les renvoyer au client)
    this.logError(exception, request, errorResponse, isProduction);

    // Envoyer la réponse formatée au client
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Formate l'erreur selon son type (HttpException, Prisma, Error, etc.)
   *
   * @param exception - L'exception à formater
   * @param path - Chemin de la requête
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production (pour décider si inclure la stacktrace)
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
      return this.formatHttpException(exception, path, requestId, isProduction);
    }

    // Cas 2: Erreurs Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.formatPrismaError(exception, path, requestId, isProduction);
    }

    // Cas 3: Erreurs Prisma de validation
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BadRequest',
        message: 'Données invalides',
        path,
        timestamp: new Date().toISOString(),
        requestId,
        ...(isProduction ? {} : { stack: exception.stack }),
      };
    }

    // Cas 4: Erreur générique (Error)
    if (exception instanceof Error) {
      return this.formatGenericError(exception, path, requestId, isProduction);
    }

    // Cas 5: Erreur inconnue (type non reconnu)
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Une erreur inattendue est survenue',
      path,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * Formate une HttpException (exceptions NestJS)
   *
   * @param exception - L'exception HttpException
   * @param path - Chemin de la requête
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatHttpException(
    exception: HttpException,
    path: string,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extraire le message d'erreur
    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // Gérer les réponses complexes (ex: validation errors avec array d'erreurs)
      const response = exceptionResponse as any;
      if (response.message) {
        // Si c'est un array (validation errors), prendre le premier ou joindre
        message = Array.isArray(response.message)
          ? response.message[0] || 'Erreur de validation'
          : response.message;
      } else {
        message = 'Une erreur est survenue';
      }
    } else {
      message = 'Une erreur est survenue';
    }

    // Normaliser le message pour la production (pas de détails techniques)
    if (isProduction && statusCode >= 500) {
      message = 'Une erreur serveur est survenue';
    }

    const errorName = HTTP_STATUS_NAMES[statusCode] || 'InternalServerError';

    return {
      statusCode,
      error: errorName,
      message,
      path,
      timestamp: new Date().toISOString(),
      requestId,
      ...(isProduction ? {} : { stack: exception.stack }),
    };
  }

  /**
   * Formate une erreur Prisma
   *
   * MAPPING DES CODES PRISMA:
   * - P2002: Unique constraint violation → 409 Conflict
   * - P2025: Record not found → 404 Not Found
   * - P2003: Foreign key constraint → 400 Bad Request
   * - P2014: Invalid ID → 400 Bad Request
   * - Autres: 400 Bad Request ou 500 Internal Server Error
   *
   * @param exception - L'erreur Prisma
   * @param path - Chemin de la requête
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    path: string,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    // Extraire le message d'erreur Prisma
    const prismaMessage = exception.message;

    // Mapper selon le code d'erreur Prisma
    switch (exception.code) {
      // P2002: Unique constraint violation (ex: email déjà utilisé)
      case 'P2002': {
        const target = (exception.meta as any)?.target as string[] | undefined;
        const field = target?.[0] || 'champ';
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `Cette ${field} est déjà utilisée`,
          path,
          timestamp: new Date().toISOString(),
          requestId,
          ...(isProduction ? {} : { stack: exception.stack }),
        };
      }

      // P2025: Record not found
      case 'P2025': {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'NotFound',
          message: 'Ressource introuvable',
          path,
          timestamp: new Date().toISOString(),
          requestId,
          ...(isProduction ? {} : { stack: exception.stack }),
        };
      }

      // P2003: Foreign key constraint violation
      case 'P2003': {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'BadRequest',
          message: 'Données de référence invalides',
          path,
          timestamp: new Date().toISOString(),
          requestId,
          ...(isProduction ? {} : { stack: exception.stack }),
        };
      }

      // P2014: Invalid ID (required relation missing)
      case 'P2014': {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'BadRequest',
          message: 'Données de relation invalides',
          path,
          timestamp: new Date().toISOString(),
          requestId,
          ...(isProduction ? {} : { stack: exception.stack }),
        };
      }

      // P1001: Cannot reach database server
      // P1008: Operations timed out
      // P1010: User, database or password not found
      case 'P1001':
      case 'P1008':
      case 'P1010': {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'ServiceUnavailable',
          message: isProduction
            ? 'Service temporairement indisponible'
            : `Erreur de connexion à la base de données: ${prismaMessage}`,
          path,
          timestamp: new Date().toISOString(),
          requestId,
          ...(isProduction ? {} : { stack: exception.stack }),
        };
      }

      // Par défaut: 400 Bad Request
      default: {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'BadRequest',
          message: isProduction ? 'Requête invalide' : `Erreur Prisma: ${prismaMessage}`,
          path,
          timestamp: new Date().toISOString(),
          requestId,
          ...(isProduction ? {} : { stack: exception.stack }),
        };
      }
    }
  }

  /**
   * Formate une erreur générique (Error)
   *
   * @param exception - L'erreur Error
   * @param path - Chemin de la requête
   * @param requestId - ID unique de la requête
   * @param isProduction - Si on est en production
   * @returns Réponse d'erreur formatée
   */
  private formatGenericError(
    exception: Error,
    path: string,
    requestId: string,
    isProduction: boolean,
  ): ErrorResponse {
    // En production, ne jamais exposer le message d'erreur technique
    const message = isProduction
      ? 'Une erreur serveur est survenue'
      : exception.message || 'Une erreur inattendue est survenue';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message,
      path,
      timestamp: new Date().toISOString(),
      requestId,
      ...(isProduction ? {} : { stack: exception.stack }),
    };
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

    // Construire le log d'erreur
    const logData: any = {
      requestId: errorResponse.requestId,
      method,
      path: errorResponse.path,
      statusCode: errorResponse.statusCode,
      error: errorResponse.error,
      message: errorResponse.message,
      userId: userId || undefined,
      ip,
    };

    // En production, logger les détails complets mais ne jamais les exposer
    // En dev, inclure aussi la stacktrace dans les logs
    if (!isProduction && exception instanceof Error) {
      logData.stack = exception.stack;
    }

    // Logger selon le niveau de sévérité
    if (errorResponse.statusCode >= 500) {
      this.logger.error(JSON.stringify(logData));
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(JSON.stringify(logData));
    }
  }
}

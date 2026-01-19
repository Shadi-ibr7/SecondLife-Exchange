/**
 * FICHIER: http-logging.interceptor.ts
 *
 * DESCRIPTION:
 * Intercepteur pour logger toutes les requêtes HTTP avec des informations structurées.
 * Remplace l'ancien LoggingInterceptor avec des fonctionnalités améliorées.
 *
 * FONCTIONNALITÉS:
 * - Log au début et à la fin de chaque requête
 * - Durée de traitement en millisecondes
 * - RequestId pour tracer la requête
 * - UserId si l'utilisateur est authentifié
 * - Méthode HTTP, route, code de statut
 * - Niveaux: info (2xx, 3xx), warn (4xx), error (5xx)
 * - Ne logue jamais les données sensibles (password, token, cookies)
 *
 * UTILISATION:
 * - Configuré globalement dans main.ts
 * - S'applique automatiquement à toutes les routes
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithId } from '../middleware/request-id.middleware';

/**
 * INTERCEPTEUR: HttpLoggingInterceptor
 *
 * Logge toutes les requêtes HTTP avec des informations structurées.
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  /**
   * MÉTHODE PRINCIPALE: intercept
   *
   * Cette méthode est appelée pour chaque requête HTTP.
   * Elle enregistre les informations de la requête et de la réponse.
   *
   * @param context - Contexte d'exécution contenant les infos de la requête
   * @param next - Handler pour continuer l'exécution vers le contrôleur
   * @returns Observable qui émet la réponse
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Récupérer la requête HTTP depuis le contexte
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse();

    // Extraire les informations de la requête
    const { method, url, path, ip } = request;
    const requestId = request.requestId || 'unknown';
    const userId = (request as any).user?.id || null;

    // Filtrer les paramètres sensibles de l'URL (query params avec password, token, etc.)
    const safeUrl = this.sanitizeUrl(url);

    // Enregistrer le début de la requête (optionnel, pour traçage détaillé)
    // Le log principal sera fait à la fin avec toutes les infos

    // Enregistrer l'heure de début pour calculer la durée
    const startTime = Date.now();

    // Continuer l'exécution et intercepter la réponse
    return next.handle().pipe(
      tap({
        // next: appelé quand la requête réussit
        next: () => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          // Déterminer le niveau de log selon le code de statut
          const logLevel = this.getLogLevel(statusCode);
          const logData = {
            type: 'http_request',
            requestId,
            method,
            url: safeUrl,
            path,
            statusCode,
            durationMs: duration,
            userId: userId || undefined,
            ip,
          };

          // Logger selon le niveau approprié
          // Le logger Pino sera utilisé automatiquement via app.useLogger()
          if (logLevel === 'error') {
            this.logger.error(JSON.stringify(logData));
          } else if (logLevel === 'warn') {
            this.logger.warn(JSON.stringify(logData));
          } else {
            this.logger.log(JSON.stringify(logData));
          }
        },
        // error: appelé quand une erreur se produit
        error: (error) => {
          const statusCode = error.status || error.statusCode || 500;
          const duration = Date.now() - startTime;

          // Déterminer le niveau de log selon le code de statut
          const logLevel = this.getLogLevel(statusCode);

          const logData = {
            type: 'http_request',
            requestId,
            method,
            url: safeUrl,
            path,
            statusCode,
            durationMs: duration,
            userId: userId || undefined,
            ip,
            error: this.sanitizeMessage(error.message || 'Unknown error'),
            // Ne jamais logger les détails complets de l'erreur en prod
            // pour éviter d'exposer des informations sensibles
          };

          // Logger selon le niveau approprié
          if (logLevel === 'error') {
            this.logger.error(JSON.stringify(logData));
          } else if (logLevel === 'warn') {
            this.logger.warn(JSON.stringify(logData));
          } else {
            this.logger.log(JSON.stringify(logData));
          }
        },
      }),
    );
  }

  /**
   * Détermine le niveau de log selon le code de statut HTTP.
   *
   * @param statusCode - Code de statut HTTP
   * @returns Niveau de log: 'info', 'warn', ou 'error'
   */
  private getLogLevel(statusCode: number): 'info' | 'warn' | 'error' {
    if (statusCode >= 500) {
      return 'error'; // 5xx: erreurs serveur
    } else if (statusCode >= 400) {
      return 'warn'; // 4xx: erreurs client
    } else {
      return 'info'; // 2xx, 3xx: succès
    }
  }

  /**
   * Sanitise l'URL pour retirer les paramètres sensibles.
   * Ne logue jamais les mots de passe, tokens, ou autres données sensibles.
   *
   * @param url - URL à sanitiser
   * @returns URL sans paramètres sensibles
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, 'http://dummy'); // Base URL pour parser les URLs relatives
      const sensitiveParams = ['password', 'token', 'access_token', 'refresh_token', 'secret', 'key', 'api_key'];

      // Retirer les paramètres sensibles de la query string
      sensitiveParams.forEach((param) => {
        urlObj.searchParams.delete(param);
        urlObj.searchParams.delete(param.toLowerCase());
        urlObj.searchParams.delete(param.toUpperCase());
      });

      return urlObj.pathname + (urlObj.search ? urlObj.search : '');
    } catch {
      // Si l'URL ne peut pas être parsée, retourner l'URL originale
      // mais filtrer quand même les chaînes sensibles
      let safeUrl = url;
      const sensitiveParams = ['password', 'token', 'access_token', 'refresh_token', 'secret', 'key', 'api_key'];
      sensitiveParams.forEach((param) => {
        const regex = new RegExp(`[?&]${param}=[^&]*`, 'gi');
        safeUrl = safeUrl.replace(regex, '');
      });
      return safeUrl;
    }
  }

  /**
   * Sanitise un message pour retirer les secrets.
   *
   * @param message - Message à sanitiser
   * @returns Message sans secrets
   */
  private sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return message;
    }

    // Liste des patterns sensibles à masquer
    const sensitivePatterns = [
      /password["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
      /token["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
      /secret["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
      /api[_-]?key["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
      /authorization["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
      /cookie["\s]*[:=]["\s]*([^"'\s,}]+)/gi,
    ];

    let sanitized = message;
    sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, (match, value) => {
        return match.replace(value, '***REDACTED***');
      });
    });

    return sanitized;
  }
}
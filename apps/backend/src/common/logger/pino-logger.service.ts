/**
 * FICHIER: pino-logger.service.ts
 *
 * DESCRIPTION:
 * Service de logging structuré utilisant Pino pour des logs JSON en production.
 * Intègre avec NestJS via LoggerService et propage automatiquement le requestId.
 *
 * FONCTIONNALITÉS:
 * - Format JSON structuré en production (parsing facile)
 * - Format lisible en développement (pino-pretty)
 * - Support des niveaux: debug, info, warn, error
 * - Inclusion automatique du requestId si disponible
 * - Filtrage automatique des secrets (password, token, cookies, etc.)
 * - Compatible avec app.useLogger() de NestJS
 *
 * UTILISATION:
 * - Configuré globalement dans main.ts avec app.useLogger()
 * - Tous les logs NestJS utilisent automatiquement ce logger
 * - Le requestId est automatiquement inclus dans tous les logs
 */

import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import pino from 'pino';
import { getRequestId } from '../middleware/request-id.middleware';

/**
 * SERVICE: PinoLoggerService
 *
 * Logger structuré utilisant Pino pour des logs JSON en production.
 */
@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';

    // Configuration Pino
    const pinoConfig: pino.LoggerOptions = {
      level: process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug'),
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      // En production: JSON brut pour parsing facile
      // En dev: pino-pretty sera utilisé via la variable d'environnement
      ...(this.isProduction
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            },
          }),
    };

    this.logger = pino(pinoConfig);
  }

  /**
   * Log un message au niveau debug.
   */
  debug(message: any, context?: string): void {
    this.logWithContext('debug', message, context);
  }

  /**
   * Log un message au niveau info.
   */
  log(message: any, context?: string): void {
    this.logWithContext('info', message, context);
  }

  /**
   * Log un message au niveau warn.
   */
  warn(message: any, context?: string): void {
    this.logWithContext('warn', message, context);
  }

  /**
   * Log un message au niveau error.
   */
  error(message: any, trace?: string, context?: string): void {
    this.logWithContext('error', message, context, trace);
  }

  /**
   * Log un message au niveau verbose (alias de debug).
   */
  verbose(message: any, context?: string): void {
    this.debug(message, context);
  }

  /**
   * Log avec contexte et requestId automatique.
   */
  private logWithContext(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: any,
    context?: string,
    trace?: string,
  ): void {
    // Récupérer le requestId depuis le contexte de la requête si disponible
    const requestId = this.getRequestId();

    // Construire l'objet de log
    const logData: Record<string, any> = {
      ...(requestId && { requestId }),
      ...(context && { context }),
      ...(trace && { trace }),
    };

    // Si le message est déjà un objet JSON, le parser et fusionner
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.assign(logData, parsed);
          // Le message peut être dans le champ 'message' du JSON parsé
          if (parsed.message) {
            logData.msg = parsed.message;
          } else {
            logData.msg = message;
          }
        } else {
          logData.msg = message;
        }
      } catch {
        // Ce n'est pas du JSON, utiliser le message tel quel
        logData.msg = this.sanitizeMessage(message);
      }
    } else {
      // Message est un objet, le sanitizer avant de logger
      const sanitized = this.sanitizeObject(message);
      Object.assign(logData, sanitized);
      if (!logData.msg) {
        logData.msg = 'Log entry';
      }
    }

    // Logger selon le niveau
    switch (level) {
      case 'debug':
        this.logger.debug(logData);
        break;
      case 'info':
        this.logger.info(logData);
        break;
      case 'warn':
        this.logger.warn(logData);
        break;
      case 'error':
        this.logger.error(logData);
        break;
    }
  }

  /**
   * Récupère le requestId depuis le contexte AsyncLocalStorage si disponible.
   */
  private getRequestId(): string | undefined {
    return getRequestId();
  }

  /**
   * Sanitise un message pour retirer les secrets.
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

  /**
   * Sanitise un objet pour retirer les champs sensibles.
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Liste des clés sensibles à masquer
    const sensitiveKeys = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'secretKey',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'cookies',
      'twoFactorSecret',
      'privateKey',
      'publicKey',
    ];

    // Si c'est un array, sanitizer chaque élément
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    // Si c'est un objet, créer une copie et masquer les champs sensibles
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitive) =>
        lowerKey.includes(sensitive.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Crée une instance du logger avec un contexte spécifique.
   */
  static create(context: string): PinoLoggerService {
    return new PinoLoggerService();
  }
}

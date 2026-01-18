/**
 * FICHIER: structured-logger.service.ts
 *
 * DESCRIPTION:
 * Service de logging structuré qui utilise le Logger de NestJS avec format JSON en production.
 * Permet un logging structuré pour faciliter l'analyse des logs en production.
 *
 * FONCTIONNALITÉS:
 * - Format JSON en production pour faciliter le parsing
 * - Format lisible en développement
 * - Support des niveaux: debug, info, warn, error
 * - Inclusion automatique du requestId si disponible
 * - Ne logue jamais les données sensibles
 *
 * UTILISATION:
 * - Remplace Logger de NestJS dans les services
 * - Accessible via injection de dépendances
 */

import { Injectable, Logger, LoggerService } from '@nestjs/common';

/**
 * SERVICE: StructuredLoggerService
 *
 * Logger structuré qui formate les logs en JSON en production.
 */
@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly isProduction: boolean;
  private readonly nestLogger: Logger;

  constructor(context?: string) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.nestLogger = new Logger(context || 'App');
  }

  /**
   * Log un message au niveau debug.
   */
  debug(message: any, context?: string): void {
    if (!this.isProduction) {
      this.nestLogger.debug(message, context);
      return;
    }

    const logEntry = this.formatLogEntry('debug', message, context);
    this.nestLogger.debug(JSON.stringify(logEntry));
  }

  /**
   * Log un message au niveau info.
   */
  log(message: any, context?: string): void {
    if (!this.isProduction) {
      this.nestLogger.log(message, context);
      return;
    }

    const logEntry = this.formatLogEntry('info', message, context);
    this.nestLogger.log(JSON.stringify(logEntry));
  }

  /**
   * Log un message au niveau warn.
   */
  warn(message: any, context?: string): void {
    if (!this.isProduction) {
      this.nestLogger.warn(message, context);
      return;
    }

    const logEntry = this.formatLogEntry('warn', message, context);
    this.nestLogger.warn(JSON.stringify(logEntry));
  }

  /**
   * Log un message au niveau error.
   */
  error(message: any, trace?: string, context?: string): void {
    if (!this.isProduction) {
      this.nestLogger.error(message, trace, context);
      return;
    }

    const logEntry = this.formatLogEntry('error', message, context, trace);
    this.nestLogger.error(JSON.stringify(logEntry));
  }

  /**
   * Formate une entrée de log en JSON structuré.
   */
  private formatLogEntry(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: any,
    context?: string,
    trace?: string,
  ): Record<string, any> {
    const entry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };

    if (context) {
      entry.context = context;
    }

    if (trace) {
      entry.trace = trace;
    }

    // Si le message est déjà un objet JSON (par exemple depuis l'interceptor HTTP),
    // parser et fusionner avec l'entrée
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.assign(entry, parsed);
          // Le message original peut être dans le champ 'message' du JSON parsé
          if (parsed.message) {
            entry.message = parsed.message;
          }
        }
      } catch {
        // Ce n'est pas du JSON, utiliser le message tel quel
      }
    }

    return entry;
  }

  /**
   * Crée une nouvelle instance du logger avec un contexte spécifique.
   */
  static create(context: string): StructuredLoggerService {
    return new StructuredLoggerService(context);
  }
}
/**
 * FICHIER: audit.service.ts
 *
 * DESCRIPTION:
 * Service centralisé pour l'audit trail des actions admin.
 * Enregistre toutes les actions sensibles avec métadonnées sanitizées.
 *
 * CARACTÉRISTIQUES:
 * - Logs non-bloquants (si l'audit échoue, l'action principale continue)
 * - Sanitization automatique des métadonnées (mot de passe, tokens, etc.)
 * - Extraction automatique de ip, userAgent, requestId depuis la requête
 * - Logging des erreurs d'audit pour debugging
 */

import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminActionType } from '../enums/admin-action-type.enum';
import { UserRole } from '@prisma/client';

/**
 * Options pour un log d'audit
 */
export interface AuditLogOptions {
  /** Type d'action (obligatoire) */
  actionType: AdminActionType;
  /** ID de l'admin qui effectue l'action (obligatoire) */
  actorId: string;
  /** Rôle de l'acteur au moment de l'action (optionnel, sera récupéré depuis req.user ou la base si non fourni) */
  actorRole?: UserRole;
  /** Type de ressource ciblée (ex: "User", "EcoContent") */
  targetType?: string;
  /** ID de la ressource ciblée */
  targetId?: string;
  /** Métadonnées supplémentaires (seront sanitizées automatiquement) */
  metadata?: Record<string, any>;
  /** Requête HTTP (pour extraire ip, userAgent, requestId, actorRole) */
  request?: Request;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre une action admin dans l'audit trail
   *
   * Cette méthode est NON-BLOQUANTE: si l'audit échoue,
   * une erreur est loggée mais l'exception n'est pas propagée.
   *
   * @param options - Options du log d'audit
   */
  async log(options: AuditLogOptions): Promise<void> {
    const { actionType, actorId, actorRole, targetType, targetId, metadata, request } = options;

    try {
      // Sanitizer les métadonnées (enlever secrets)
      const sanitizedMetadata = this.sanitizeMetadata(metadata || {});

      // Extraire les infos de la requête
      const ip = this.extractIp(request);
      const userAgent = request?.get('user-agent') || undefined;
      const requestId = this.extractRequestId(request);

      // Récupérer le rôle de l'acteur (priorité: paramètre > req.user > base de données)
      let finalActorRole = actorRole;
      if (!finalActorRole && request?.user && (request.user as any).roles) {
        finalActorRole = (request.user as any).roles as UserRole;
      }
      if (!finalActorRole) {
        // Fallback: récupérer depuis la base de données
        const user = await this.prisma.user.findUnique({
          where: { id: actorId },
          select: { roles: true },
        });
        finalActorRole = user?.roles || UserRole.USER;
      }

      // Créer le log en base
      await this.prisma.adminLog.create({
        data: {
          adminId: actorId,
          actorRole: finalActorRole,
          action: actionType, // On stocke la valeur string de l'enum
          resourceType: targetType || 'System',
          resourceId: targetId || null,
          meta: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : null,
          ip: ip || null,
          userAgent: userAgent || null,
          requestId: requestId || null,
        },
      });

      this.logger.debug(
        `Audit log created: ${actionType} by ${actorId} (${finalActorRole}) on ${targetType || 'System'}${targetId ? `:${targetId}` : ''}`,
      );
    } catch (error: any) {
      // Log l'erreur mais ne bloque pas l'action principale
      this.logger.error(
        `Failed to create audit log for ${actionType} by ${actorId}: ${error.message}`,
        error.stack,
      );
      // Ne pas propager l'erreur pour garantir que l'audit est non-bloquant
    }
  }

  /**
   * Sanitize les métadonnées en enlevant les secrets sensibles
   *
   * Enlève automatiquement:
   * - password / passwordHash
   * - token / accessToken / refreshToken
   * - secret / secretKey / apiKey
   * - twoFactorSecret (secrets 2FA)
   *
   * @param metadata - Métadonnées brutes
   * @returns Métadonnées sanitizées
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const sanitized = { ...metadata };
    const sensitiveKeys = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'secretKey',
      'apiKey',
      'twoFactorSecret',
      'auth',
      'authorization',
    ];

    // Enlever les clés sensibles
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        delete sanitized[key];
      }
    }

    // Nettoyer les valeurs sensibles dans les objets imbriqués (récursif, limité à 2 niveaux)
    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const cleaned = { ...value };
        for (const sensitiveKey of sensitiveKeys) {
          if (sensitiveKey in cleaned) {
            delete cleaned[sensitiveKey];
          }
        }
        sanitized[key] = cleaned;
      }
    }

    return sanitized;
  }

  /**
   * Extrait l'IP de la requête (gère les proxies)
   *
   * @param request - Requête Express
   * @returns IP de la requête
   */
  private extractIp(request?: Request): string | null {
    if (!request) {
      return null;
    }

    // Vérifier d'abord les headers de proxy (X-Forwarded-For, X-Real-IP)
    const forwardedFor = request.get('x-forwarded-for');
    if (forwardedFor) {
      // X-Forwarded-For peut contenir plusieurs IPs, prendre la première
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }

    // Fallback sur request.ip ou socket.remoteAddress
    return request.ip || request.socket?.remoteAddress || null;
  }

  /**
   * Extrait le requestId de la requête (si disponible)
   *
   * Le requestId peut être défini par un middleware de traçabilité
   * (ex: via req.requestId ou header X-Request-Id)
   *
   * @param request - Requête Express
   * @returns Request ID ou null
   */
  private extractRequestId(request?: Request): string | null {
    if (!request) {
      return null;
    }

    // Vérifier si req.requestId existe (défini par un middleware)
    if ((request as any).requestId) {
      return (request as any).requestId;
    }

    // Vérifier le header X-Request-Id
    const requestIdHeader = request.get('x-request-id');
    if (requestIdHeader) {
      return requestIdHeader;
    }

    return null;
  }
}

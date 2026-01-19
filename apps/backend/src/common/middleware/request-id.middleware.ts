/**
 * FICHIER: request-id.middleware.ts
 *
 * DESCRIPTION:
 * Middleware pour générer et propager un identifiant unique (UUID) pour chaque requête HTTP.
 * Permet de tracer toutes les opérations liées à une même requête dans les logs.
 *
 * FONCTIONNALITÉS:
 * - Génère un UUID si le header X-Request-Id est absent
 * - Utilise le header X-Request-Id existant s'il est présent
 * - Ajoute X-Request-Id dans la réponse HTTP
 * - Attache requestId à req pour utilisation dans les services/intercepteurs
 * - Rend requestId disponible dans le contexte du logger via AsyncLocalStorage
 *
 * UTILISATION:
 * - Configuré globalement dans main.ts
 * - S'applique automatiquement à toutes les routes
 * - Accessible via req['requestId'] dans les contrôleurs/services
 * - Accessible via RequestContext.getRequestId() dans les services
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * INTERFACE: RequestWithId
 *
 * Étend Request pour inclure requestId dans le typage TypeScript.
 */
export interface RequestWithId extends Request {
  requestId: string;
}

/**
 * CONTEXTE: RequestContext
 *
 * Stocke le contexte de la requête (requestId) dans AsyncLocalStorage
 * pour permettre l'accès depuis n'importe où dans le code sans passer par les paramètres.
 */
export interface RequestContext {
  requestId: string;
}

/**
 * STORAGE: AsyncLocalStorage pour le contexte de requête
 *
 * Permet d'accéder au requestId depuis n'importe où dans le code
 * sans avoir à passer la requête en paramètre.
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * HELPER: getRequestId
 *
 * Récupère le requestId depuis le contexte AsyncLocalStorage.
 * Retourne undefined si aucun contexte n'est disponible.
 */
export function getRequestId(): string | undefined {
  const context = requestContextStorage.getStore();
  return context?.requestId;
}

/**
 * MIDDLEWARE: RequestIdMiddleware
 *
 * Génère un identifiant unique pour chaque requête HTTP.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  /**
   * MÉTHODE PRINCIPALE: use
   *
   * Cette méthode est appelée pour chaque requête HTTP.
   * Elle génère ou récupère le requestId et l'ajoute à la requête et à la réponse.
   * Elle stocke aussi le requestId dans AsyncLocalStorage pour accès global.
   *
   * @param req - La requête HTTP Express
   * @param res - La réponse HTTP Express
   * @param next - Fonction pour continuer vers le prochain middleware
   */
  use(req: RequestWithId, res: Response, next: NextFunction) {
    // Récupérer le requestId depuis le header X-Request-Id s'il existe
    // Sinon, générer un nouvel UUID
    const requestId = req.headers['x-request-id']?.[0] || uuidv4();

    // Attacher le requestId à la requête pour utilisation dans les services/intercepteurs
    req.requestId = requestId as string;

    // Ajouter le requestId dans les headers de la réponse
    // Permet au client de connaître l'ID utilisé pour cette requête
    res.setHeader('X-Request-Id', requestId);

    // Stocker le requestId dans AsyncLocalStorage pour accès global
    // Tous les appels asynchrones dans cette requête auront accès au requestId
    requestContextStorage.run({ requestId }, () => {
      next();
    });
  }
}
/**
 * FICHIER: logging.interceptor.ts
 *
 * DESCRIPTION:
 * Cet intercepteur enregistre toutes les requêtes HTTP entrantes dans l'API.
 * Il mesure le temps de réponse et enregistre les informations importantes
 * pour le débogage et le monitoring.
 *
 * FONCTIONNALITÉS:
 * - Enregistre la méthode HTTP (GET, POST, PUT, DELETE, etc.)
 * - Enregistre l'URL de la requête
 * - Enregistre le code de statut de la réponse (200, 404, 500, etc.)
 * - Mesure et enregistre le temps de réponse en millisecondes
 * - Enregistre les erreurs avec leur message
 *
 * UTILISATION:
 * - Configuré globalement dans main.ts
 * - S'applique automatiquement à toutes les routes
 * - Les logs apparaissent dans la console du serveur
 */

// Import des interfaces et classes NestJS nécessaires
import {
  Injectable, // Décorateur pour créer un service injectable
  NestInterceptor, // Interface pour créer un intercepteur
  ExecutionContext, // Contexte d'exécution (contient les infos de la requête)
  CallHandler, // Handler pour continuer l'exécution de la requête
  Logger, // Service de logging intégré
} from '@nestjs/common';

// Import de RxJS pour la programmation réactive
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * INTERCEPTEUR: LoggingInterceptor
 *
 * Cet intercepteur intercepte toutes les requêtes HTTP avant qu'elles n'atteignent
 * le contrôleur, et enregistre les informations après la réponse.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Logger pour enregistrer les messages
  private readonly logger = new Logger(LoggingInterceptor.name);

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
    const request = context.switchToHttp().getRequest();
    const { method, url } = request; // Méthode HTTP (GET, POST, etc.) et URL

    // Enregistrer l'heure de début pour calculer la durée
    const now = Date.now();

    // Continuer l'exécution et intercepter la réponse
    return next.handle().pipe(
      // tap: opérateur RxJS qui exécute du code sans modifier la réponse
      tap({
        // next: appelé quand la requête réussit
        next: (data) => {
          // Récupérer la réponse HTTP
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response; // Code de statut (200, 404, etc.)

          // Calculer le temps de réponse en millisecondes
          const delay = Date.now() - now;

          // Enregistrer: METHODE URL CODE_STATUS - TEMPS_MS
          // Exemple: "GET /api/v1/items 200 - 45ms"
          this.logger.log(`${method} ${url} ${statusCode} - ${delay}ms`);
        },
        // error: appelé quand une erreur se produit
        error: (error) => {
          // Calculer le temps avant l'erreur
          const delay = Date.now() - now;

          // Enregistrer l'erreur avec le code de statut (ou 500 par défaut)
          // Exemple: "POST /api/v1/users 400 - 12ms - Validation failed"
          this.logger.error(
            `${method} ${url} ${error.status || 500} - ${delay}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}

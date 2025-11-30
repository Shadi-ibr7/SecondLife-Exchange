/**
 * FICHIER: modules/auth/auth.controller.ts
 *
 * RÔLE:
 * Ce contrôleur HTTP est la porte d'entrée REST pour toutes les opérations d'authentification.
 * Il reçoit les requêtes (DTO déjà validés), applique les guards/intercepteurs nécessaires,
 * puis délègue toute la logique métier au `AuthService`.
 *
 * ROUTAGE PRINCIPAL (préfixe `/api/v1/auth`):
 * - `POST /register` : Inscription
 * - `POST /login`    : Connexion
 * - `POST /refresh`  : Rafraîchissement des tokens
 * - `POST /logout`   : Déconnexion (révocation du refresh token)
 *
 * OUTILS & SÉCURITÉ:
 * - `ThrottlerGuard` limite les tentatives de login (anti brute-force)
 * - `JwtRefreshGuard` protège les routes nécessitant un refresh token valide
 * - `LoggingInterceptor` journalise chaque requête pour l'audit
 * - DTOs + ValidationPipe (config globale) assurent la conformité des payloads
 *
 * BONNES PRATIQUES APPLIQUÉES:
 * - Toutes les réponses sont centralisées dans AuthService => code DRY
 * - Découpage clair entre transport (controller) et logique métier (service)
 * - Codes HTTP explicites (`@HttpCode`)
 */

// Import des décorateurs NestJS pour créer un contrôleur
import {
  Controller, // Décorateur pour définir un contrôleur
  Post, // Décorateur pour définir une route POST
  Body, // Décorateur pour extraire le body de la requête
  UseGuards, // Décorateur pour appliquer des guards (sécurité)
  HttpCode, // Décorateur pour définir le code HTTP de réponse
  HttpStatus, // Enum des codes HTTP
  UseInterceptors, // Décorateur pour appliquer des intercepteurs
} from '@nestjs/common';

// Import du guard de rate limiting (limitation des requêtes)
import { ThrottlerGuard } from '@nestjs/throttler';

// Import du service d'authentification
import { AuthService } from './auth.service';

// Import des DTOs pour la validation des données
import { AuthRegisterDto } from './dtos/auth-register.dto';
import { AuthLoginDto } from './dtos/auth-login.dto';

// Import des guards pour protéger les routes
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';

// Import de l'intercepteur de logging
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * CONTRÔLEUR: AuthController
 *
 * - `@Controller('auth')` => toutes les routes seront disponibles sous `/api/v1/auth/*`
 * - `@UseInterceptors(LoggingInterceptor)` => chaque requête/réponse est loggée
 *   (pratique pour auditer les tentatives d'authentification ou investiguer un bug).
 */
@Controller('auth')
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  /**
   * CONSTRUCTEUR
   *
   * On injecte uniquement `AuthService` afin de garder ce contrôleur très fin.
   * Cela facilite les tests e2e (on peut mocker AuthService si nécessaire).
   */
  constructor(private authService: AuthService) {}

  // ============================================
  // ROUTE: POST /api/v1/auth/register
  // ============================================

  /**
   * Endpoint pour l'inscription d'un nouvel utilisateur.
   *
   * @param registerDto - Données d'inscription (email, password, displayName)
   * @returns Tokens JWT et informations de l'utilisateur créé
   *
   * Code HTTP: 201 (CREATED) - Ressource créée avec succès
   *
   * VALIDATION:
   * - Email doit être valide et unique
   * - Mot de passe doit respecter les critères de sécurité (min 10 caractères, majuscule, minuscule, chiffre, caractère spécial)
   * - DisplayName doit contenir entre 2 et 50 caractères
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Code HTTP 201 (créé)
  async register(@Body() registerDto: AuthRegisterDto) {
    /**
     * Le contrôleur se contente de transmettre le DTO validé.
     * AuthService renverra un `TokenResponse` contenant:
     *  - accessToken (15 min)
     *  - refreshToken (7 jours)
     *  - user (payload minimal pour hydrater le frontend)
     */
    return this.authService.register(registerDto);
  }

  // ============================================
  // ROUTE: POST /api/v1/auth/login
  // ============================================

  /**
   * Endpoint pour la connexion d'un utilisateur existant.
   *
   * @param loginDto - Données de connexion (email, password)
   * @returns Tokens JWT et informations de l'utilisateur
   *
   * Code HTTP: 200 (OK) - Connexion réussie
   *
   * SÉCURITÉ:
   * - @UseGuards(ThrottlerGuard): Limite le nombre de tentatives de connexion
   *   (protection contre les attaques par force brute)
   *   Configuration: max 5 tentatives par minute (définie dans app.module.ts)
   *
   * VALIDATION:
   * - Email doit être valide
   * - Mot de passe est requis
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // Code HTTP 200 (succès)
  @UseGuards(ThrottlerGuard) // Protection contre les attaques par force brute
  async login(@Body() loginDto: AuthLoginDto) {
    /**
     * `ThrottlerGuard` s'appuie sur la configuration définie dans `app.module.ts`.
     * Ici, nous limitons volontairement à 5 tentatives/minute pour réduire le brute-force.
     * Toute la logique (vérification du mot de passe, génération des tokens) est déléguée
     * à AuthService pour rester DRY.
     */
    return this.authService.login(loginDto);
  }

  // ============================================
  // ROUTE: POST /api/v1/auth/refresh
  // ============================================

  /**
   * Endpoint pour rafraîchir les tokens JWT.
   *
   * @param refreshToken - Le refresh token à utiliser
   * @returns Nouveaux tokens (access + refresh)
   *
   * Code HTTP: 200 (OK) - Tokens rafraîchis avec succès
   *
   * SÉCURITÉ:
   * - @UseGuards(JwtRefreshGuard): Vérifie que le refresh token est valide
   *   Le guard vérifie automatiquement le token avant d'exécuter cette route
   *
   * UTILISATION:
   * - Appelé automatiquement par le frontend quand l'access token expire
   * - Permet de rester connecté sans se reconnecter
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard) // Vérifie que le refresh token est valide
  async refresh(@Body('refreshToken') refreshToken: string) {
    /**
     * `JwtRefreshGuard` lit automatiquement le refresh token (cookie, header ou body selon implémentation)
     * et vérifie sa signature. On passe ensuite le token brut au service pour déclencher la rotation.
     */
    return this.authService.refresh(refreshToken);
  }

  // ============================================
  // ROUTE: POST /api/v1/auth/logout
  // ============================================

  /**
   * Endpoint pour déconnecter un utilisateur.
   *
   * @param refreshToken - Le refresh token à révoquer
   *
   * Code HTTP: 204 (NO_CONTENT) - Pas de contenu à retourner
   *
   * SÉCURITÉ:
   * - @UseGuards(JwtRefreshGuard): Vérifie que le refresh token est valide
   *   On doit être authentifié pour se déconnecter
   *
   * FONCTIONNEMENT:
   * - Révoque le refresh token dans la base de données
   * - L'utilisateur devra se reconnecter pour obtenir de nouveaux tokens
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT) // Code HTTP 204 (pas de contenu)
  @UseGuards(JwtRefreshGuard) // Vérifie que le refresh token est valide
  async logout(@Body('refreshToken') refreshToken: string) {
    /**
     * Déconnexion = marquer le refresh token comme révoqué.
     * On ne retourne aucun corps (204), ce qui permet au client de simplement nettoyer son storage.
     */
    await this.authService.logout(refreshToken);
  }
}

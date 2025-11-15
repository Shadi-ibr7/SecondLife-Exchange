/**
 * FICHIER: auth.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour l'authentification.
 * Il définit les routes pour l'inscription, la connexion, le rafraîchissement
 * des tokens, et la déconnexion.
 *
 * ROUTES:
 * - POST /api/v1/auth/register - Inscription d'un nouvel utilisateur
 * - POST /api/v1/auth/login - Connexion d'un utilisateur existant
 * - POST /api/v1/auth/refresh - Rafraîchissement des tokens JWT
 * - POST /api/v1/auth/logout - Déconnexion (révocation du refresh token)
 *
 * SÉCURITÉ:
 * - Rate limiting sur la route login (protection contre brute force)
 * - Validation automatique des données avec les DTOs
 * - Guards pour protéger les routes sensibles
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
 * Ce contrôleur gère toutes les routes d'authentification.
 * Le préfixe 'auth' signifie que toutes les routes commencent par /api/v1/auth
 *
 * @UseInterceptors(LoggingInterceptor): Enregistre toutes les requêtes
 * pour le débogage et le monitoring
 */
@Controller('auth')
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service d'authentification
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
    // Déléguer la logique au service
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
    // Déléguer la logique au service
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
    // Déléguer la logique au service
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
    // Déléguer la logique au service
    await this.authService.logout(refreshToken);
  }
}

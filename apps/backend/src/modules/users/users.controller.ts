/**
 * FICHIER: users.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour la gestion du profil utilisateur.
 * Toutes les routes nécessitent une authentification JWT.
 *
 * ROUTES:
 * - GET /api/v1/users/me - Récupérer mes informations
 * - PATCH /api/v1/users/me - Mettre à jour mon profil
 * - DELETE /api/v1/users/me - Supprimer mon compte
 *
 * SÉCURITÉ:
 * - Toutes les routes sont protégées par JwtAccessGuard
 * - L'utilisateur ne peut modifier que son propre profil
 * - L'ID de l'utilisateur est extrait automatiquement du token JWT
 */

// Import des décorateurs NestJS
import {
  Controller, // Décorateur pour définir un contrôleur
  Get, // Décorateur pour une route GET
  Patch, // Décorateur pour une route PATCH (mise à jour partielle)
  Delete, // Décorateur pour une route DELETE
  Body, // Décorateur pour extraire le body
  UseGuards, // Décorateur pour appliquer des guards
  Request, // Décorateur pour accéder à la requête (req.user)
  HttpCode, // Décorateur pour définir le code HTTP
  HttpStatus, // Enum des codes HTTP
  UseInterceptors, // Décorateur pour appliquer des intercepteurs
} from '@nestjs/common';

// Import du service utilisateurs
import { UsersService } from './users.service';

// Import du DTO pour la mise à jour
import { UpdateProfileDto } from './dtos/update-profile.dto';

// Import des guards et intercepteurs
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * CONTRÔLEUR: UsersController
 *
 * Toutes les routes de ce contrôleur nécessitent une authentification JWT.
 * Le préfixe 'users' signifie que les routes commencent par /api/v1/users
 */
@Controller('users')
@UseGuards(JwtAccessGuard) // Protection globale: toutes les routes nécessitent un token JWT
@UseInterceptors(LoggingInterceptor) // Logger toutes les requêtes
export class UsersController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service utilisateurs
   */
  constructor(private usersService: UsersService) {}

  // ============================================
  // ROUTE: GET /api/v1/users/me
  // ============================================

  /**
   * Endpoint pour récupérer les informations de l'utilisateur connecté.
   *
   * @param req - La requête HTTP (contient req.user ajouté par JwtAccessGuard)
   * @returns Informations de l'utilisateur avec son profil
   *
   * Code HTTP: 200 (OK)
   *
   * NOTE:
   * req.user est ajouté automatiquement par JwtAccessGuard après validation du token JWT.
   * Il contient les informations de l'utilisateur extraites du token.
   */
  @Get('me')
  async getMe(@Request() req) {
    // Récupérer l'ID de l'utilisateur depuis le token JWT (ajouté par JwtAccessGuard)
    return this.usersService.getMe(req.user.id);
  }

  // ============================================
  // ROUTE: PATCH /api/v1/users/me
  // ============================================

  /**
   * Endpoint pour mettre à jour le profil de l'utilisateur connecté.
   *
   * @param req - La requête HTTP (contient req.user)
   * @param updateProfileDto - Données à mettre à jour (displayName, avatarUrl, bio, location, preferencesJson)
   * @returns Informations mises à jour de l'utilisateur
   *
   * Code HTTP: 200 (OK)
   *
   * VALIDATION:
   * - Tous les champs sont optionnels (mise à jour partielle)
   * - Les règles de validation sont définies dans UpdateProfileDto
   */
  @Patch('me')
  async updateMe(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    // Mettre à jour le profil de l'utilisateur connecté
    return this.usersService.updateMe(req.user.id, updateProfileDto);
  }

  // ============================================
  // ROUTE: DELETE /api/v1/users/me
  // ============================================

  /**
   * Endpoint pour supprimer le compte de l'utilisateur connecté.
   *
   * @param req - La requête HTTP (contient req.user)
   *
   * Code HTTP: 204 (NO_CONTENT) - Pas de contenu à retourner
   *
   * ATTENTION:
   * Cette opération est irréversible!
   * Supprime:
   * - Tous les refresh tokens
   * - Le profil utilisateur
   * - L'utilisateur lui-même
   * - Et potentiellement les items, échanges, etc. (selon la configuration)
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT) // Code HTTP 204 (pas de contenu)
  async deleteMe(@Request() req) {
    // Supprimer le compte de l'utilisateur connecté
    await this.usersService.deleteMe(req.user.id);
  }
}

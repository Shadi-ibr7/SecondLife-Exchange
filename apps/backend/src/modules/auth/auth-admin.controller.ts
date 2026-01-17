/**
 * FICHIER: auth-admin.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour l'authentification admin avec gestion sécurisée des sessions.
 *
 * ENDPOINTS:
 * - POST /auth/admin/login    - Connexion admin (set cookies)
 * - POST /auth/admin/refresh  - Rafraîchir les tokens (rotation)
 * - POST /auth/admin/logout   - Déconnexion (clear cookies)
 * - GET  /auth/admin/me       - Vérifier session / obtenir infos admin
 *
 * SÉCURITÉ:
 * - Tokens stockés dans cookies httpOnly (pas accessible en JS)
 * - Refresh token rotation avec détection replay attacks
 * - CORS credentials: true requis côté client
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthAdminService } from './auth-admin.service';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import {
  AUTH_COOKIES,
  extractRefreshToken,
} from '../../common/utils/cookie.utils';

/**
 * Interface pour la requête avec user injecté par le guard
 */
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string;
    avatarUrl: string | null;
  };
}

@ApiTags('Admin Auth')
@Controller('auth/admin')
export class AuthAdminController {
  constructor(private readonly authAdminService: AuthAdminService) {}

  /**
   * Connexion admin
   *
   * Vérifie les identifiants et génère les tokens JWT.
   * Les tokens sont stockés dans des cookies httpOnly sécurisés.
   *
   * @param loginDto - Email et mot de passe
   * @param res - Response Express pour set les cookies
   * @returns Informations de l'utilisateur admin
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion admin' })
  @ApiResponse({ status: 200, description: 'Connexion réussie, cookies définis' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authAdminService.login(loginDto, res);
  }

  /**
   * Rafraîchir les tokens
   *
   * Utilise le refresh token (depuis cookie ou body) pour générer
   * une nouvelle paire de tokens. Effectue une rotation sécurisée.
   *
   * SÉCURITÉ:
   * - L'ancien refresh token est révoqué après utilisation
   * - Si un token révoqué est présenté → toute la session est invalidée
   *
   * @param req - Request Express (contient les cookies)
   * @param res - Response Express (pour set nouveaux cookies)
   * @param body - Body optionnel avec refreshToken (fallback)
   * @returns Nouveaux tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens admin' })
  @ApiResponse({ status: 200, description: 'Tokens rafraîchis' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') bodyRefreshToken?: string,
  ) {
    // Extraire le refresh token (cookie prioritaire, sinon body pour rétrocompatibilité)
    const refreshToken =
      extractRefreshToken(req.cookies) || bodyRefreshToken;

    if (!refreshToken) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token requis',
      };
    }

    return this.authAdminService.refresh(refreshToken, res);
  }

  /**
   * Déconnexion admin
   *
   * Révoque le refresh token en base et supprime les cookies.
   *
   * @param req - Request Express (contient les cookies)
   * @param res - Response Express (pour clear cookies)
   * @param body - Body optionnel avec refreshToken (fallback)
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Déconnexion admin' })
  @ApiResponse({ status: 204, description: 'Déconnexion réussie' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') bodyRefreshToken?: string,
  ) {
    // Extraire le refresh token
    const refreshToken =
      extractRefreshToken(req.cookies) || bodyRefreshToken;

    await this.authAdminService.logout(refreshToken, res);
  }

  /**
   * Vérifier la session admin / Obtenir les infos de l'admin connecté
   *
   * Endpoint protégé par JWT. Permet au frontend de vérifier si
   * la session est toujours valide et d'obtenir les infos utilisateur.
   *
   * @param req - Request avec user injecté par AdminJwtGuard
   * @returns Informations de l'admin connecté
   */
  @Get('me')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({ summary: 'Obtenir les infos de l\'admin connecté' })
  @ApiResponse({ status: 200, description: 'Infos admin retournées' })
  @ApiResponse({ status: 401, description: 'Non authentifié ou token expiré' })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.authAdminService.getMe(req.user.id);
  }
}

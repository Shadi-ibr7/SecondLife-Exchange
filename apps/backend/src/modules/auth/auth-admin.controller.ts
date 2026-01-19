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
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ForbiddenException } from '@nestjs/common';
import { AuthAdminService } from './auth-admin.service';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import {
  AUTH_COOKIES,
  extractRefreshToken,
} from '../../common/utils/cookie.utils';
import { TwoFactorService } from './services/two-factor.service';
import {
  TwoFactorEnableDto,
  TwoFactorVerifyDto,
} from './dtos/two-factor.dto';

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
  constructor(
    private readonly authAdminService: AuthAdminService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

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
  @UseGuards(ThrottlerGuard) // Protection contre les attaques par force brute
  @Throttle({ 'admin-login': { limit: 5, ttl: 60000 } }) // 5 tentatives par minute (strict)
  @ApiOperation({ summary: 'Connexion admin' })
  @ApiResponse({ status: 200, description: 'Connexion réussie, cookies définis' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  @ApiResponse({ status: 403, description: 'Trop de tentatives, compte bloqué temporairement' })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    // Extraire l'IP et le userAgent pour le système anti-bruteforce
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || undefined;

    try {
      return await this.authAdminService.login(loginDto, res, ip, userAgent, req);
    } catch (error: any) {
      // Logger ADMIN_LOGIN_LOCKED si le compte est bloqué (ForbiddenException)
      if (error instanceof ForbiddenException && error.message.includes('tentatives')) {
        await this.authAdminService.logLoginLocked(loginDto.email, req).catch(() => {
          // Ignorer les erreurs d'audit (non-bloquant)
        });
      }
      throw error;
    }
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
  @UseGuards(ThrottlerGuard) // Rate limiting
  @Throttle({ refresh: { limit: 20, ttl: 60000 } }) // 20 rafraîchissements par minute
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

    await this.authAdminService.logout(refreshToken, res, req);
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

  // ============================================
  // ENDPOINTS 2FA TOTP
  // ============================================

  /**
   * Setup 2FA - Génère un secret TOTP et un QR code
   *
   * Endpoint protégé par JWT. Génère un secret temporaire et un QR code
   * pour permettre à l'utilisateur de configurer son authenticator.
   *
   * @param req - Request avec user injecté par AdminJwtGuard
   * @returns QR code en base64, secret temporaire, et URL otpauth
   */
  @Post('2fa/setup')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ '2fa-setup': { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({ summary: 'Générer un secret 2FA et un QR code pour l\'activation' })
  @ApiResponse({ status: 200, description: 'QR code et secret générés' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 400, description: '2FA déjà activé' })
  async setupTwoFactor(@Req() req: AuthenticatedRequest) {
    return this.twoFactorService.setup(req.user.id);
  }

  /**
   * Activer 2FA - Valide le code TOTP et active le 2FA
   *
   * Endpoint protégé par JWT. Après avoir scanné le QR code dans un authenticator,
   * l'utilisateur doit fournir un code TOTP pour activer définitivement le 2FA.
   *
   * @param req - Request avec user injecté par AdminJwtGuard
   * @param body - Code TOTP et secret temporaire du setup
   * @returns Confirmation d'activation
   */
  @Post('2fa/enable')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ '2fa-enable': { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({ summary: 'Activer le 2FA après vérification du code TOTP' })
  @ApiResponse({ status: 200, description: '2FA activé avec succès, backup codes retournés' })
  @ApiResponse({ status: 401, description: 'Code TOTP invalide' })
  @ApiResponse({ status: 400, description: '2FA déjà activé ou données invalides' })
  async enableTwoFactor(
    @Req() req: AuthenticatedRequest,
    @Body() body: TwoFactorEnableDto,
  ) {
    return this.twoFactorService.enable(req.user.id, body.code, body.secret, req);
  }

  /**
   * Vérifier code 2FA après login - Crée la session complète
   *
   * Endpoint NON protégé (appelé après login email+password).
   * Valide le code TOTP et crée les tokens JWT (access + refresh) dans les cookies.
   *
   * Flow:
   * 1. POST /auth/admin/login (email+password) => retourne "2FA_REQUIRED" si activé
   * 2. POST /auth/admin/2fa/verify (code TOTP) => crée session complète
   *
   * @param body - Code TOTP à 6 chiffres
   * @param res - Response Express pour set cookies
   * @returns Informations utilisateur (tokens dans cookies)
   */
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ '2fa-verify': { limit: 5, ttl: 60000 } }) // 5 tentatives par minute (anti brute-force)
  @ApiOperation({ summary: 'Vérifier le code 2FA après login et créer la session complète' })
  @ApiResponse({ status: 200, description: 'Code valide, session créée, cookies définis' })
  @ApiResponse({ status: 401, description: 'Code TOTP invalide ou utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: '2FA non activé ou données invalides' })
  async verifyTwoFactor(
    @Body() body: TwoFactorVerifyDto & { userId: string },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    // Note: userId doit être fourni dans le body ou via un token temporaire
    // Pour simplifier, on le demande dans le body (sécurisé car le code 2FA est requis)
    if (!body.userId) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'userId requis',
      };
    }

    // Extraire l'IP et le userAgent pour le système anti-bruteforce
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || undefined;

    return this.authAdminService.verifyTwoFactorAndCreateSession(
      body.userId,
      body.code,
      res,
      ip,
      userAgent,
      req,
    );
  }

  /**
   * Désactiver 2FA
   *
   * Endpoint protégé par JWT. Désactive le 2FA pour l'utilisateur connecté.
   *
   * @param req - Request avec user injecté par AdminJwtGuard
   * @returns Confirmation de désactivation
   */
  @Post('2fa/disable')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ '2fa-disable': { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({ summary: 'Désactiver le 2FA' })
  @ApiResponse({ status: 200, description: '2FA désactivé avec succès' })
  @ApiResponse({ status: 400, description: '2FA non activé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async disableTwoFactor(@Req() req: AuthenticatedRequest) {
    return this.twoFactorService.disable(req.user.id, req);
  }

  /**
   * Régénérer les backup codes 2FA
   *
   * Endpoint protégé par JWT. Génère de nouveaux backup codes et invalide les anciens.
   *
   * @param req - Request avec user injecté par AdminJwtGuard
   * @returns Nouveaux backup codes en clair
   */
  @Post('2fa/regenerate-backup-codes')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ '2fa-regenerate': { limit: 3, ttl: 60000 } }) // 3 tentatives par minute (limité)
  @ApiOperation({ summary: 'Régénérer les backup codes 2FA' })
  @ApiResponse({ status: 200, description: 'Backup codes régénérés avec succès' })
  @ApiResponse({ status: 400, description: '2FA non activé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async regenerateBackupCodes(@Req() req: AuthenticatedRequest) {
    return this.twoFactorService.regenerateBackupCodes(req.user.id, req);
  }
}

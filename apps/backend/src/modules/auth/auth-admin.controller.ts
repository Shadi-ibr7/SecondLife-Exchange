/**
 * FICHIER: auth-admin.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour l'authentification admin.
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthAdminService } from './auth-admin.service';
import { AdminLoginDto } from './dtos/admin-login.dto';

@ApiTags('Admin Auth')
@Controller('auth/admin')
export class AuthAdminController {
  constructor(private readonly authAdminService: AuthAdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion admin' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.authAdminService.login(loginDto);
  }
}


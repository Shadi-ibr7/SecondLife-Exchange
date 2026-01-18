/**
 * FICHIER: unsplash.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour exposer les endpoints Unsplash.
 * Proxy les requêtes vers l'API Unsplash pour éviter d'exposer la clé API côté client.
 */

import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UnsplashService } from './unsplash.service';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

@ApiTags('Unsplash')
@Controller('unsplash')
@UseGuards(JwtAccessGuard) // Protéger les endpoints Unsplash (authentification requise)
export class UnsplashController {
  constructor(private readonly unsplashService: UnsplashService) {}

  /**
   * GET /unsplash/search
   *
   * Recherche des photos sur Unsplash.
   * Proxy vers l'API Unsplash pour éviter d'exposer la clé API côté client.
   */
  @Get('search')
  @ApiOperation({ summary: 'Rechercher des photos sur Unsplash' })
  @ApiQuery({ name: 'query', description: 'Terme de recherche', required: true })
  @ApiQuery({ name: 'page', description: 'Numéro de page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', description: 'Nombre de résultats par page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Photos trouvées' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async searchPhotos(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    if (!query) {
      throw new Error('Le paramètre "query" est requis');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const perPageNum = perPage ? parseInt(perPage, 10) : 12;

    return this.unsplashService.searchPhotos(query, pageNum, perPageNum);
  }

  /**
   * POST /unsplash/download
   *
   * Déclenche le téléchargement d'une photo (attribution Unsplash).
   * Proxy vers l'API Unsplash pour éviter d'exposer la clé API côté client.
   */
  @Post('download')
  @ApiOperation({ summary: 'Déclencher le téléchargement d\'une photo Unsplash' })
  @ApiResponse({ status: 200, description: 'Téléchargement déclenché' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async triggerDownload(
    @Body('photoId') photoId: string,
    @Body('downloadLocation') downloadLocation: string,
  ) {
    if (!downloadLocation) {
      throw new Error('Le paramètre "downloadLocation" est requis');
    }

    await this.unsplashService.triggerDownload(downloadLocation);
    return { success: true };
  }
}

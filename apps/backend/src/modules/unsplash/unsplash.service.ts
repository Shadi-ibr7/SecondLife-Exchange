/**
 * FICHIER: unsplash.service.ts
 *
 * DESCRIPTION:
 * Service pour interagir avec l'API Unsplash pour récupérer des photos.
 * Utilisé pour générer automatiquement des photos pour les thèmes hebdomadaires.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface UnsplashPhoto {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string | null;
  description: string | null;
  links?: {
    download_location?: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

@Injectable()
export class UnsplashService {
  private readonly logger = new Logger(UnsplashService.name);
  private readonly accessKey: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Essayer d'abord via ConfigService, puis fallback sur process.env
    this.accessKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY') || process.env.UNSPLASH_ACCESS_KEY || '';
    this.apiUrl = this.configService.get<string>('UNSPLASH_API_URL') || process.env.UNSPLASH_API_URL || 'https://api.unsplash.com';

    if (!this.accessKey) {
      this.logger.error('❌ Clé API Unsplash non configurée ! Vérifiez UNSPLASH_ACCESS_KEY dans .env');
    } else {
      this.logger.log(`✅ Clé API Unsplash configurée: ${this.accessKey.substring(0, 10)}...`);
    }
  }

  /**
   * Recherche une photo sur Unsplash basée sur un terme de recherche.
   *
   * @param query - Terme de recherche (ex: "vintage eco friendly", "sustainable living")
   * @returns Photo Unsplash ou null si erreur
   */
  async searchPhoto(query: string): Promise<UnsplashPhoto | null> {
    if (!this.accessKey) {
      this.logger.warn('Clé API Unsplash non configurée, impossible de rechercher des photos');
      return null;
    }

    try {
      const response = await axios.get(`${this.apiUrl}/search/photos`, {
        params: {
          query,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });

      const results = response.data.results;
      if (results && results.length > 0) {
        const photo = results[0];
        this.logger.log(`✅ Photo trouvée pour "${query}": ${photo.id}`);
        return photo;
      }

      this.logger.warn(`Aucune photo trouvée pour "${query}"`);
      return null;
    } catch (error: any) {
      this.logger.error(`Erreur lors de la recherche Unsplash: ${error.message}`);
      return null;
    }
  }

  /**
   * Récupère les informations d'une photo par son ID, puis déclenche le téléchargement.
   *
   * @param photoId - ID de la photo Unsplash
   * @returns Informations de la photo avec download_location
   */
  async getPhotoById(photoId: string): Promise<UnsplashPhoto | null> {
    if (!this.accessKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.apiUrl}/photos/${photoId}`, {
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.warn(`Impossible de récupérer la photo: ${error.message}`);
      return null;
    }
  }

  /**
   * Déclenche le téléchargement d'une photo (requis par Unsplash pour l'attribution).
   *
   * @param downloadLocation - URL de téléchargement fournie par Unsplash
   */
  async triggerDownload(downloadLocation: string): Promise<void> {
    if (!this.accessKey) {
      return;
    }

    try {
      await axios.get(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });
      this.logger.log('✅ Téléchargement déclenché pour attribution Unsplash');
    } catch (error: any) {
      this.logger.warn(`Impossible de déclencher le téléchargement: ${error.message}`);
    }
  }
}


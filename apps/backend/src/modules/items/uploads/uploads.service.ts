import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { createHash } from 'crypto';

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  folder: string;
  public_id?: string;
  allowed_formats: string[];
  max_bytes: number;
  transformation?: string;
}

export interface AttachPhotoDto {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

@Injectable()
export class UploadsService {
  private readonly cloudinaryConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.cloudinaryConfig = this.configService.get('cloudinary');

    // Configuration Cloudinary
    cloudinary.config({
      cloud_name: this.cloudinaryConfig.cloudName,
      api_key: this.cloudinaryConfig.apiKey,
      api_secret: this.cloudinaryConfig.apiSecret,
    });
  }

  /**
   * Génère les paramètres de signature pour l'upload direct côté client
   */
  getSignedUploadParams(
    folder: string,
    maxBytes: number = this.cloudinaryConfig.maxFileSize,
    allowedFormats: string[] = this.cloudinaryConfig.allowedFormats,
  ): SignedUploadParams {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer la signature
    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
      allowed_formats: allowedFormats.join(','),
      max_bytes: maxBytes,
      transformation: 'f_webp,q_auto,w_800,h_600,c_fill',
    };

    const signature = this.createSignature(paramsToSign);

    return {
      signature,
      timestamp,
      folder,
      public_id: publicId,
      allowed_formats: allowedFormats,
      max_bytes: maxBytes,
      transformation: 'f_webp,q_auto,w_800,h_600,c_fill',
    };
  }

  /**
   * Attache une photo à un item après upload réussi
   */
  async attachPhoto(itemId: string, photoData: AttachPhotoDto): Promise<void> {
    // Vérifier que l'item existe
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    // Vérifier le nombre maximum de photos
    const photoCount = await this.prisma.itemPhoto.count({
      where: { itemId },
    });

    if (photoCount >= this.cloudinaryConfig.maxPhotosPerItem) {
      throw new BadRequestException(
        `Nombre maximum de photos atteint (${this.cloudinaryConfig.maxPhotosPerItem})`,
      );
    }

    // Créer l'enregistrement photo
    await this.prisma.itemPhoto.create({
      data: {
        itemId,
        url: photoData.url,
        publicId: photoData.publicId,
        width: photoData.width,
        height: photoData.height,
      },
    });
  }

  /**
   * Supprime une photo d'un item
   */
  async deletePhoto(photoId: string, userId: string): Promise<void> {
    // Vérifier que la photo existe et que l'utilisateur est le propriétaire
    const photo = await this.prisma.itemPhoto.findFirst({
      where: {
        id: photoId,
        item: {
          ownerId: userId,
        },
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo non trouvée ou accès non autorisé');
    }

    // Supprimer de Cloudinary
    try {
      await cloudinary.uploader.destroy(photo.publicId);
    } catch (error) {
      console.warn(
        `Erreur lors de la suppression Cloudinary: ${error.message}`,
      );
    }

    // Supprimer de la base de données
    await this.prisma.itemPhoto.delete({
      where: { id: photoId },
    });
  }

  /**
   * Supprime toutes les photos d'un item (utilisé lors de la suppression d'un item)
   */
  async deleteAllItemPhotos(itemId: string): Promise<void> {
    const photos = await this.prisma.itemPhoto.findMany({
      where: { itemId },
    });

    // Supprimer de Cloudinary
    const deletePromises = photos.map(async (photo) => {
      try {
        await cloudinary.uploader.destroy(photo.publicId);
      } catch (error) {
        console.warn(
          `Erreur suppression photo ${photo.publicId}: ${error.message}`,
        );
      }
    });

    await Promise.all(deletePromises);

    // Supprimer de la base de données
    await this.prisma.itemPhoto.deleteMany({
      where: { itemId },
    });
  }

  /**
   * Crée la signature Cloudinary
   */
  private createSignature(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1')
      .update(sortedParams + this.cloudinaryConfig.apiSecret)
      .digest('hex');
  }

  /**
   * Valide les paramètres d'upload
   */
  validateUploadParams(params: any): void {
    const {
      signature,
      timestamp,
      folder,
      public_id,
      allowed_formats,
      max_bytes,
    } = params;

    if (!signature || !timestamp || !folder || !public_id) {
      throw new BadRequestException("Paramètres d'upload manquants");
    }

    // Vérifier la signature
    const expectedSignature = this.createSignature({
      timestamp,
      folder,
      public_id,
      allowed_formats: allowed_formats.join(','),
      max_bytes,
    });

    if (signature !== expectedSignature) {
      throw new BadRequestException('Signature invalide');
    }

    // Vérifier l'expiration (5 minutes)
    const now = Math.round(new Date().getTime() / 1000);
    if (now - timestamp > 300) {
      throw new BadRequestException('Signature expirée');
    }
  }
}

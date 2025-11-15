/**
 * FICHIER: uploads.service.ts
 *
 * DESCRIPTION:
 * Ce service gère l'upload et la gestion des photos d'items via Cloudinary.
 * Il fournit des signatures sécurisées pour l'upload direct côté client,
 * et gère l'attachement des photos aux items dans la base de données.
 *
 * FONCTIONNALITÉS:
 * - Génération de signatures Cloudinary pour upload sécurisé
 * - Attachement de photos à un item (une ou plusieurs)
 * - Suppression de photos (une ou toutes)
 * - Validation des paramètres d'upload
 * - Limitation du nombre de photos par item
 *
 * SÉCURITÉ:
 * - Signatures cryptographiques pour éviter les abus
 * - Validation de la taille et du format des fichiers
 * - Limitation du nombre de photos par item
 * - Suppression des photos depuis Cloudinary lors de la suppression
 */

// Import des exceptions NestJS
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

// Import des services
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Import de Cloudinary SDK
import { v2 as cloudinary } from 'cloudinary';

// Import de crypto pour générer les signatures
import { createHash } from 'crypto';

/**
 * INTERFACE: SignedUploadParams
 *
 * Paramètres de signature pour l'upload Cloudinary.
 * Utilisés par le frontend pour uploader directement vers Cloudinary.
 */
export interface SignedUploadParams {
  signature: string; // Signature cryptographique
  timestamp: number; // Timestamp Unix
  folder: string; // Dossier de destination
  public_id?: string; // ID public de l'image
  allowed_formats: string[]; // Formats autorisés (jpg, png, webp)
  max_bytes: number; // Taille maximale en octets
  transformation?: string; // Transformations à appliquer (redimensionnement, etc.)
}

/**
 * INTERFACE: AttachPhotoDto
 *
 * Données d'une photo à attacher à un item.
 * Contient les informations retournées par Cloudinary après upload.
 */
export interface AttachPhotoDto {
  url: string; // URL de l'image sur Cloudinary
  publicId: string; // ID public Cloudinary (pour suppression)
  width?: number; // Largeur de l'image (pixels)
  height?: number; // Hauteur de l'image (pixels)
}

/**
 * SERVICE: UploadsService
 *
 * Service pour la gestion des uploads d'images vers Cloudinary.
 */
@Injectable()
export class UploadsService {
  /**
   * Configuration Cloudinary
   *
   * Contient les credentials et paramètres de configuration.
   */
  private readonly cloudinaryConfig;

  /**
   * CONSTRUCTEUR
   *
   * Injection des dépendances et configuration de Cloudinary.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Récupérer la configuration Cloudinary
    this.cloudinaryConfig = this.configService.get('cloudinary');

    // ============================================
    // CONFIGURATION CLOUDINARY
    // ============================================
    /**
     * Configurer le SDK Cloudinary avec les credentials.
     * Ces credentials sont utilisés pour:
     * - Générer les signatures d'upload
     * - Supprimer les images
     */
    cloudinary.config({
      cloud_name: this.cloudinaryConfig.cloudName,
      api_key: this.cloudinaryConfig.apiKey,
      api_secret: this.cloudinaryConfig.apiSecret,
    });
  }

  // ============================================
  // MÉTHODE: getSignedUploadParams
  // ============================================

  /**
   * Génère les paramètres de signature pour l'upload direct côté client.
   *
   * FONCTIONNEMENT:
   * - Génère un timestamp et un public_id unique
   * - Crée une signature cryptographique avec le secret Cloudinary
   * - Retourne les paramètres nécessaires pour l'upload direct
   *
   * SÉCURITÉ:
   * - La signature empêche la modification des paramètres d'upload
   * - Le timestamp permet d'expirer les signatures après un certain temps
   *
   * @param folder - Dossier de destination sur Cloudinary (ex: "items")
   * @param maxBytes - Taille maximale du fichier (défaut: depuis config)
   * @param allowedFormats - Formats autorisés (défaut: depuis config)
   * @returns Paramètres de signature pour l'upload
   */
  getSignedUploadParams(
    folder: string,
    maxBytes: number = this.cloudinaryConfig.maxFileSize,
    allowedFormats: string[] = this.cloudinaryConfig.allowedFormats,
  ): SignedUploadParams {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer la signature Cloudinary uniquement avec les paramètres supportés
    // Ne PAS inclure allowed_formats ou max_bytes dans la signature
    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
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

  // ============================================
  // MÉTHODE: attachPhoto (Attacher une photo)
  // ============================================

  /**
   * Attache une photo à un item après upload réussi sur Cloudinary.
   *
   * VALIDATION:
   * - Vérifie que l'item existe
   * - Vérifie que le nombre maximum de photos n'est pas atteint
   *
   * @param itemId - ID de l'item
   * @param photoData - Données de la photo (URL, publicId, dimensions)
   * @throws NotFoundException si l'item n'existe pas
   * @throws BadRequestException si le nombre maximum de photos est atteint
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

  // ============================================
  // MÉTHODE: attachPhotos (Attacher plusieurs photos)
  // ============================================

  /**
   * Attache plusieurs photos à un item en une transaction atomique.
   *
   * FONCTIONNEMENT:
   * - Vérifie le nombre de photos existantes
   * - Limite le nombre de photos à insérer selon la limite maximale
   * - Insère toutes les photos en une transaction
   *
   * @param itemId - ID de l'item
   * @param photos - Tableau de photos à attacher
   * @throws BadRequestException si aucune photo fournie ou limite atteinte
   * @throws NotFoundException si l'item n'existe pas
   */
  async attachPhotos(itemId: string, photos: AttachPhotoDto[]): Promise<void> {
    if (!Array.isArray(photos) || photos.length === 0) {
      throw new BadRequestException('Aucune photo fournie');
    }

    // Vérifier l'item
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    // Vérifier la limite
    const existing = await this.prisma.itemPhoto.count({ where: { itemId } });
    const remaining = this.cloudinaryConfig.maxPhotosPerItem - existing;
    if (remaining <= 0) {
      throw new BadRequestException(
        `Nombre maximum de photos atteint (${this.cloudinaryConfig.maxPhotosPerItem})`,
      );
    }
    const toInsert = photos.slice(0, remaining);

    await this.prisma.$transaction(
      toInsert.map((p) =>
        this.prisma.itemPhoto.create({
          data: {
            itemId,
            url: p.url,
            publicId: p.publicId,
            width: p.width,
            height: p.height,
          },
        }),
      ),
    );
  }

  // ============================================
  // MÉTHODE: deletePhoto (Supprimer une photo)
  // ============================================

  /**
   * Supprime une photo d'un item.
   *
   * SÉCURITÉ:
   * - Vérifie que la photo existe
   * - Vérifie que l'utilisateur est le propriétaire de l'item
   *
   * PROCESSUS:
   * 1. Supprime l'image depuis Cloudinary
   * 2. Supprime l'enregistrement de la base de données
   *
   * @param photoId - ID de la photo à supprimer
   * @param userId - ID de l'utilisateur (doit être le propriétaire)
   * @throws NotFoundException si la photo n'existe pas ou accès non autorisé
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

  // ============================================
  // MÉTHODE: deleteAllItemPhotos
  // ============================================

  /**
   * Supprime toutes les photos d'un item.
   *
   * UTILISATION:
   * - Appelée lors de la suppression d'un item
   * - Nettoie toutes les photos associées depuis Cloudinary et la base de données
   *
   * @param itemId - ID de l'item
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

  // ============================================
  // MÉTHODE PRIVÉE: createSignature
  // ============================================

  /**
   * Crée une signature cryptographique Cloudinary.
   *
   * ALGORITHME:
   * 1. Trie les paramètres par clé (ordre alphabétique)
   * 2. Formate en chaîne "key1=value1&key2=value2"
   * 3. Ajoute le secret API Cloudinary
   * 4. Hash avec SHA1
   *
   * SÉCURITÉ:
   * - La signature empêche la modification des paramètres d'upload
   * - Seul le serveur connaît le secret pour générer la signature
   *
   * @param params - Paramètres à signer
   * @returns Signature SHA1 en hexadécimal
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

  // ============================================
  // MÉTHODE: validateUploadParams
  // ============================================

  /**
   * Valide les paramètres d'upload Cloudinary.
   *
   * VALIDATION:
   * - Vérifie que tous les paramètres requis sont présents
   * - Vérifie que la signature correspond aux paramètres
   * - Vérifie que la signature n'est pas expirée (5 minutes)
   *
   * @param params - Paramètres d'upload à valider
   * @throws BadRequestException si les paramètres sont invalides ou expirés
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
    // Doit correspondre exactement aux paramètres envoyés à Cloudinary
    const expectedSignature = this.createSignature({
      timestamp,
      folder,
      public_id,
      transformation: 'f_webp,q_auto,w_800,h_600,c_fill',
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

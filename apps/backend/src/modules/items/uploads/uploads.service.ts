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
  ForbiddenException,
} from '@nestjs/common';

// Import des services
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Import de Cloudinary SDK
import { v2 as cloudinary } from 'cloudinary';

// Import de crypto pour générer des identifiants de requête
import { randomUUID } from 'crypto';

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
  resource_type: string; // Type de ressource: 'image' uniquement
  api_key: string; // Clé API Cloudinary (publique, pas le secret)
  cloud_name: string; // Nom du cloud Cloudinary (publique)
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
   * - Validation stricte du folder (doit être autorisé)
   * - Validation de la taille max (5MB max)
   * - Formats autorisés verrouillés (jpg, jpeg, png, webp uniquement)
   *
   * @param folder - Dossier de destination sur Cloudinary (ex: "items/<itemId>", "profiles")
   * @param userId - ID de l'utilisateur authentifié (pour validation ownership)
   * @param maxBytes - Taille maximale du fichier (défaut: depuis config, max 5MB)
   * @param allowedFormats - Formats autorisés (défaut: depuis config, verrouillés)
   * @returns Paramètres de signature pour l'upload
   * @throws BadRequestException si folder invalide ou taille trop grande
   * @throws ForbiddenException si l'utilisateur n'a pas le droit d'uploader dans ce folder
   */
  async getSignedUploadParams(
    folder: string,
    userId?: string,
    maxBytes: number = this.cloudinaryConfig.maxFileSize,
    allowedFormats: string[] = this.cloudinaryConfig.allowedFormats,
  ): Promise<SignedUploadParams> {
    // ============================================
    // VALIDATION STRICTE DU FOLDER
    // ============================================
    /**
     * Patterns autorisés:
     * - items/<itemId> : doit vérifier que l'item appartient à l'user
     * - profiles : dossier public pour les avatars
     * - eco-content : contenu écologique (public)
     */
    const folderParts = folder.split('/');
    const baseFolder = folderParts[0];

    // Whitelist des folders de base autorisés
    const allowedBaseFolders = ['items', 'profiles', 'eco-content'];
    if (!allowedBaseFolders.includes(baseFolder)) {
      throw new BadRequestException(
        `Dossier de base non autorisé. Dossiers autorisés: ${allowedBaseFolders.join(', ')}`,
      );
    }

    // ============================================
    // VALIDATION OWNERSHIP POUR items/<itemId>
    // ============================================
    if (baseFolder === 'items' && folderParts.length === 2) {
      const itemId = folderParts[1];

      if (!userId) {
        throw new BadRequestException(
          'Authentification requise pour uploader dans un dossier items',
        );
      }

      // Vérifier que l'item existe et appartient à l'utilisateur
      const item = await this.prisma.item.findUnique({
        where: { id: itemId },
        select: { ownerId: true },
      });

      if (!item) {
        throw new NotFoundException('Item non trouvé');
      }

      if (item.ownerId !== userId) {
        throw new ForbiddenException(
          'Vous ne pouvez uploader des photos que pour vos propres items',
        );
      }
    }

    // ============================================
    // VALIDATION OWNERSHIP POUR profiles/<userId>
    // ============================================
    if (baseFolder === 'profiles') {
      if (!userId) {
        throw new BadRequestException(
          'Authentification requise pour uploader dans un dossier profiles',
        );
      }

      // Valider le format: profiles/<userId> OU juste 'profiles' (utilisera userId automatiquement)
      if (folderParts.length === 2) {
        const profileUserId = folderParts[1];
        // Vérifier que le userId dans le folder correspond à l'utilisateur authentifié
        if (profileUserId !== userId) {
          throw new ForbiddenException(
            'Vous ne pouvez uploader des photos que pour votre propre profil',
          );
        }
      } else if (folderParts.length === 1) {
        // Si juste 'profiles', on utilise le userId de l'utilisateur authentifié
        folder = `profiles/${userId}`;
      } else {
        throw new BadRequestException(
          "Format de dossier invalide pour profiles. Utilisez 'profiles' ou 'profiles/<userId>'",
        );
      }
    }

    // ============================================
    // VALIDATION DE LA TAILLE MAX (5MB)
    // ============================================
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (maxBytes > maxSizeBytes) {
      throw new BadRequestException(
        `Taille maximale dépassée. Maximum: 5MB (${maxSizeBytes} octets)`,
      );
    }

    // Forcer maxBytes à la valeur config si elle est supérieure
    if (maxBytes > this.cloudinaryConfig.maxFileSize) {
      maxBytes = this.cloudinaryConfig.maxFileSize;
    }

    // ============================================
    // VALIDATION DES FORMATS AUTORISÉS
    // ============================================
    // Formats strictement autorisés (whitelist)
    const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const invalidFormats = allowedFormats.filter(
      (f) => !validFormats.includes(f.toLowerCase()),
    );
    if (invalidFormats.length > 0) {
      throw new BadRequestException(
        `Formats non autorisés: ${invalidFormats.join(', ')}. Formats autorisés: ${validFormats.join(', ')}`,
      );
    }
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Transformations autorisées uniquement (whitelist stricte)
    // Format: f_webp (format WebP), q_auto (qualité automatique),
    // w_800 (largeur max 800px), h_600 (hauteur max 600px), c_fill (remplissage)
    const transformation = 'f_webp,q_auto,w_800,h_600,c_fill';

    // Créer la signature Cloudinary avec TOUS les paramètres qui seront envoyés
    // IMPORTANT:
    // - Seuls les paramètres effectivement envoyés à Cloudinary doivent être signés
    // - La signature DOIT inclure le timestamp
    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
      resource_type: 'image', // LIMITE STRICTE: images uniquement
      transformation,
    };

    // Logging DEBUG (sans secret) pour diagnostiquer les problèmes de signature
    const requestId = randomUUID();
    const sortedParamsString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');

    // NOTE: ne jamais logger le secret Cloudinary
    // Ces logs peuvent être activés temporairement en production pour diagnostiquer
    console.log('[CloudinaryUpload][getSignedUploadParams]', {
      requestId,
      userId,
      folder,
      publicId,
      timestamp,
      paramsToSign,
      stringToSign: sortedParamsString,
    });

    const signature = this.createSignature(paramsToSign);

    // Retourner les paramètres nécessaires pour l'upload
    // api_key et cloud_name sont PUBLIQUES (pas de secret exposé)
    return {
      signature,
      timestamp,
      folder,
      public_id: publicId,
      allowed_formats: allowedFormats, // Validation côté serveur uniquement
      max_bytes: maxBytes, // Validation côté serveur uniquement
      transformation,
      resource_type: 'image', // LIMITE STRICTE: images uniquement
      api_key: this.cloudinaryConfig.apiKey, // Clé API publique (pas le secret)
      cloud_name: this.cloudinaryConfig.cloudName, // Nom du cloud (publique)
    };
  }

  // ============================================
  // MÉTHODE: attachPhoto (Attacher une photo)
  // ============================================

  /**
   * Attache une photo à un item après upload réussi sur Cloudinary.
   *
   * VALIDATION STRICTE:
   * - Vérifie que l'item existe
   * - Vérifie que le nombre maximum de photos n'est pas atteint (5 max)
   * - Valide l'URL Cloudinary (doit provenir de Cloudinary)
   * - Valide que l'URL correspond au folder attendu (items/<itemId>)
   * - Valide le publicId (ne doit pas être vide)
   *
   * @param itemId - ID de l'item
   * @param photoData - Données de la photo (URL, publicId, dimensions)
   * @param userId - ID de l'utilisateur (pour validation ownership)
   * @throws NotFoundException si l'item n'existe pas
   * @throws BadRequestException si validation échoue ou limite atteinte
   * @throws ForbiddenException si l'utilisateur n'est pas propriétaire
   */
  async attachPhoto(
    itemId: string,
    photoData: AttachPhotoDto,
    userId?: string,
  ): Promise<void> {
    // ============================================
    // VALIDATION DES DONNÉES DE LA PHOTO
    // ============================================
    if (!photoData.url || !photoData.publicId) {
      throw new BadRequestException('URL ou publicId manquant');
    }

    // Vérifier que l'item existe
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { ownerId: true },
    });

    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    // Vérifier ownership si userId fourni
    if (userId && item.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez ajouter des photos qu\'aux items qui vous appartiennent',
      );
    }

    // Valider que l'URL Cloudinary correspond au folder attendu
    const expectedFolder = `items/${itemId}`;
    this.validateCloudinaryUrl(photoData.url, expectedFolder);

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
   * - Valide que toutes les URLs correspondent au folder attendu
   *
   * @param itemId - ID de l'item
   * @param photos - Tableau de photos à attacher
   * @param userId - ID de l'utilisateur (pour validation ownership)
   * @throws BadRequestException si aucune photo fournie ou limite atteinte
   * @throws NotFoundException si l'item n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas propriétaire
   */
  async attachPhotos(
    itemId: string,
    photos: AttachPhotoDto[],
    userId?: string,
  ): Promise<void> {
    // ============================================
    // VALIDATION DU TABLEAU DE PHOTOS
    // ============================================
    if (!Array.isArray(photos) || photos.length === 0) {
      throw new BadRequestException('Aucune photo fournie');
    }

    // Limite stricte: maximum 5 photos par batch
    const maxPhotosPerBatch = 5;
    if (photos.length > maxPhotosPerBatch) {
      throw new BadRequestException(
        `Nombre maximum de photos par requête: ${maxPhotosPerBatch}`,
      );
    }

    // Valider chaque photo
    const cloudinaryUrlPattern =
      /^https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\//;
    for (const photo of photos) {
      if (!photo.url || !photo.publicId) {
        throw new BadRequestException('URL ou publicId manquant pour une photo');
      }
      if (!cloudinaryUrlPattern.test(photo.url)) {
        throw new BadRequestException(
          'URL invalide: doit provenir de Cloudinary',
        );
      }
    }

    // Vérifier l'item
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { ownerId: true },
    });
    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    // Vérifier ownership si userId fourni
    if (userId && item.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez ajouter des photos qu\'aux items qui vous appartiennent',
      );
    }

    // Valider que toutes les URLs Cloudinary correspondent au folder attendu
    const expectedFolder = `items/${itemId}`;
    for (const photo of photos) {
      this.validateCloudinaryUrl(photo.url, expectedFolder);
    }

    // Vérifier la limite totale (depuis la config: 5 photos max par item par défaut)
    const maxPhotosPerItem = this.cloudinaryConfig.maxPhotosPerItem;
    const existing = await this.prisma.itemPhoto.count({ where: { itemId } });
    const remaining = maxPhotosPerItem - existing;
    if (remaining <= 0) {
      throw new BadRequestException(
        `Nombre maximum de photos atteint (${maxPhotosPerItem})`,
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
    /**
     * Utiliser l'implémentation officielle Cloudinary pour générer la signature.
     * Cela garantit que la chaîne à signer est construite exactement comme côté Cloudinary
     * (tri des clés, exclusion des valeurs null/undefined, etc.).
     *
     * IMPORTANT:
     * - Ne jamais inclure file, api_key ou cloud_name dans les paramètres signés
     * - La fonction api_sign_request ne prend en compte que les clés présentes
     */
    // Nettoyer les paramètres (supprimer undefined/null/chaînes vides)
    const cleanedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      cleanedParams[key] = value;
    }

    return cloudinary.utils.api_sign_request(
      cleanedParams,
      this.cloudinaryConfig.apiSecret,
    );
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
   * - Vérifie que la signature n'est pas expirée (60 secondes)
   * - Vérifie que resource_type est 'image'
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
      resource_type,
      transformation,
    } = params;

    if (!signature || !timestamp || !folder || !public_id) {
      throw new BadRequestException("Paramètres d'upload manquants");
    }

    // Vérifier que resource_type est 'image' uniquement
    if (resource_type && resource_type !== 'image') {
      throw new BadRequestException(
        `Resource type non autorisé: ${resource_type}. Seul 'image' est autorisé.`,
      );
    }

    // Vérifier la signature
    // Doit correspondre exactement aux paramètres envoyés à Cloudinary
    const transformationValue = transformation || 'f_webp,q_auto,w_800,h_600,c_fill';
    const expectedSignature = this.createSignature({
      timestamp,
      folder,
      public_id,
      resource_type: 'image',
      transformation: transformationValue,
    });

    if (signature !== expectedSignature) {
      throw new BadRequestException('Signature invalide');
    }

    // Vérifier l'expiration (60 secondes) - signature courte pour sécurité renforcée
    const now = Math.round(new Date().getTime() / 1000);
    const expirationSeconds = 60;
    if (now - timestamp > expirationSeconds) {
      throw new BadRequestException(
        `Signature expirée (expire après ${expirationSeconds} secondes)`,
      );
    }
  }

  // ============================================
  // MÉTHODE: validateCloudinaryUrl
  // ============================================

  /**
   * Valide qu'une URL Cloudinary correspond au folder attendu.
   *
   * SÉCURITÉ:
   * - Vérifie que l'URL provient bien de Cloudinary
   * - Vérifie que le public_id correspond au folder attendu
   * - Empêche les uploads dans des dossiers non autorisés
   *
   * @param url - URL Cloudinary de l'image
   * @param expectedFolder - Folder attendu (ex: "items/<itemId>", "profiles/<userId>")
   * @returns true si l'URL correspond au folder attendu
   * @throws BadRequestException si l'URL est invalide ou ne correspond pas
   */
  validateCloudinaryUrl(url: string, expectedFolder: string): boolean {
    // Vérifier que l'URL provient bien de Cloudinary
    const cloudinaryUrlPattern =
      /^https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\//;
    if (!cloudinaryUrlPattern.test(url)) {
      throw new BadRequestException('URL invalide: doit provenir de Cloudinary');
    }

    // Extraire le public_id de l'URL Cloudinary
    // Format: https://res.cloudinary.com/<cloud_name>/image/upload/<transformation>/<public_id>
    const urlParts = url.split('/image/upload/');
    if (urlParts.length < 2) {
      throw new BadRequestException('URL Cloudinary invalide: format incorrect');
    }

    // Le public_id est la dernière partie après les transformations
    const pathAfterUpload = urlParts[1];
    // Retirer les transformations et extensions de fichier
    const publicIdMatch = pathAfterUpload.match(/^[^\/]*\/?([^\.]+)/);
    if (!publicIdMatch) {
      throw new BadRequestException('URL Cloudinary invalide: public_id introuvable');
    }

    const publicId = publicIdMatch[1];
    // Le public_id devrait commencer par le folder attendu
    // Format: <folder>/<timestamp>_<random>
    if (!publicId.startsWith(expectedFolder + '/')) {
      throw new BadRequestException(
        `URL Cloudinary invalide: le public_id '${publicId}' ne correspond pas au folder attendu '${expectedFolder}'`,
      );
    }

    return true;
  }
}

/**
 * FICHIER: cloudinary.config.ts
 *
 * DESCRIPTION:
 * Ce fichier définit la configuration pour l'intégration avec Cloudinary (gestion d'images).
 * Cloudinary est utilisé pour stocker et optimiser les photos des items.
 *
 * FONCTIONNALITÉS:
 * - Upload sécurisé d'images avec signature
 * - Transformation automatique (redimensionnement, compression, format WebP)
 * - Limitation de la taille et du nombre de photos
 *
 * SÉCURITÉ:
 * - Les credentials doivent être stockés dans les variables d'environnement
 * - Les uploads sont signés pour éviter les abus
 * - Limitation de la taille et du format des fichiers
 */

// Import de registerAs
import { registerAs } from '@nestjs/config';

/**
 * CONFIGURATION: cloudinary
 *
 * Configuration pour l'intégration avec Cloudinary.
 */
export default registerAs('cloudinary', () => ({
  /**
   * Nom du cloud Cloudinary.
   * Trouvé dans le dashboard Cloudinary.
   */
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,

  /**
   * Clé API Cloudinary.
   * Utilisée pour authentifier les requêtes API.
   */
  apiKey: process.env.CLOUDINARY_API_KEY,

  /**
   * Secret API Cloudinary.
   * Utilisé pour signer les uploads (sécurité).
   * Ne JAMAIS exposer publiquement!
   */
  apiSecret: process.env.CLOUDINARY_API_SECRET,

  /**
   * Preset d'upload Cloudinary.
   * Définit les transformations automatiques à appliquer.
   * Défaut: 'ml_default'
   */
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',

  /**
   * Taille maximale d'un fichier (en octets).
   * Défaut: 3 MB (3000000 octets)
   *
   * Pour éviter les uploads trop volumineux qui ralentiraient l'application.
   */
  maxFileSize: parseInt(process.env.CLOUDINARY_MAX_FILE_SIZE || '3000000'), // 3MB

  /**
   * Formats d'image autorisés.
   * Seuls ces formats peuvent être uploadés.
   * WebP est recommandé pour de meilleures performances.
   */
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],

  /**
   * Nombre maximum de photos par item.
   * Défaut: 6 photos
   *
   * Limite le nombre de photos pour éviter les abus et limiter les coûts de stockage.
   */
  maxPhotosPerItem: parseInt(process.env.CLOUDINARY_MAX_PHOTOS_PER_ITEM || '6'),
}));

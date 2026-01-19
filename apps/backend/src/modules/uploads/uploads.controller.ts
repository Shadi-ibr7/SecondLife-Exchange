/**
 * FICHIER: uploads.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur dédié pour la gestion des uploads Cloudinary sécurisés.
 * Fournit un endpoint sécurisé pour générer des signatures d'upload signées.
 *
 * ROUTES:
 * - POST /api/v1/uploads/cloudinary/sign - Générer une signature Cloudinary sécurisée (authentifié)
 *
 * SÉCURITÉ:
 * - Toutes les routes nécessitent une authentification JWT
 * - Validation stricte du folder avec vérification d'ownership
 * - Empêche les uploads non autorisés et les uploads au nom d'un autre user
 */

// Import des décorateurs NestJS
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';

// Import des décorateurs Swagger pour la documentation API
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Import des décorateurs de validation
import { IsString, IsOptional } from 'class-validator';

// Import des services
import {
  UploadsService,
  SignedUploadParams,
} from '../items/uploads/uploads.service';

// Import des guards
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

/**
 * DTO pour la requête de signature
 */
class SignUploadDto {
  @IsString()
  folder: string;

  @IsOptional()
  @IsString()
  publicId?: string;
}

/**
 * CONTRÔLEUR: UploadsController
 *
 * Contrôleur pour la gestion des uploads Cloudinary sécurisés.
 */
@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service d'uploads
   */
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /api/v1/uploads/cloudinary/sign
   *
   * Génère une signature Cloudinary sécurisée pour un upload direct côté client.
   *
   * FONCTIONNEMENT:
   * 1. Le frontend demande une signature avec le dossier cible (ex: "items/<itemId>")
   * 2. Le backend valide que l'utilisateur authentifié a le droit d'uploader dans ce dossier
   * 3. Le backend génère une signature signée avec CLOUDINARY_API_SECRET (jamais exposé)
   * 4. Le frontend utilise cette signature pour uploader directement vers Cloudinary
   *
   * SÉCURITÉ:
   * - Authentification JWT requise (guard JwtAccessGuard)
   * - Validation du folder: doit respecter les patterns autorisés
   * - Pour items/<itemId>: vérifie que l'item appartient à l'utilisateur
   * - Pour profiles: accepte si l'utilisateur est authentifié
   * - Rate limiting: 20 requêtes par minute
   * - Signature HMAC SHA-1 avec timestamp (expire après 5 minutes)
   *
   * @param req - Requête HTTP avec user.id (injecté par JwtAccessGuard)
   * @param body - Body contenant folder (requis) et publicId (optionnel)
   * @returns SignedUploadParams avec signature, timestamp, folder, etc.
   */
  @Post('cloudinary/sign')
  @UseGuards(JwtAccessGuard, ThrottlerGuard)
  @Throttle({ upload: { limit: 20, ttl: 60000 } }) // 20 uploads par minute
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Générer une signature Cloudinary sécurisée pour upload direct',
    description:
      'Génère une signature signée avec HMAC SHA-1 pour autoriser un upload direct vers Cloudinary. ' +
      'Le folder doit respecter les patterns autorisés (items/<itemId> ou profiles). ' +
      "Pour items/<itemId>, vérifie que l'item appartient à l'utilisateur authentifié.",
  })
  @ApiResponse({
    status: 200,
    description: 'Signature générée avec succès',
    schema: {
      type: 'object',
      properties: {
        signature: { type: 'string', description: 'Signature HMAC SHA-1' },
        timestamp: { type: 'number', description: 'Timestamp Unix' },
        folder: { type: 'string', description: 'Dossier Cloudinary' },
        public_id: { type: 'string', description: 'ID public Cloudinary' },
        allowed_formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Formats autorisés (jpg, png, webp)',
        },
        max_bytes: {
          type: 'number',
          description: 'Taille maximale en octets (5MB max)',
        },
        transformation: {
          type: 'string',
          description: 'Transformations Cloudinary à appliquer',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Folder invalide ou taille trop grande',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: "Accès non autorisé (item n'appartient pas à l'utilisateur)",
  })
  @ApiResponse({ status: 404, description: 'Item non trouvé' })
  async signUpload(
    @Request() req: any,
    @Body() body: SignUploadDto,
  ): Promise<SignedUploadParams> {
    const { folder } = body;

    if (!folder) {
      throw new Error('Le paramètre folder est requis');
    }

    // Utiliser le service avec validation userId pour empêcher les uploads non autorisés
    // Signature expire après 60 secondes (sécurité renforcée)
    return this.uploadsService.getSignedUploadParams(folder, req.user.id);
  }
}

/**
 * FICHIER: list-items.query.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour les paramètres de requête de la liste d'items.
 * Il contient tous les filtres et options de pagination disponibles.
 *
 * FILTRES DISPONIBLES:
 * - page: Numéro de page (défaut: 1)
 * - limit: Nombre d'éléments par page (défaut: 20, max: 50)
 * - q: Recherche textuelle (titre, description, tags)
 * - category: Filtrer par catégorie
 * - condition: Filtrer par état
 * - status: Filtrer par statut (AVAILABLE, PENDING, TRADED, ARCHIVED)
 * - ownerId: Filtrer par propriétaire
 * - sort: Tri (ex: -createdAt pour plus récent en premier)
 *
 * NOTE:
 * Tous les paramètres sont optionnels pour permettre une recherche flexible.
 */

// Import des décorateurs de validation
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

// Import des décorateurs Swagger
import { ApiPropertyOptional } from '@nestjs/swagger';

// Import de class-transformer pour la conversion de types
import { Type } from 'class-transformer';

// Import des types Prisma
import { ItemCategory, ItemCondition, ItemStatus } from '@prisma/client';

/**
 * DTO: ListItemsQueryDto
 *
 * Classe pour valider les paramètres de requête de la liste d'items.
 */
export class ListItemsQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de page',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    minimum: 1,
    maximum: 50,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Mot-clé pour la recherche full-text sur titre et description',
    example: 'vintage',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par catégorie',
    enum: ItemCategory,
    example: ItemCategory.VINTAGE,
  })
  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @ApiPropertyOptional({
    description: 'Filtrer par état',
    enum: ItemCondition,
    example: ItemCondition.GOOD,
  })
  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: ItemStatus,
    example: ItemStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiPropertyOptional({
    description: 'Filtrer par propriétaire (ID utilisateur)',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    description:
      'Tri des résultats (ex: -createdAt pour plus récent en premier, distance pour proximité)',
    example: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string = '-createdAt';

  // ============================================
  // PARAMÈTRES DE GÉOLOCALISATION
  // ============================================

  /**
   * Latitude de l'utilisateur pour le calcul de distance.
   * Si fournie avec lng, permet le tri par proximité et le filtrage par rayon.
   */
  @ApiPropertyOptional({
    description: 'Latitude de l\'utilisateur (pour tri par distance)',
    minimum: -90,
    maximum: 90,
    example: 48.8566,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  /**
   * Longitude de l'utilisateur pour le calcul de distance.
   * Si fournie avec lat, permet le tri par proximité et le filtrage par rayon.
   */
  @ApiPropertyOptional({
    description: 'Longitude de l\'utilisateur (pour tri par distance)',
    minimum: -180,
    maximum: 180,
    example: 2.3522,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  /**
   * Rayon de recherche en kilomètres.
   * Filtre les items situés à moins de X km de la position de l'utilisateur.
   * Nécessite lat et lng pour fonctionner.
   */
  @ApiPropertyOptional({
    description: 'Rayon de recherche en kilomètres (défaut: 25)',
    minimum: 1,
    maximum: 500,
    default: 25,
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  radiusKm?: number = 25;

  /**
   * Filtrer par ville (nom exact).
   * Utile pour rechercher dans une ville spécifique sans coordonnées GPS.
   */
  @ApiPropertyOptional({
    description: 'Filtrer par ville (nom exact)',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  city?: string;

  /**
   * Filtrer par département.
   */
  @ApiPropertyOptional({
    description: 'Filtrer par département',
    example: '75',
  })
  @IsOptional()
  @IsString()
  department?: string;

  /**
   * Filtrer par région.
   */
  @ApiPropertyOptional({
    description: 'Filtrer par région',
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  region?: string;
}

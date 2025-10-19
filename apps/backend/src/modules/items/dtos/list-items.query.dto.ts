import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ItemCategory, ItemCondition, ItemStatus } from '@prisma/client';

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
      'Tri des résultats (ex: -createdAt pour plus récent en premier)',
    example: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string = '-createdAt';
}

import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemCategory, ItemCondition } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({
    description: "Titre de l'objet",
    minLength: 3,
    maxLength: 120,
    example: 'iPhone 12 Pro Max',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    description: "Description détaillée de l'objet",
    minLength: 10,
    maxLength: 2000,
    example:
      "iPhone 12 Pro Max en excellent état, 128GB, couleur bleu pacifique. Quelques micro-rayures sur l'écran mais fonctionne parfaitement.",
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    description: "Catégorie de l'objet (optionnel si aiAuto=true)",
    enum: ItemCategory,
    example: ItemCategory.ELECTRONICS,
  })
  @IsOptional()
  @ValidateIf((o) => o.category !== undefined)
  @IsEnum(ItemCategory, {
    message:
      'Catégorie invalide. Catégories valides: ELECTRONICS, CLOTHING, BOOKS, FURNITURE, SPORTS, TOYS, OTHER',
  })
  category?: ItemCategory;

  @ApiProperty({
    description: "État de l'objet",
    enum: ItemCondition,
    example: ItemCondition.GOOD,
  })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @ApiPropertyOptional({
    description: 'Tags pour faciliter la recherche',
    type: [String],
    maxItems: 10,
    example: ['smartphone', 'apple', '5g', 'caméra'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  tags?: string[];

  @ApiPropertyOptional({
    description:
      "Activer l'analyse automatique par IA pour catégorisation et tags",
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  aiAuto?: boolean;
}

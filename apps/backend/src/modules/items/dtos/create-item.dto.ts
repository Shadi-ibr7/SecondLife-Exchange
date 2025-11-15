/**
 * FICHIER: create-item.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour la création d'un item (objet à échanger).
 * Il contient les règles de validation pour les données d'un nouvel item.
 *
 * VALIDATION:
 * - title: Titre de l'objet (3-120 caractères, obligatoire)
 * - description: Description détaillée (10-2000 caractères, obligatoire)
 * - category: Catégorie de l'objet (optionnel si aiAuto=true)
 * - condition: État de l'objet (obligatoire: NEW, GOOD, FAIR, TO_REPAIR)
 * - tags: Tags pour faciliter la recherche (1-10 tags, optionnel)
 * - aiAuto: Activer l'analyse IA automatique (optionnel, défaut: false)
 *
 * FONCTIONNALITÉS:
 * - Si aiAuto=true, l'IA analyse automatiquement le titre et la description
 *   pour suggérer la catégorie et les tags
 */

// Import des décorateurs de validation
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

// Import des décorateurs Swagger
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import des types Prisma
import { ItemCategory, ItemCondition } from '@prisma/client';

/**
 * DTO: CreateItemDto
 *
 * Classe pour valider les données de création d'un item.
 */
export class CreateItemDto {
  /**
   * PROPRIÉTÉ: title
   *
   * Titre de l'objet à échanger.
   *
   * @IsString(): Doit être une chaîne
   * @MinLength(3): Minimum 3 caractères
   * @MaxLength(120): Maximum 120 caractères
   */
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

  /**
   * PROPRIÉTÉ: description
   *
   * Description détaillée de l'objet.
   * Doit contenir suffisamment d'informations pour permettre une analyse IA.
   *
   * @IsString(): Doit être une chaîne
   * @MinLength(10): Minimum 10 caractères
   * @MaxLength(2000): Maximum 2000 caractères
   */
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

  /**
   * PROPRIÉTÉ: category
   *
   * Catégorie de l'objet.
   * Optionnel si aiAuto=true (l'IA suggérera la catégorie).
   *
   * @IsOptional(): Optionnel
   * @ValidateIf(): Valide seulement si défini
   * @IsEnum(): Doit être une valeur de l'enum ItemCategory
   */
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

  /**
   * PROPRIÉTÉ: condition
   *
   * État de l'objet.
   *
   * @IsEnum(): Doit être une valeur de l'enum ItemCondition
   * Valeurs possibles: NEW, GOOD, FAIR, TO_REPAIR
   */
  @ApiProperty({
    description: "État de l'objet",
    enum: ItemCondition,
    example: ItemCondition.GOOD,
  })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  /**
   * PROPRIÉTÉ: tags
   *
   * Tags pour faciliter la recherche.
   * Optionnel, mais si fourni, doit contenir entre 1 et 10 tags.
   *
   * @IsOptional(): Optionnel
   * @IsArray(): Doit être un tableau
   * @IsString({ each: true }): Chaque élément doit être une chaîne
   * @ArrayMinSize(1): Minimum 1 tag si le tableau est fourni
   * @ArrayMaxSize(10): Maximum 10 tags
   */
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

  /**
   * PROPRIÉTÉ: aiAuto
   *
   * Activer l'analyse automatique par IA.
   * Si true, l'IA analysera le titre et la description pour:
   * - Suggérer automatiquement la catégorie
   * - Générer des tags pertinents
   * - Créer un résumé
   * - Proposer des conseils de réparation
   *
   * @IsOptional(): Optionnel (défaut: false)
   * @IsBoolean(): Doit être un booléen
   */
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

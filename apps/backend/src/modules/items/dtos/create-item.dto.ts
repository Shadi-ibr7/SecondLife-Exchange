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
  IsNumber,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateIf,
  Min,
  Max,
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

  // ============================================
  // CHAMPS DE LOCALISATION (Style Leboncoin)
  // ============================================

  /**
   * PROPRIÉTÉ: city
   *
   * Nom de la ville où se situe l'objet.
   * Sélectionné via l'autocomplétion des villes.
   *
   * @IsOptional(): Optionnel (l'utilisateur peut choisir de ne pas préciser)
   * @IsString(): Doit être une chaîne
   * @MinLength(1): Au moins 1 caractère
   * @MaxLength(100): Maximum 100 caractères
   */
  @ApiPropertyOptional({
    description: 'Nom de la ville (sélectionné via autocomplétion)',
    minLength: 1,
    maxLength: 100,
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Le nom de la ville ne peut pas être vide' })
  @MaxLength(100, { message: 'Le nom de la ville ne peut pas dépasser 100 caractères' })
  city?: string;

  /**
   * PROPRIÉTÉ: postalCode
   *
   * Code postal de la ville.
   * Format français: 5 chiffres (ex: 75001, 69001).
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne
   * @MinLength(4): Minimum 4 caractères (DOM-TOM peuvent avoir 4 chiffres)
   * @MaxLength(10): Maximum 10 caractères (pour compatibilité internationale)
   */
  @ApiPropertyOptional({
    description: 'Code postal',
    minLength: 4,
    maxLength: 10,
    example: '75001',
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Le code postal doit contenir au moins 4 caractères' })
  @MaxLength(10, { message: 'Le code postal ne peut pas dépasser 10 caractères' })
  postalCode?: string;

  /**
   * PROPRIÉTÉ: department
   *
   * Numéro du département français.
   * Format: 2 à 3 caractères (ex: 75, 2A, 974).
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne
   * @MinLength(1): Minimum 1 caractère
   * @MaxLength(3): Maximum 3 caractères
   */
  @ApiPropertyOptional({
    description: 'Numéro du département',
    minLength: 1,
    maxLength: 3,
    example: '75',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Le département doit contenir au moins 1 caractère' })
  @MaxLength(3, { message: 'Le département ne peut pas dépasser 3 caractères' })
  department?: string;

  /**
   * PROPRIÉTÉ: region
   *
   * Nom de la région française.
   * Ex: Île-de-France, Auvergne-Rhône-Alpes, etc.
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne
   * @MaxLength(50): Maximum 50 caractères
   */
  @ApiPropertyOptional({
    description: 'Nom de la région',
    maxLength: 50,
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'La région ne peut pas dépasser 50 caractères' })
  region?: string;

  /**
   * PROPRIÉTÉ: latitude
   *
   * Latitude GPS du lieu (WGS84).
   * Plage valide: -90 à 90 (pôle Sud à pôle Nord).
   *
   * @IsOptional(): Optionnel
   * @IsNumber(): Doit être un nombre
   * @Min(-90): Minimum -90 (pôle Sud)
   * @Max(90): Maximum 90 (pôle Nord)
   */
  @ApiPropertyOptional({
    description: 'Latitude GPS (WGS84)',
    minimum: -90,
    maximum: 90,
    example: 48.8566,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La latitude doit être un nombre' })
  @Min(-90, { message: 'La latitude doit être comprise entre -90 et 90' })
  @Max(90, { message: 'La latitude doit être comprise entre -90 et 90' })
  latitude?: number;

  /**
   * PROPRIÉTÉ: longitude
   *
   * Longitude GPS du lieu (WGS84).
   * Plage valide: -180 à 180 (ligne de changement de date).
   *
   * @IsOptional(): Optionnel
   * @IsNumber(): Doit être un nombre
   * @Min(-180): Minimum -180
   * @Max(180): Maximum 180
   */
  @ApiPropertyOptional({
    description: 'Longitude GPS (WGS84)',
    minimum: -180,
    maximum: 180,
    example: 2.3522,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitude doit être un nombre' })
  @Min(-180, { message: 'La longitude doit être comprise entre -180 et 180' })
  @Max(180, { message: 'La longitude doit être comprise entre -180 et 180' })
  longitude?: number;
}

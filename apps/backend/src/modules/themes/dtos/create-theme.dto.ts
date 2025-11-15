/**
 * FICHIER: create-theme.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour la création d'un thème hebdomadaire.
 * Il contient les règles de validation pour les données d'un nouveau thème.
 *
 * VALIDATION:
 * - title: Titre du thème (3-100 caractères)
 * - slug: Identifiant unique URL-friendly (3-50 caractères)
 * - startOfWeek: Date de début de la semaine (format ISO)
 * - impactText: Texte sur l'impact écologique (max 500 caractères, optionnel)
 * - isActive: Activer ce thème immédiatement (optionnel, défaut: false)
 */

// Import des décorateurs de validation
import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

// Import des décorateurs Swagger
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO: CreateThemeDto
 *
 * Classe pour valider les données de création d'un thème.
 */
export class CreateThemeDto {
  /**
   * PROPRIÉTÉ: title
   *
   * Titre du thème hebdomadaire.
   *
   * @IsString(): Doit être une chaîne
   * @MinLength(3): Minimum 3 caractères
   * @MaxLength(100): Maximum 100 caractères
   */
  @ApiProperty({
    description: 'Titre du thème hebdomadaire',
    minLength: 3,
    maxLength: 100,
    example: 'Objets vintage des années 80',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  /**
   * PROPRIÉTÉ: slug
   *
   * Identifiant unique URL-friendly pour le thème.
   * Utilisé dans les URLs (ex: /themes/vintage-annees-80)
   *
   * @IsString(): Doit être une chaîne
   * @MinLength(3): Minimum 3 caractères
   * @MaxLength(50): Maximum 50 caractères
   *
   * NOTE: Le slug doit être unique dans la base de données
   */
  @ApiProperty({
    description: 'Slug unique pour le thème',
    minLength: 3,
    maxLength: 50,
    example: 'vintage-annees-80',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  slug: string;

  /**
   * PROPRIÉTÉ: startOfWeek
   *
   * Date de début de la semaine (lundi 00:00:00).
   * Format ISO 8601 (ex: "2025-10-20T00:00:00.000Z")
   *
   * @IsDateString(): Doit être une date valide au format ISO
   */
  @ApiProperty({
    description: 'Date de début de la semaine (lundi 00:00:00)',
    example: '2025-10-20T00:00:00.000Z',
  })
  @IsDateString()
  startOfWeek: string;

  /**
   * PROPRIÉTÉ: impactText
   *
   * Texte expliquant l'impact écologique du thème.
   * Optionnel, maximum 500 caractères.
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne
   * @MaxLength(500): Maximum 500 caractères
   */
  @ApiPropertyOptional({
    description: "Texte sur l'impact écologique du thème",
    maxLength: 500,
    example:
      'Les objets vintage des années 80 permettent de réduire la production de nouveaux biens et valorisent le patrimoine culturel.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  impactText?: string;

  /**
   * PROPRIÉTÉ: isActive
   *
   * Activer ce thème immédiatement lors de la création.
   * Si true, désactive automatiquement tous les autres thèmes.
   *
   * @IsOptional(): Optionnel (défaut: false)
   * @IsBoolean(): Doit être un booléen
   */
  @ApiPropertyOptional({
    description: 'Activer ce thème immédiatement',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

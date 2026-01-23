/**
 * FICHIER: dtos/search-cities.dto.ts
 *
 * DESCRIPTION:
 * DTO pour la recherche de villes via l'API d'autocomplétion.
 * Valide le paramètre de recherche (q) avec des contraintes de longueur.
 */

import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO: SearchCitiesDto
 *
 * Paramètres de requête pour la recherche de villes.
 */
export class SearchCitiesDto {
  /**
   * Terme de recherche pour l'autocomplétion
   * - Minimum 2 caractères (évite les requêtes trop générales)
   * - Maximum 100 caractères (limite raisonnable)
   */
  @ApiProperty({
    description: 'Terme de recherche pour l\'autocomplétion des villes',
    minLength: 2,
    maxLength: 100,
    example: 'Paris',
  })
  @IsString()
  @MinLength(2, { message: 'Le terme de recherche doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le terme de recherche ne peut pas dépasser 100 caractères' })
  q: string;

  /**
   * Nombre maximum de résultats à retourner
   * - Défaut: 10
   * - Maximum: 20
   */
  @ApiPropertyOptional({
    description: 'Nombre maximum de résultats',
    minimum: 1,
    maximum: 20,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}

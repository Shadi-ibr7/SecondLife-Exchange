/**
 * DTOs spécifiques à la gestion des thèmes via l'espace admin.
 */

import { IsArray, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class GenerateThemeSuggestionsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  locales?: string[];
}


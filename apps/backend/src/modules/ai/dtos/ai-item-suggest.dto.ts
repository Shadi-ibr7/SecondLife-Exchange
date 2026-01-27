/**
 * FICHIER: ai-item-suggest.dto.ts
 *
 * DESCRIPTION:
 * DTO pour l'endpoint POST /api/v1/ai/items/suggest
 * Valide les entrées pour la suggestion IA de catégorie, tags et résumé.
 */

import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';

/**
 * Schéma Zod pour validation côté serveur
 */
export const AiItemSuggestSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(120, 'Le titre ne peut pas dépasser 120 caractères'),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères'),
  imageUrls: z
    .array(z.string().url('URL invalide'))
    .max(5, 'Maximum 5 images')
    .optional(),
});

export type AiItemSuggestInput = z.infer<typeof AiItemSuggestSchema>;

/**
 * DTO class-validator pour NestJS
 */
export class AiItemSuggestDto {
  @IsString()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  @MaxLength(120, { message: 'Le titre ne peut pas dépasser 120 caractères' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @MinLength(10, {
    message: 'La description doit contenir au moins 10 caractères',
  })
  @MaxLength(5000, {
    message: 'La description ne peut pas dépasser 5000 caractères',
  })
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 images' })
  @IsUrl({}, { each: true, message: 'URL invalide' })
  imageUrls?: string[];
}

/**
 * Interface de réponse pour la suggestion IA
 */
export interface AiItemSuggestResponse {
  category: string;
  tags: string[];
  summary: string;
}

/**
 * Interface pour les infos de quota
 */
export interface QuotaInfo {
  used: number;
  max: number;
  remaining: number;
  resetAt: string; // ISO date
}

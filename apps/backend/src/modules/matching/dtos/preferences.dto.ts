import {
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const SavePreferencesSchema = z.object({
  preferredCategories: z.array(z.string()).default([]),
  dislikedCategories: z.array(z.string()).default([]),
  preferredConditions: z.array(z.string()).default([]),
  locale: z.string().optional(),
  country: z.string().optional(),
  radiusKm: z.number().int().min(1).max(1000).optional(),
});

export type SavePreferencesInput = z.infer<typeof SavePreferencesSchema>;

// DTO pour class-validator
export class SavePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedCategories?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredConditions?: string[] = [];

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  radiusKm?: number;
}

// Types de réponse
export interface PreferencesResponse {
  preferences: {
    userId: string;
    preferredCategories: string[];
    dislikedCategories: string[];
    preferredConditions: string[];
    locale?: string;
    country?: string;
    radiusKm?: number;
  };
}

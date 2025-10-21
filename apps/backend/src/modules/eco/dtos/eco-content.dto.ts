import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsUrl,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';

// Types pour les types de contenu
export enum EcoContentKind {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  STAT = 'STAT',
}

// Schéma Zod pour la validation
export const CreateEcoContentSchema = z.object({
  kind: z.enum(['ARTICLE', 'VIDEO', 'STAT']),
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  url: z.string().url('URL invalide'),
  locale: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
});

export const UpdateEcoContentSchema = CreateEcoContentSchema.partial();

export const ListEcoContentSchema = z.object({
  kind: z.enum(['ARTICLE', 'VIDEO', 'STAT']).optional(),
  tag: z.string().optional(),
  locale: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateEcoContentInput = z.infer<typeof CreateEcoContentSchema>;
export type UpdateEcoContentInput = z.infer<typeof UpdateEcoContentSchema>;
export type ListEcoContentInput = z.infer<typeof ListEcoContentSchema>;

// DTOs pour class-validator
export class CreateEcoContentDto {
  @IsEnum(EcoContentKind)
  kind: EcoContentKind;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le titre est requis' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title: string;

  @IsUrl({}, { message: 'URL invalide' })
  url: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export class UpdateEcoContentDto {
  @IsOptional()
  @IsEnum(EcoContentKind)
  kind?: EcoContentKind;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Le titre est requis' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL invalide' })
  url?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export class ListEcoContentDto {
  @IsOptional()
  @IsEnum(EcoContentKind)
  kind?: EcoContentKind;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}

// Types de réponse
export interface EcoContentResponse {
  id: string;
  kind: string;
  title: string;
  url: string;
  locale?: string;
  tags: string[];
  source?: string;
  summary?: string;
  kpis?: any;
  publishedAt?: string;
  createdAt: string;
}

export interface PaginatedEcoContentResponse {
  items: EcoContentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrichEcoContentResponse {
  summary: string;
  tags: string[];
  kpis?: any;
}

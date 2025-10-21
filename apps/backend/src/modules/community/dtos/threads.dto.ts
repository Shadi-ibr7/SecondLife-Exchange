import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';

// Types pour les scopes
export enum ThreadScope {
  THEME = 'THEME',
  CATEGORY = 'CATEGORY',
  ITEM = 'ITEM',
  GENERAL = 'GENERAL',
}

// Schémas Zod pour la validation
export const CreateThreadSchema = z.object({
  scope: z.enum(['THEME', 'CATEGORY', 'ITEM', 'GENERAL']),
  scopeRef: z.string().optional(),
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  contentFirst: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
});

export const ListThreadsSchema = z.object({
  scope: z.enum(['THEME', 'CATEGORY', 'ITEM', 'GENERAL']).optional(),
  ref: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type ListThreadsInput = z.infer<typeof ListThreadsSchema>;

// DTOs pour class-validator
export class CreateThreadDto {
  @IsEnum(ThreadScope)
  scope: ThreadScope;

  @IsOptional()
  @IsString()
  scopeRef?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le titre est requis' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le contenu est requis' })
  @MaxLength(5000, {
    message: 'Le contenu ne peut pas dépasser 5000 caractères',
  })
  contentFirst: string;
}

export class ListThreadsDto {
  @IsOptional()
  @IsEnum(ThreadScope)
  scope?: ThreadScope;

  @IsOptional()
  @IsString()
  ref?: string;

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
export interface ThreadResponse {
  id: string;
  scope: string;
  scopeRef?: string;
  title: string;
  authorId: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  postsCount: number;
  lastPostAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedThreadsResponse {
  items: ThreadResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


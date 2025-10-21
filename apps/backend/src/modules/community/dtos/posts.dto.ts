import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';

// Schémas Zod pour la validation
export const CreatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
  repliesTo: z.string().optional(),
});

export const UpdatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
});

export const ListPostsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type ListPostsInput = z.infer<typeof ListPostsSchema>;

// DTOs pour class-validator
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le contenu est requis' })
  @MaxLength(5000, {
    message: 'Le contenu ne peut pas dépasser 5000 caractères',
  })
  content: string;

  @IsOptional()
  @IsString()
  repliesTo?: string;
}

export class UpdatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le contenu est requis' })
  @MaxLength(5000, {
    message: 'Le contenu ne peut pas dépasser 5000 caractères',
  })
  content: string;
}

export class ListPostsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}

// Types de réponse
export interface PostResponse {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  repliesTo?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  repliesCount: number;
  isEdited: boolean;
}

export interface PaginatedPostsResponse {
  items: PostResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


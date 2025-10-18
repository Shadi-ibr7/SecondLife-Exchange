import { IsOptional, IsString, IsObject, MaxLength } from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  preferencesJson: z.record(z.any()).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// DTO pour class-validator
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  @IsOptional()
  @IsObject()
  preferencesJson?: Record<string, any> | null;
}

import { IsString, IsNotEmpty } from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const TogglePostLikeSchema = z.object({
  postId: z.string().min(1, 'Le postId est requis'),
});

export type TogglePostLikeInput = z.infer<typeof TogglePostLikeSchema>;

// DTO pour class-validator
export class TogglePostLikeDto {
  @IsString()
  @IsNotEmpty()
  postId: string;
}

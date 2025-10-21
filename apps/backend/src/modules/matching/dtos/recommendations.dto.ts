import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';

// Schéma Zod pour la validation
export const RecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RecommendationsQueryInput = z.infer<
  typeof RecommendationsQuerySchema
>;

// DTO pour class-validator
export class RecommendationsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

// Types de réponse
export interface RecommendationReason {
  type:
    | 'category'
    | 'condition'
    | 'tags'
    | 'popularity'
    | 'rarity'
    | 'location'
    | 'history';
  score: number;
  description: string;
}

export interface Recommendation {
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    tags: string[];
    popularityScore: number;
    owner: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
    photos: Array<{
      id: string;
      url: string;
      width?: number;
      height?: number;
    }>;
    createdAt: string;
  };
  score: number;
  reasons: RecommendationReason[];
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  userPreferences?: {
    preferredCategories: string[];
    preferredConditions: string[];
    country?: string;
  };
}

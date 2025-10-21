import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const CreateExchangeSchema = z.object({
  responderId: z.string().cuid('ID du répondant invalide'),
  requestedItemTitle: z
    .string()
    .min(2, "Le titre de l'objet demandé doit contenir au moins 2 caractères")
    .max(100),
  offeredItemTitle: z
    .string()
    .min(2, "Le titre de l'objet proposé doit contenir au moins 2 caractères")
    .max(100),
  message: z.string().max(500).optional(),
  ownerId: z.string().uuid().optional(),
});

export type CreateExchangeInput = z.infer<typeof CreateExchangeSchema>;

// DTO pour class-validator
export class CreateExchangeDto {
  @IsString()
  @IsNotEmpty()
  responderId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: "Le titre de l'objet demandé doit contenir au moins 2 caractères",
  })
  @MaxLength(100, {
    message: "Le titre de l'objet demandé ne peut pas dépasser 100 caractères",
  })
  requestedItemTitle: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: "Le titre de l'objet proposé doit contenir au moins 2 caractères",
  })
  @MaxLength(100, {
    message: "Le titre de l'objet proposé ne peut pas dépasser 100 caractères",
  })
  offeredItemTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Le message ne peut pas dépasser 500 caractères',
  })
  message?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

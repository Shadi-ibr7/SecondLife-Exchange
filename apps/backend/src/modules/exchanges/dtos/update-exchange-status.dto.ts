import { IsEnum } from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const UpdateExchangeStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED']),
});

export type UpdateExchangeStatusInput = z.infer<
  typeof UpdateExchangeStatusSchema
>;

// DTO pour class-validator
export class UpdateExchangeStatusDto {
  @IsEnum(['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED'], {
    message:
      'Le statut doit être PENDING, ACCEPTED, DECLINED, COMPLETED ou CANCELLED',
  })
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
}

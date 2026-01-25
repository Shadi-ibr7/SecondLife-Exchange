/**
 * FICHIER: reset-password.dto.ts
 *
 * DESCRIPTION:
 * DTO pour la réinitialisation effective du mot de passe.
 * Valide le token et le nouveau mot de passe avec règles strictes.
 *
 * RÈGLES MOT DE PASSE:
 * - Minimum 12 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 minuscule
 * - Au moins 1 chiffre
 * - Au moins 1 symbole (@$!%*?&)
 */

import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { z } from 'zod';

/**
 * Regex pour validation du mot de passe
 * - (?=.*[a-z]) : au moins une minuscule
 * - (?=.*[A-Z]) : au moins une majuscule
 * - (?=.*\d) : au moins un chiffre
 * - (?=.*[@$!%*?&]) : au moins un symbole
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

const PASSWORD_ERROR_MESSAGE =
  'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole (@$!%*?&)';

/**
 * Schéma Zod pour validation côté client/serveur
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  newPassword: z
    .string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * DTO class-validator pour NestJS
 */
export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Le token est requis' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @IsString()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caractères',
  })
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_ERROR_MESSAGE,
  })
  newPassword: string;
}

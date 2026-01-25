/**
 * FICHIER: forgot-password.dto.ts
 *
 * DESCRIPTION:
 * DTO pour la demande de réinitialisation de mot de passe.
 * Valide l'email fourni par l'utilisateur.
 */

import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';

/**
 * Schéma Zod pour validation côté client/serveur
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Adresse email invalide')
    .transform((val) => val.toLowerCase().trim()),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * DTO class-validator pour NestJS
 */
export class ForgotPasswordDto {
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

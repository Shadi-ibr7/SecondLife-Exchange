import { IsEmail, IsString } from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const AuthLoginSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;

// DTO pour class-validator
export class AuthLoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  password: string;
}

import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { z } from 'zod';

// Schéma Zod pour la validation
export const AuthRegisterSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    ),
  displayName: z
    .string()
    .min(2, "Le nom d'affichage doit contenir au moins 2 caractères")
    .max(50),
});

export type AuthRegisterInput = z.infer<typeof AuthRegisterSchema>;

// DTO pour class-validator
export class AuthRegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(10, {
    message: 'Le mot de passe doit contenir au moins 10 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  password: string;

  @IsString()
  @MinLength(2, {
    message: "Le nom d'affichage doit contenir au moins 2 caractères",
  })
  displayName: string;
}

/**
 * FICHIER: auth-login.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour la connexion (login) d'un utilisateur.
 * Les règles de validation sont plus simples que pour l'inscription car
 * on ne vérifie que le format de l'email et la présence du mot de passe.
 *
 * VALIDATION:
 * - Email: doit être un email valide, converti en minuscules
 * - Password: doit être présent (pas de règles de complexité car c'est un mot de passe existant)
 *
 * NOTE:
 * On ne valide pas la complexité du mot de passe car c'est un mot de passe existant.
 * La vérification réelle du mot de passe se fait dans AuthService avec bcrypt.
 */

// Import des décorateurs de validation
import { IsEmail, IsString } from 'class-validator';

// Import de Zod
import { z } from 'zod';

// ============================================
// SCHÉMA ZOD POUR LA VALIDATION
// ============================================
/**
 * Schéma Zod pour valider les données de connexion.
 */
export const AuthLoginSchema = z.object({
  // Email: doit être valide, converti en minuscules
  email: z.string().email('Email invalide').toLowerCase(),

  // Password: doit être présent (minimum 1 caractère)
  // On ne vérifie pas la complexité car c'est un mot de passe existant
  password: z.string().min(1, 'Le mot de passe est requis'),
});

/**
 * TYPE: AuthLoginInput
 *
 * Type TypeScript inféré depuis le schéma Zod.
 */
export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;

// ============================================
// DTO POUR CLASS-VALIDATOR
// ============================================
/**
 * Classe DTO pour la validation dans les contrôleurs NestJS.
 */
export class AuthLoginDto {
  /**
   * PROPRIÉTÉ: email
   *
   * @IsEmail(): Vérifie que c'est un email valide
   */
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  /**
   * PROPRIÉTÉ: password
   *
   * @IsString(): Doit être une chaîne de caractères
   *
   * NOTE: On ne vérifie pas la longueur minimale ou la complexité
   * car c'est un mot de passe existant. La vérification réelle
   * se fait dans AuthService avec bcrypt.compare().
   */
  @IsString()
  password: string;
}

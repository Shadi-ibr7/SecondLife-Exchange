/**
 * FICHIER: auth-register.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO (Data Transfer Object) pour l'inscription d'un utilisateur.
 * Il contient à la fois un schéma Zod et une classe avec des décorateurs class-validator
 * pour valider les données d'inscription.
 *
 * VALIDATION:
 * - Email: doit être un email valide, converti en minuscules
 * - Password: minimum 10 caractères, doit contenir majuscule, minuscule, chiffre, caractère spécial
 * - DisplayName: entre 2 et 50 caractères
 *
 * SÉCURITÉ:
 * Les règles de mot de passe strictes protègent contre les mots de passe faibles.
 */

// Import des décorateurs de validation de class-validator
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

// Import de Zod pour la validation alternative
import { z } from 'zod';

// ============================================
// SCHÉMA ZOD POUR LA VALIDATION
// ============================================
/**
 * Schéma Zod pour valider les données d'inscription.
 * Zod est une bibliothèque de validation moderne et flexible.
 *
 * AVANTAGES:
 * - Validation côté client et serveur avec le même schéma
 * - Messages d'erreur personnalisés
 * - Transformation automatique (email en minuscules)
 */
export const AuthRegisterSchema = z.object({
  // Email: doit être un email valide, converti automatiquement en minuscules
  email: z.string().email('Email invalide').toLowerCase(),

  // Password: règles de sécurité strictes
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    // Regex pour vérifier: majuscule, minuscule, chiffre, caractère spécial
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    ),

  // DisplayName: nom d'affichage de l'utilisateur
  displayName: z
    .string()
    .min(2, "Le nom d'affichage doit contenir au moins 2 caractères")
    .max(50), // Maximum 50 caractères
});

/**
 * TYPE: AuthRegisterInput
 *
 * Type TypeScript inféré depuis le schéma Zod.
 * Utilisé pour typer les paramètres dans les fonctions.
 */
export type AuthRegisterInput = z.infer<typeof AuthRegisterSchema>;

// ============================================
// DTO POUR CLASS-VALIDATOR
// ============================================
/**
 * Classe DTO utilisée avec class-validator pour la validation automatique
 * dans les contrôleurs NestJS.
 *
 * Les décorateurs sont appliqués par ValidationPipe (configuré dans main.ts).
 * Si la validation échoue, une erreur 400 (Bad Request) est retournée automatiquement.
 */
export class AuthRegisterDto {
  /**
   * PROPRIÉTÉ: email
   *
   * @IsEmail(): Vérifie que c'est un email valide
   * Message d'erreur personnalisé si la validation échoue
   */
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  /**
   * PROPRIÉTÉ: password
   *
   * @IsString(): Doit être une chaîne de caractères
   * @MinLength(10): Minimum 10 caractères
   * @Matches(): Doit correspondre à la regex (majuscule, minuscule, chiffre, caractère spécial)
   *
   * REGEX EXPLIQUÉE:
   * - (?=.*[a-z]): Au moins une minuscule
   * - (?=.*[A-Z]): Au moins une majuscule
   * - (?=.*\d): Au moins un chiffre
   * - (?=.*[@$!%*?&]): Au moins un caractère spécial
   * - [A-Za-z\d@$!%*?&]: Caractères autorisés
   */
  @IsString()
  @MinLength(10, {
    message: 'Le mot de passe doit contenir au moins 10 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  password: string;

  /**
   * PROPRIÉTÉ: displayName
   *
   * @IsString(): Doit être une chaîne
   * @MinLength(2): Minimum 2 caractères
   * @Matches(/^.{2,50}$/): Entre 2 et 50 caractères
   */
  @IsString()
  @MinLength(2, {
    message: "Le nom d'affichage doit contenir au moins 2 caractères",
  })
  @Matches(/^.{2,50}$/, {
    message: "Le nom d'affichage doit contenir entre 2 et 50 caractères",
  })
  displayName: string;
}

/**
 * FICHIER: update-profile.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour la mise à jour du profil utilisateur.
 * Tous les champs sont optionnels pour permettre une mise à jour partielle.
 *
 * CHAMPS:
 * - displayName: Nom d'affichage (2-50 caractères)
 * - avatarUrl: URL de l'avatar (peut être null pour supprimer)
 * - bio: Biographie de l'utilisateur (max 500 caractères)
 * - location: Localisation (max 100 caractères)
 * - preferencesJson: Préférences utilisateur en format JSON (objet libre)
 */

// Import des décorateurs de validation
import { IsOptional, IsString, IsObject, MaxLength } from 'class-validator';

// Import de Zod
import { z } from 'zod';

// ============================================
// SCHÉMA ZOD POUR LA VALIDATION
// ============================================
/**
 * Schéma Zod pour valider les données de mise à jour du profil.
 * Tous les champs sont optionnels pour permettre une mise à jour partielle.
 */
export const UpdateProfileSchema = z.object({
  // Nom d'affichage: entre 2 et 50 caractères
  displayName: z.string().min(2).max(50).optional(),

  // URL de l'avatar: doit être une URL valide, peut être null
  avatarUrl: z.string().url().optional().nullable(),

  // Biographie: maximum 500 caractères, peut être null
  bio: z.string().max(500).optional().nullable(),

  // Localisation: maximum 100 caractères, peut être null
  location: z.string().max(100).optional().nullable(),

  // Préférences: objet JSON libre (peut contenir n'importe quelles clés/valeurs)
  preferencesJson: z.record(z.any()).optional().nullable(),
});

/**
 * TYPE: UpdateProfileInput
 *
 * Type TypeScript inféré depuis le schéma Zod.
 */
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ============================================
// DTO POUR CLASS-VALIDATOR
// ============================================
/**
 * Classe DTO pour la validation dans les contrôleurs NestJS.
 * Tous les champs sont optionnels pour permettre une mise à jour partielle.
 */
export class UpdateProfileDto {
  /**
   * PROPRIÉTÉ: displayName
   *
   * Nom d'affichage de l'utilisateur.
   *
   * @IsOptional(): Optionnel (peut être omis)
   * @IsString(): Doit être une chaîne
   * @MaxLength(50): Maximum 50 caractères
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  /**
   * PROPRIÉTÉ: avatarUrl
   *
   * URL de l'avatar (photo de profil).
   * Peut être null pour supprimer l'avatar.
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne (ou null)
   */
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  /**
   * PROPRIÉTÉ: bio
   *
   * Biographie de l'utilisateur.
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne
   * @MaxLength(500): Maximum 500 caractères
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  /**
   * PROPRIÉTÉ: location
   *
   * Localisation de l'utilisateur (ville, pays, etc.).
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne
   * @MaxLength(100): Maximum 100 caractères
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  /**
   * PROPRIÉTÉ: preferencesJson
   *
   * Préférences utilisateur en format JSON.
   * Peut contenir n'importe quelles clés/valeurs (objet libre).
   *
   * Exemple: { theme: 'dark', notifications: true, language: 'fr' }
   *
   * @IsOptional(): Optionnel
   * @IsObject(): Doit être un objet
   */
  @IsOptional()
  @IsObject()
  preferencesJson?: Record<string, any> | null;
}

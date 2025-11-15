/**
 * FICHIER: pagination.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO (Data Transfer Object) pour la pagination.
 * La pagination permet de diviser les résultats en pages pour améliorer
 * les performances et l'expérience utilisateur.
 *
 * PARAMÈTRES:
 * - page: Numéro de la page (commence à 1)
 * - limit: Nombre d'éléments par page (max 100)
 * - sort: Critère de tri (optionnel)
 *
 * UTILISATION:
 * - Utilisé dans les query parameters des routes GET
 * - Exemple: GET /api/v1/items?page=2&limit=10&sort=createdAt:desc
 */

// Import des décorateurs de validation de class-validator
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

// Import du décorateur de transformation de class-transformer
import { Transform } from 'class-transformer';

// Import de Zod pour la validation côté schéma
import { z } from 'zod';

/**
 * DTO: PaginationDto
 *
 * Classe utilisée pour valider les paramètres de pagination dans les requêtes.
 * Utilise class-validator pour la validation automatique.
 */
export class PaginationDto {
  /**
   * PROPRIÉTÉ: page
   *
   * Numéro de la page à récupérer (commence à 1).
   *
   * @IsOptional(): Le paramètre est optionnel (valeur par défaut si absent)
   * @Transform(): Convertit la valeur string en number (car les query params sont toujours des strings)
   * @IsInt(): Vérifie que c'est un nombre entier
   * @Min(1): La page doit être au moins 1 (pas de page 0 ou négative)
   */
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1; // Valeur par défaut: page 1

  /**
   * PROPRIÉTÉ: limit
   *
   * Nombre d'éléments à retourner par page.
   *
   * @IsOptional(): Optionnel
   * @Transform(): Convertit string en number
   * @IsInt(): Doit être un entier
   * @Min(1): Au moins 1 élément
   * @Max(100): Maximum 100 éléments (pour éviter de surcharger le serveur)
   */
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20; // Valeur par défaut: 20 éléments par page

  /**
   * PROPRIÉTÉ: sort
   *
   * Critère de tri (optionnel).
   * Format attendu: "field:direction" (ex: "createdAt:desc", "name:asc")
   *
   * @IsOptional(): Optionnel
   * @IsString(): Doit être une chaîne de caractères
   */
  @IsOptional()
  @IsString()
  sort?: string;
}

// ============================================
// SCHÉMA ZOD CORRESPONDANT
// ============================================
/**
 * Schéma Zod pour la validation alternative (utilisé dans certains cas).
 * Zod est une bibliothèque de validation plus moderne et flexible.
 *
 * z.coerce.number(): Convertit automatiquement les strings en numbers
 * .int(): Doit être un entier
 * .min(1): Minimum 1
 * .max(100): Maximum 100
 * .default(1): Valeur par défaut si absent
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(), // Optionnel, pas de valeur par défaut
});

/**
 * TYPE: PaginationInput
 *
 * Type TypeScript inféré depuis le schéma Zod.
 * Utilisé pour typer les paramètres de pagination dans les fonctions.
 */
export type PaginationInput = z.infer<typeof PaginationSchema>;

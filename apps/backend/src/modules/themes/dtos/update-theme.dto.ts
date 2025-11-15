/**
 * FICHIER: update-theme.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour la mise à jour d'un thème hebdomadaire.
 * Il étend CreateThemeDto avec PartialType, ce qui rend tous les champs optionnels.
 *
 * UTILISATION:
 * - Permet une mise à jour partielle (seuls les champs fournis sont mis à jour)
 * - Permet d'activer/désactiver un thème
 * - Permet de modifier le contenu d'un thème
 *
 * NOTE:
 * PartialType() de @nestjs/swagger rend automatiquement tous les champs optionnels.
 */

// Import de PartialType pour rendre tous les champs optionnels
import { PartialType } from '@nestjs/swagger';

// Import du DTO de création
import { CreateThemeDto } from './create-theme.dto';

/**
 * DTO: UpdateThemeDto
 *
 * Classe pour valider les données de mise à jour d'un thème.
 * Tous les champs sont optionnels grâce à PartialType().
 */
export class UpdateThemeDto extends PartialType(CreateThemeDto) {
  // Tous les champs de CreateThemeDto sont optionnels pour la mise à jour
  // Permet d'activer/désactiver un thème ou de modifier son contenu
}

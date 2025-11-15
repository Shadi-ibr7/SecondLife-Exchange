/**
 * FICHIER: update-item.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier définit le DTO pour la mise à jour d'un item.
 * Il étend CreateItemDto avec PartialType, ce qui rend tous les champs optionnels.
 *
 * UTILISATION:
 * - Permet une mise à jour partielle (seuls les champs fournis sont mis à jour)
 * - Le propriétaire peut modifier tous les champs sauf l'ID et les timestamps
 * - Inclut aiAuto pour permettre la re-analyse IA si les données changent
 *
 * NOTE:
 * PartialType() de @nestjs/swagger rend automatiquement tous les champs optionnels.
 */

// Import de PartialType
import { PartialType } from '@nestjs/swagger';

// Import du DTO de création
import { CreateItemDto } from './create-item.dto';

/**
 * DTO: UpdateItemDto
 *
 * Classe pour valider les données de mise à jour d'un item.
 * Tous les champs sont optionnels grâce à PartialType().
 */
export class UpdateItemDto extends PartialType(CreateItemDto) {
  // Tous les champs de CreateItemDto sont optionnels pour la mise à jour
  // Le propriétaire peut modifier tous les champs sauf l'ID et les timestamps
  // Inclut aiAuto pour permettre la re-analyse IA
}

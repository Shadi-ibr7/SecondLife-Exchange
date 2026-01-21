/**
 * FICHIER: report.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour la gestion des signalements.
 */

import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveReportDto {
  @ApiPropertyOptional({
    description: 'Bannir l\'utilisateur signalé',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  banUser?: boolean;

  @ApiPropertyOptional({
    description: 'Supprimer l\'item signalé (si type = ITEM)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  deleteItem?: boolean;

  @ApiPropertyOptional({
    description: 'Archiver le signalement sans action',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  archive?: boolean;
}


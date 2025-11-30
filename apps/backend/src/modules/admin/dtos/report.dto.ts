/**
 * FICHIER: report.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour la gestion des signalements.
 */

import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  banUser?: boolean;
}


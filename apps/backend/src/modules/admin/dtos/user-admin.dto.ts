/**
 * FICHIER: user-admin.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour la gestion des utilisateurs par l'admin.
 */

import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  roles?: string;
}


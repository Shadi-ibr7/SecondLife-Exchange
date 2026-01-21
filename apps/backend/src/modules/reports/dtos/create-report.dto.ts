/**
 * FICHIER: create-report.dto.ts
 *
 * DESCRIPTION:
 * DTO pour créer un signalement depuis le frontend.
 */

import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SPAM_ADVERTISEMENT = 'SPAM_ADVERTISEMENT',
  ILLEGAL_CONTENT = 'ILLEGAL_CONTENT',
  HARASSMENT = 'HARASSMENT',
  FALSE_INFORMATION = 'FALSE_INFORMATION',
  OTHER = 'OTHER',
}

export class CreateReportDto {
  @ApiProperty({
    description: 'Type de signalement (ITEM ou USER)',
    enum: ['ITEM', 'USER'],
    example: 'ITEM',
  })
  @IsString()
  @IsNotEmpty()
  type: 'ITEM' | 'USER';

  @ApiProperty({
    description: 'Raison du signalement',
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE_CONTENT,
  })
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @ApiPropertyOptional({
    description: 'Message supplémentaire (obligatoire si reason = OTHER)',
    maxLength: 500,
    example: 'Description détaillée du problème',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'item signalé (si type = ITEM)',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  targetItemId?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur signalé (si type = USER)',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  targetUserId?: string;
}

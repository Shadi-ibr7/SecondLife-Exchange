/**
 * FICHIER: two-factor.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour les endpoints 2FA TOTP.
 */

import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour activer le 2FA (POST /auth/admin/2fa/enable)
 */
export class TwoFactorEnableDto {
  @ApiProperty({
    example: '123456',
    description: 'Code TOTP à 6 chiffres pour vérifier le setup',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir exactement 6 chiffres' })
  code: string;

  @ApiProperty({
    example: 'JBSWY3DPEHPK3PXP',
    description: 'Secret temporaire retourné par /2fa/setup (base32)',
  })
  @IsString()
  secret: string;
}

/**
 * DTO pour vérifier un code 2FA (POST /auth/admin/2fa/verify)
 */
export class TwoFactorVerifyDto {
  @ApiProperty({
    example: '123456',
    description: 'Code TOTP à 6 chiffres',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir exactement 6 chiffres' })
  code: string;

  @ApiProperty({
    example: 'clx1234567890abcdef',
    description: 'ID de l\'utilisateur (obtenu depuis le login précédent)',
  })
  @IsString()
  userId: string;
}

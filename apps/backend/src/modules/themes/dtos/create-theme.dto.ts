import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThemeDto {
  @ApiProperty({
    description: 'Titre du thème hebdomadaire',
    minLength: 3,
    maxLength: 100,
    example: 'Objets vintage des années 80',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Slug unique pour le thème',
    minLength: 3,
    maxLength: 50,
    example: 'vintage-annees-80',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  slug: string;

  @ApiProperty({
    description: 'Date de début de la semaine (lundi 00:00:00)',
    example: '2025-10-20T00:00:00.000Z',
  })
  @IsDateString()
  startOfWeek: string;

  @ApiPropertyOptional({
    description: "Texte sur l'impact écologique du thème",
    maxLength: 500,
    example:
      'Les objets vintage des années 80 permettent de réduire la production de nouveaux biens et valorisent le patrimoine culturel.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  impactText?: string;

  @ApiPropertyOptional({
    description: 'Activer ce thème immédiatement',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

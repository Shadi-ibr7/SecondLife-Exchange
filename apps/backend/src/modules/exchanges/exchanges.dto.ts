import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeStatus } from '@prisma/client';

export class CreateExchangeDto {
  @ApiProperty({ example: 'item-id-123' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 'Je suis intéressé par cet objet, que proposez-vous en échange ?' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateExchangeDto {
  @ApiProperty({ enum: ExchangeStatus, example: ExchangeStatus.ACCEPTED })
  @IsEnum(ExchangeStatus)
  status: ExchangeStatus;

  @ApiProperty({ example: 'J\'accepte votre proposition d\'échange', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'Bonjour, je suis intéressé par votre objet !' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

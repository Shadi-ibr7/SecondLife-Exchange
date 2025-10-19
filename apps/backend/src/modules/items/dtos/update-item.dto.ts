import { PartialType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  // Tous les champs de CreateItemDto sont optionnels pour la mise à jour
  // Le propriétaire peut modifier tous les champs sauf l'ID et les timestamps
  // Inclut aiAuto pour permettre la re-analyse IA
}

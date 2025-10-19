import { PartialType } from '@nestjs/swagger';
import { CreateThemeDto } from './create-theme.dto';

export class UpdateThemeDto extends PartialType(CreateThemeDto) {
  // Tous les champs de CreateThemeDto sont optionnels pour la mise à jour
  // Permet d'activer/désactiver un thème ou de modifier son contenu
}

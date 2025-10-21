import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  RegisterTokenDto,
  SendTestNotificationDto,
  NotificationTokenResponse,
  SendNotificationResponse,
} from './dtos/notifications.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@ApiTags('Notifications')
@Controller('notifications')
@UseInterceptors(LoggingInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enregistrer un token de notification',
    description:
      "Enregistre un token de notification pour l'utilisateur connecté",
  })
  @ApiResponse({
    status: 201,
    description: 'Token enregistré avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async registerToken(
    @Request() req: any,
    @Body() registerTokenDto: RegisterTokenDto,
  ): Promise<NotificationTokenResponse> {
    return this.notificationsService.registerToken(
      req.user.id,
      registerTokenDto,
    );
  }

  @Post('test')
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoyer une notification de test',
    description:
      "Envoie une notification de test à l'utilisateur connecté ou spécifié (admin uniquement)",
  })
  @ApiResponse({
    status: 200,
    description: 'Notification de test envoyée',
  })
  @ApiResponse({
    status: 400,
    description: "Erreur lors de l'envoi",
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (admin requis)',
  })
  @ApiResponse({
    status: 404,
    description: 'Aucun token de notification trouvé',
  })
  async sendTestNotification(
    @Request() req: any,
    @Body() sendTestNotificationDto: SendTestNotificationDto,
  ): Promise<SendNotificationResponse> {
    return this.notificationsService.sendTestNotification(
      req.user.id,
      sendTestNotificationDto,
    );
  }
}


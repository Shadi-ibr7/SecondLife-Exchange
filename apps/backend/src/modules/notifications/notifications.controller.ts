/**
 * FICHIER: notifications.controller.ts
 *
 * DESCRIPTION:
 * Ce contrôleur expose les endpoints HTTP pour la gestion des notifications push.
 * Toutes les routes nécessitent une authentification JWT.
 *
 * ROUTES:
 * - POST /api/v1/notifications/register - Enregistrer un token de notification (authentifié)
 * - POST /api/v1/notifications/test - Envoyer une notification de test (admin uniquement)
 *
 * SÉCURITÉ:
 * - Routes protégées par JwtAccessGuard
 * - Route de test nécessite AdminGuard
 */

// Import des décorateurs NestJS
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

// Import des décorateurs Swagger
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Import du service
import { NotificationsService } from './notifications.service';

// Import des DTOs
import {
  RegisterTokenDto,
  SendTestNotificationDto,
  NotificationTokenResponse,
  SendNotificationResponse,
} from './dtos/notifications.dto';

// Import des guards et intercepteurs
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * CONTRÔLEUR: NotificationsController
 *
 * Contrôleur pour la gestion des notifications push.
 * Le préfixe 'notifications' signifie que les routes commencent par /api/v1/notifications
 */
@ApiTags('Notifications')
@Controller('notifications')
@UseInterceptors(LoggingInterceptor) // Logger toutes les requêtes
export class NotificationsController {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service de notifications
   */
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

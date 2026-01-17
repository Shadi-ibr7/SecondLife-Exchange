/**
 * FICHIER: notifications.controller.ts
 *
 * DESCRIPTION:
 * Contrôleur pour les notifications In-App et Push Web.
 *
 * ROUTES:
 * In-App:
 * - GET  /api/v1/notifications           - Liste des notifications
 * - GET  /api/v1/notifications/unread-count - Nombre de non lues
 * - PATCH /api/v1/notifications/:id/read  - Marquer comme lue
 * - PATCH /api/v1/notifications/read-all  - Tout marquer comme lu
 *
 * Push:
 * - POST /api/v1/notifications/push/subscribe   - S'abonner aux push
 * - POST /api/v1/notifications/push/unsubscribe - Se désabonner
 *
 * Legacy:
 * - POST /api/v1/notifications/register - Enregistrer un token (legacy)
 * - POST /api/v1/notifications/test     - Envoyer une notification de test (admin)
 *
 * SÉCURITÉ:
 * - Toutes les routes requièrent une authentification JWT
 * - Les données sont filtrées par userId venant du token (jamais via body)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import {
  RegisterTokenDto,
  SendTestNotificationDto,
  NotificationTokenResponse,
  SendNotificationResponse,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
  NotificationResponse,
  ListNotificationsQueryDto,
  WebPushSubscribeDto,
  WebPushUnsubscribeDto,
} from './dtos/notifications.dto';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@ApiTags('Notifications')
@Controller('notifications')
@UseInterceptors(LoggingInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============================================
  // IN-APP NOTIFICATIONS
  // ============================================

  @Get()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Liste des notifications',
    description:
      "Récupère la liste paginée des notifications de l'utilisateur connecté",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite (défaut: 20, max: 100)',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Non lues uniquement',
  })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async listNotifications(
    @Request() req: any,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResponse> {
    return this.notificationsService.listNotifications(req.user.id, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
    });
  }

  @Get('unread-count')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Nombre de notifications non lues',
    description: 'Récupère le nombre de notifications non lues',
  })
  @ApiResponse({
    status: 200,
    description: 'Compteur de notifications non lues',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getUnreadCount(@Request() req: any): Promise<UnreadCountResponse> {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer comme lue',
    description: 'Marque une notification comme lue',
  })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  async markAsRead(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tout marquer comme lu',
    description: 'Marque toutes les notifications comme lues',
  })
  @ApiResponse({
    status: 200,
    description: 'Toutes les notifications marquées comme lues',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async markAllAsRead(@Request() req: any): Promise<{ count: number }> {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  // ============================================
  // PUSH WEB SUBSCRIPTIONS
  // ============================================

  @Post('push/subscribe')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "S'abonner aux push notifications",
    description: "Enregistre une subscription WebPush pour l'utilisateur",
  })
  @ApiResponse({ status: 201, description: 'Subscription enregistrée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async subscribeWebPush(
    @Request() req: any,
    @Body() subscribeDto: WebPushSubscribeDto,
  ): Promise<NotificationTokenResponse> {
    return this.notificationsService.subscribeWebPush(
      req.user.id,
      subscribeDto,
    );
  }

  @Post('push/unsubscribe')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Se désabonner des push notifications',
    description: 'Supprime une subscription WebPush',
  })
  @ApiResponse({ status: 200, description: 'Subscription supprimée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async unsubscribeWebPush(
    @Request() req: any,
    @Body() unsubscribeDto: WebPushUnsubscribeDto,
  ): Promise<{ success: boolean }> {
    return this.notificationsService.unsubscribeWebPush(
      req.user.id,
      unsubscribeDto.endpoint,
    );
  }

  // ============================================
  // LEGACY ROUTES (pour compatibilité)
  // ============================================

  @Post('register')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enregistrer un token de notification (legacy)',
    description:
      'Enregistre un token FCM ou simple. Utiliser /push/subscribe pour WebPush.',
  })
  @ApiResponse({ status: 201, description: 'Token enregistré' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
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
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoyer une notification de test (admin)',
    description:
      "Envoie une notification de test à l'utilisateur connecté ou spécifié",
  })
  @ApiResponse({ status: 200, description: 'Notification de test envoyée' })
  @ApiResponse({ status: 400, description: "Erreur lors de l'envoi" })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (admin requis)',
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

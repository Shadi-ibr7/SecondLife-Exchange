/**
 * FICHIER: notifications.service.ts
 *
 * DESCRIPTION:
 * Service de gestion des notifications In-App et Push Web.
 *
 * FONCTIONNALITÉS:
 * - Notifications In-App : CRUD dans la base de données
 * - Push Web : envoi via Web Push API avec VAPID
 * - Tokens : gestion des tokens FCM et WebPush
 * - Triggers : méthodes pour déclencher les notifications depuis les services métier
 *
 * ARCHITECTURE:
 * - Les notifications in-app sont stockées en DB (table notifications)
 * - Les push sont envoyés en best-effort (échec non bloquant)
 * - Les triggers sont non bloquants pour les opérations principales
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  RegisterTokenInput,
  SendTestNotificationInput,
  NotificationTokenResponse,
  SendNotificationResponse,
  NotificationResponse,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
  CreateNotificationPayload,
  PushNotificationPayload,
  WebPushSubscribeDto,
} from './dtos/notifications.dto';

// Import de web-push pour les notifications push
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeVapid();
  }

  // ============================================
  // INITIALISATION VAPID
  // ============================================

  private initializeVapid() {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject =
      this.configService.get<string>('VAPID_SUBJECT') ||
      'mailto:contact@secondlife-exchange.com';

    if (vapidPublicKey && vapidPrivateKey) {
      try {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        this.vapidConfigured = true;
        this.logger.log('VAPID configuré avec succès');
      } catch (error: any) {
        this.logger.error(`Erreur configuration VAPID: ${error.message}`);
      }
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquant - Push notifications désactivées',
      );
    }
  }

  // ============================================
  // NOTIFICATIONS IN-APP : CRUD
  // ============================================

  /**
   * Crée une notification in-app pour un utilisateur.
   * Cette méthode est NON BLOQUANTE : les erreurs sont loggées mais ne sont pas propagées.
   */
  async createNotification(
    payload: CreateNotificationPayload,
    sendPush = true,
  ): Promise<NotificationResponse | null> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data || null,
        },
      });

      this.logger.log(
        `Notification créée pour user ${payload.userId} - type: ${payload.type}`,
      );

      // Envoyer push automatiquement si demandé (sauf si déjà géré par notifyNewMessage, etc.)
      if (sendPush) {
        // Envoi push non bloquant (best effort)
        this.sendPushToUser(payload.userId, {
          title: payload.title,
          body: payload.body,
          tag: payload.data?.type || payload.type.toLowerCase(),
          data: payload.data || {},
        }).catch((err) => {
          // Erreur silencieuse pour ne pas impacter la création de la notification
          this.logger.debug(`Push notification échoué (non bloquant): ${err.message}`);
        });
      }

      return this.mapNotificationToResponse(notification);
    } catch (error) {
      this.logger.error(
        `Erreur création notification: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Liste les notifications d'un utilisateur avec pagination.
   */
  async listNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ): Promise<PaginatedNotificationsResponse> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items: notifications.map(this.mapNotificationToResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Récupère le nombre de notifications non lues.
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  /**
   * Marque une notification comme lue.
   */
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponse> {
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    if (notification.readAt) {
      return this.mapNotificationToResponse(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return this.mapNotificationToResponse(updated);
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues.
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    this.logger.log(
      `${result.count} notifications marquées comme lues pour user ${userId}`,
    );
    return { count: result.count };
  }

  // ============================================
  // PUSH TOKENS : REGISTER / UNREGISTER
  // ============================================

  /**
   * Enregistre un token de notification (FCM ou simple).
   */
  async registerToken(
    userId: string,
    input: RegisterTokenInput,
  ): Promise<NotificationTokenResponse> {
    const { token, provider = 'webpush' } = input;

    // Vérifier si le token existe déjà
    const existingToken = await this.prisma.notificationToken.findFirst({
      where: { userId, token, provider },
    });

    if (existingToken) {
      return this.mapTokenToResponse(existingToken);
    }

    // Créer ou mettre à jour le token
    const notificationToken = await this.prisma.notificationToken.upsert({
      where: {
        userId_provider_endpoint: {
          userId,
          provider,
          endpoint: token, // Pour les tokens simples, le token sert d'endpoint
        },
      },
      update: { token },
      create: {
        userId,
        provider,
        token,
        endpoint: token,
      },
    });

    this.logger.log(
      `Token enregistré pour user ${userId} - provider: ${provider}`,
    );
    return this.mapTokenToResponse(notificationToken);
  }

  /**
   * Enregistre une subscription WebPush complète.
   */
  async subscribeWebPush(
    userId: string,
    subscription: WebPushSubscribeDto,
  ): Promise<NotificationTokenResponse> {
    const { endpoint, keys, userAgent } = subscription;

    // Vérifier si cette subscription existe déjà
    const existing = await this.prisma.notificationToken.findFirst({
      where: { userId, endpoint, provider: 'webpush' },
    });

    if (existing) {
      return this.mapTokenToResponse(existing);
    }

    const notificationToken = await this.prisma.notificationToken.create({
      data: {
        userId,
        provider: 'webpush',
        token: JSON.stringify(subscription),
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    this.logger.log(`WebPush subscription créée pour user ${userId}`);
    return this.mapTokenToResponse(notificationToken);
  }

  /**
   * Supprime une subscription WebPush.
   */
  async unsubscribeWebPush(
    userId: string,
    endpoint: string,
  ): Promise<{ success: boolean }> {
    const result = await this.prisma.notificationToken.deleteMany({
      where: { userId, endpoint, provider: 'webpush' },
    });

    if (result.count > 0) {
      this.logger.log(`WebPush subscription supprimée pour user ${userId}`);
    }

    return { success: result.count > 0 };
  }

  // ============================================
  // PUSH : ENVOI
  // ============================================

  /**
   * Envoie une notification push à un utilisateur (tous ses tokens).
   * Cette méthode est NON BLOQUANTE.
   */
  async sendPushToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.vapidConfigured) {
      this.logger.debug('Push non configuré, skip envoi');
      return { sent: 0, failed: 0 };
    }

    const tokens = await this.prisma.notificationToken.findMany({
      where: { userId, provider: 'webpush' },
    });

    if (tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const invalidTokenIds: string[] = [];

    for (const tokenData of tokens) {
      try {
        await this.sendPushToToken(tokenData, payload);
        sent++;
      } catch (error: any) {
        failed++;
        // Si le token est invalide (410 Gone ou 404), le marquer pour suppression
        if (error.statusCode === 410 || error.statusCode === 404) {
          invalidTokenIds.push(tokenData.id);
          this.logger.warn(`Token invalide supprimé pour user ${userId}`);
        } else {
          this.logger.error(
            `Erreur push pour user ${userId}: ${error.message}`,
          );
        }
      }
    }

    // Supprimer les tokens invalides
    if (invalidTokenIds.length > 0) {
      await this.prisma.notificationToken.deleteMany({
        where: { id: { in: invalidTokenIds } },
      });
    }

    return { sent, failed };
  }

  /**
   * Envoie une notification push à un token spécifique.
   */
  private async sendPushToToken(
    tokenData: any,
    payload: PushNotificationPayload,
  ): Promise<void> {
    if (!tokenData.endpoint || !tokenData.p256dh || !tokenData.auth) {
      throw new Error('Token WebPush incomplet');
    }

    const subscription = {
      endpoint: tokenData.endpoint,
      keys: {
        p256dh: tokenData.p256dh,
        auth: tokenData.auth,
      },
    };

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: payload.tag,
      data: payload.data,
    });

    await webpush.sendNotification(subscription, pushPayload);
  }

  // ============================================
  // TRIGGERS MÉTIERS (appelés par les autres services)
  // ============================================

  /**
   * Notification pour un nouveau message dans un échange.
   * Non bloquant : si ça échoue, l'opération principale continue.
   */
  async notifyNewMessage(
    recipientUserId: string,
    senderName: string,
    exchangeId: string,
    messagePreview: string,
  ): Promise<void> {
    try {
      // Créer notification in-app (avec push automatique)
      await this.createNotification({
        userId: recipientUserId,
        type: NotificationType.MESSAGE,
        title: `Nouveau message de ${senderName}`,
        body:
          messagePreview.length > 100
            ? `${messagePreview.substring(0, 100)}...`
            : messagePreview,
        data: { type: 'MESSAGE', exchangeId, url: `/exchanges/${exchangeId}` },
      }, true); // sendPush = true (déjà géré dans createNotification)
    } catch (error) {
      this.logger.error(`Erreur notifyNewMessage: ${error.message}`);
    }
  }

  /**
   * Notification pour une nouvelle demande d'échange.
   */
  async notifyExchangeRequest(
    recipientUserId: string,
    requesterName: string,
    exchangeId: string,
    itemTitle: string,
  ): Promise<void> {
    try {
      // Créer notification avec push automatique
      await this.createNotification({
        userId: recipientUserId,
        type: NotificationType.EXCHANGE_REQUEST,
        title: "Nouvelle demande d'échange",
        body: `${requesterName} souhaite échanger "${itemTitle}"`,
        data: {
          type: 'EXCHANGE_REQUEST',
          exchangeId,
          url: `/exchanges/${exchangeId}`,
        },
      }, true);
    } catch (error) {
      this.logger.error(`Erreur notifyExchangeRequest: ${error.message}`);
    }
  }

  /**
   * Notification pour un changement de statut d'échange.
   */
  async notifyExchangeStatus(
    recipientUserId: string,
    exchangeId: string,
    status: string,
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      PENDING: "Nouvelle demande d'échange",
      ACCEPTED: 'Votre échange a été accepté !',
      DECLINED: 'Votre échange a été décliné',
      COMPLETED: 'Échange terminé avec succès',
      CANCELLED: "L'échange a été annulé",
    };

    const message = statusMessages[status] || "Statut d'échange mis à jour";

    try {
      // Créer notification avec push automatique
      await this.createNotification({
        userId: recipientUserId,
        type: NotificationType.EXCHANGE_STATUS,
        title: 'SecondLife Exchange',
        body: message,
        data: {
          type: 'EXCHANGE_STATUS',
          exchangeId,
          status,
          url: `/exchanges/${exchangeId}`,
        },
      }, true);
    } catch (error) {
      this.logger.error(`Erreur notifyExchangeStatus: ${error.message}`);
    }
  }

  /**
   * Notification pour une action admin (ban, warn).
   */
  async notifyAdminAction(
    userId: string,
    action: 'BAN' | 'WARN' | 'UNBAN',
    reason?: string,
  ): Promise<void> {
    const messages: Record<string, { title: string; body: string }> = {
      BAN: {
        title: 'Compte suspendu',
        body:
          reason || 'Votre compte a été suspendu pour violation des règles.',
      },
      WARN: {
        title: 'Avertissement',
        body:
          reason || "Vous avez reçu un avertissement de la part de l'équipe.",
      },
      UNBAN: {
        title: 'Compte réactivé',
        body: 'Votre compte a été réactivé. Bienvenue de retour !',
      },
    };

    const { title, body } = messages[action] || {
      title: 'Action admin',
      body: 'Une action a été effectuée sur votre compte.',
    };

    try {
      await this.createNotification({
        userId,
        type: NotificationType.ADMIN_ACTION,
        title,
        body,
        data: { action, reason },
      });

      // Pas de push pour les actions admin (l'utilisateur peut être banni)
    } catch (error) {
      this.logger.error(`Erreur notifyAdminAction: ${error.message}`);
    }
  }

  /**
   * Notification pour un nouveau contenu éco publié.
   */
  async notifyEcoContentPublished(
    userIds: string[],
    contentTitle: string,
    contentId: string,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        await this.createNotification({
          userId,
          type: NotificationType.ECO_CONTENT_PUBLISHED,
          title: 'Nouveau contenu éco',
          body: `Découvrez : ${contentTitle}`,
          data: { contentId, url: `/eco/${contentId}` },
        });
      } catch (error) {
        this.logger.error(
          `Erreur notifyEcoContentPublished pour user ${userId}: ${error.message}`,
        );
      }
    }
  }

  // ============================================
  // MÉTHODES LEGACY (pour compatibilité)
  // ============================================

  /**
   * @deprecated Utiliser notifyExchangeStatus à la place
   */
  async sendExchangeStatusNotification(
    exchangeId: string,
    status: string,
    recipientUserId: string,
  ): Promise<void> {
    await this.notifyExchangeStatus(recipientUserId, exchangeId, status);
  }

  /**
   * @deprecated Utiliser notifyNewMessage à la place
   */
  async sendNewMessageNotification(
    threadId: string,
    threadTitle: string,
    recipientUserId: string,
    senderName: string,
  ): Promise<void> {
    await this.notifyNewMessage(
      recipientUserId,
      senderName,
      threadId,
      `Dans: ${threadTitle}`,
    );
  }

  /**
   * Envoie une notification de test (admin uniquement).
   */
  async sendTestNotification(
    currentUserId: string,
    input: SendTestNotificationInput,
  ): Promise<SendNotificationResponse> {
    const { userId = currentUserId, title, body } = input;

    // Créer notification in-app sans push automatique (on le fait manuellement après)
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: title || 'Test Notification',
      body: body || 'Ceci est une notification de test',
      data: { type: 'test', url: '/notifications' },
    }, false); // sendPush = false car on le fait manuellement

    // Envoyer push manuellement pour avoir le retour sent/failed
    const { sent, failed } = await this.sendPushToUser(userId, {
      title: title || 'Test Notification',
      body: body || 'Ceci est une notification de test',
      tag: 'test',
      data: { type: 'test', url: '/notifications' },
    });

    if (sent === 0 && failed === 0) {
      return {
        success: true,
        message: 'Notification in-app créée (aucun token push trouvé)',
        sentCount: 1,
      };
    }

    return {
      success: true,
      message: `Notification envoyée à ${sent} appareil(s)`,
      sentCount: sent,
    };
  }

  // ============================================
  // CRON : Rappel hebdomadaire
  // ============================================

  @Cron('0 9 * * 1', { timeZone: 'Europe/Paris' })
  async sendWeeklyThemeReminder(): Promise<void> {
    this.logger.log('Démarrage du rappel hebdomadaire des thèmes');

    try {
      const currentTheme = await this.prisma.weeklyTheme.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!currentTheme) {
        this.logger.warn(
          'Aucun thème actif trouvé pour le rappel hebdomadaire',
        );
        return;
      }

      // Récupérer tous les utilisateurs avec des tokens push
      const usersWithTokens = await this.prisma.notificationToken.findMany({
        select: { userId: true },
        distinct: ['userId'],
      });

      for (const { userId } of usersWithTokens) {
        try {
          // Créer notification avec push automatique
          await this.createNotification({
            userId,
            type: NotificationType.WEEKLY_THEME,
            title: 'Nouveau thème de la semaine',
            body: `Découvrez le thème: ${currentTheme.title}`,
            data: {
              type: 'WEEKLY_THEME',
              themeId: currentTheme.id,
              url: '/themes',
            },
          }, true);
        } catch (error) {
          this.logger.error(
            `Erreur rappel hebdo pour user ${userId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Rappel hebdomadaire envoyé à ${usersWithTokens.length} utilisateurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi du rappel hebdomadaire: ${error.message}`,
      );
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapNotificationToResponse(notification: any): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      readAt: notification.readAt?.toISOString() || null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  private mapTokenToResponse(token: any): NotificationTokenResponse {
    return {
      id: token.id,
      userId: token.userId,
      provider: token.provider,
      token: token.token,
      endpoint: token.endpoint,
      createdAt: token.createdAt.toISOString(),
    };
  }
}

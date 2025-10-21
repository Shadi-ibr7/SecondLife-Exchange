import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  RegisterTokenInput,
  SendTestNotificationInput,
  NotificationTokenResponse,
  SendNotificationResponse,
} from './dtos/notifications.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre un token de notification pour un utilisateur
   */
  async registerToken(
    userId: string,
    input: RegisterTokenInput,
  ): Promise<NotificationTokenResponse> {
    const { token, provider = 'webpush' } = input;

    // Vérifier si le token existe déjà
    const existingToken = await this.prisma.notificationToken.findFirst({
      where: {
        userId,
        token,
        provider,
      },
    });

    if (existingToken) {
      return this.mapToResponse(existingToken);
    }

    // Créer ou mettre à jour le token
    const notificationToken = await this.prisma.notificationToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        token,
      },
      create: {
        userId,
        provider,
        token,
      },
    });

    this.logger.log(
      `Token de notification enregistré pour l'utilisateur ${userId}`,
    );
    return this.mapToResponse(notificationToken);
  }

  /**
   * Envoie une notification de test
   */
  async sendTestNotification(
    currentUserId: string,
    input: SendTestNotificationInput,
  ): Promise<SendNotificationResponse> {
    const { userId = currentUserId, title, body } = input;

    // Récupérer les tokens de l'utilisateur
    const tokens = await this.prisma.notificationToken.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (tokens.length === 0) {
      throw new NotFoundException(
        'Aucun token de notification trouvé pour cet utilisateur',
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Envoyer la notification à chaque token
    for (const tokenData of tokens) {
      try {
        await this.sendNotificationToToken(
          tokenData.token,
          tokenData.provider,
          {
            title,
            body,
            icon: '/logo.svg',
            badge: '/badge.png',
            data: {
              url: '/',
              type: 'test',
            },
          },
        );
        sentCount++;
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'envoi à ${tokenData.provider}:`,
          error,
        );
        errors.push(`${tokenData.provider}: ${error.message}`);
      }
    }

    if (sentCount === 0) {
      throw new BadRequestException(
        `Aucune notification envoyée. Erreurs: ${errors.join(', ')}`,
      );
    }

    this.logger.log(
      `Notification de test envoyée à ${sentCount}/${tokens.length} tokens pour l'utilisateur ${userId}`,
    );

    return {
      success: true,
      message: `Notification envoyée à ${sentCount} appareil(s)`,
      sentCount,
    };
  }

  /**
   * Envoie un rappel hebdomadaire pour le nouveau thème
   */
  @Cron('0 9 * * 1', {
    timeZone: 'Europe/Paris',
  })
  async sendWeeklyThemeReminder(): Promise<void> {
    this.logger.log('Démarrage du rappel hebdomadaire des thèmes');

    try {
      // Récupérer le thème actuel
      const currentTheme = await this.prisma.weeklyTheme.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!currentTheme) {
        this.logger.warn(
          'Aucun thème actif trouvé pour le rappel hebdomadaire',
        );
        return;
      }

      // Récupérer tous les tokens de notification
      const tokens = await this.prisma.notificationToken.findMany({
        include: {
          user: {
            select: {
              displayName: true,
            },
          },
        },
      });

      if (tokens.length === 0) {
        this.logger.warn(
          'Aucun token de notification trouvé pour le rappel hebdomadaire',
        );
        return;
      }

      let sentCount = 0;
      const errors: string[] = [];

      // Envoyer la notification à tous les utilisateurs
      for (const tokenData of tokens) {
        try {
          await this.sendNotificationToToken(
            tokenData.token,
            tokenData.provider,
            {
              title: 'Nouveau thème de la semaine',
              body: `Découvrez le thème: ${currentTheme.title}`,
              icon: '/logo.svg',
              badge: '/badge.png',
              data: {
                url: '/themes',
                type: 'weekly_theme',
                themeId: currentTheme.id,
              },
            },
          );
          sentCount++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'envoi du rappel à ${tokenData.provider}:`,
            error,
          );
          errors.push(`${tokenData.provider}: ${error.message}`);
        }
      }

      this.logger.log(
        `Rappel hebdomadaire envoyé à ${sentCount}/${tokens.length} utilisateurs`,
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de l'envoi du rappel hebdomadaire:",
        error,
      );
    }
  }

  /**
   * Envoie une notification lors d'un changement de statut d'échange
   */
  async sendExchangeStatusNotification(
    exchangeId: string,
    status: string,
    recipientUserId: string,
  ): Promise<void> {
    const tokens = await this.prisma.notificationToken.findMany({
      where: { userId: recipientUserId },
    });

    if (tokens.length === 0) return;

    const statusMessages = {
      PENDING: "Nouvelle demande d'échange",
      ACCEPTED: 'Votre échange a été accepté',
      DECLINED: 'Votre échange a été décliné',
      COMPLETED: 'Échange terminé avec succès',
      CANCELLED: 'Échange annulé',
    };

    const message = statusMessages[status] || "Statut d'échange mis à jour";

    for (const tokenData of tokens) {
      try {
        await this.sendNotificationToToken(
          tokenData.token,
          tokenData.provider,
          {
            title: 'SecondLife Exchange',
            body: message,
            icon: '/logo.svg',
            badge: '/badge.png',
            data: {
              url: '/exchanges',
              type: 'exchange_status',
              exchangeId,
            },
          },
        );
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'envoi de notification d'échange:`,
          error,
        );
      }
    }
  }

  /**
   * Envoie une notification pour un nouveau message
   */
  async sendNewMessageNotification(
    threadId: string,
    threadTitle: string,
    recipientUserId: string,
    senderName: string,
  ): Promise<void> {
    const tokens = await this.prisma.notificationToken.findMany({
      where: { userId: recipientUserId },
    });

    if (tokens.length === 0) return;

    for (const tokenData of tokens) {
      try {
        await this.sendNotificationToToken(
          tokenData.token,
          tokenData.provider,
          {
            title: `Nouveau message de ${senderName}`,
            body: `Dans: ${threadTitle}`,
            icon: '/logo.svg',
            badge: '/badge.png',
            data: {
              url: `/thread/${threadId}`,
              type: 'new_message',
              threadId,
            },
          },
        );
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'envoi de notification de message:`,
          error,
        );
      }
    }
  }

  /**
   * Envoie une notification à un token spécifique
   */
  private async sendNotificationToToken(
    token: string,
    provider: string,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    },
  ): Promise<void> {
    // Placeholder pour l'envoi de notifications
    // Dans un vrai projet, vous utiliseriez FCM HTTP v1 ou Web Push

    this.logger.log(`Envoi de notification via ${provider} à ${token}:`, {
      title: payload.title,
      body: payload.body,
    });

    // Simulation d'envoi (à remplacer par l'implémentation réelle)
    if (provider === 'fcm') {
      // TODO: Implémenter FCM HTTP v1
      // await this.sendFCMNotification(token, payload);
    } else if (provider === 'webpush') {
      // TODO: Implémenter Web Push avec VAPID
      // await this.sendWebPushNotification(token, payload);
    }

    // Pour les tests, on simule un succès
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Mappe un token Prisma vers la réponse API
   */
  private mapToResponse(token: any): NotificationTokenResponse {
    return {
      id: token.id,
      userId: token.userId,
      provider: token.provider,
      token: token.token,
      createdAt: token.createdAt.toISOString(),
    };
  }
}


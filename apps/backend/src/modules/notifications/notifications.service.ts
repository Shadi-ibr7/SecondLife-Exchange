/**
 * FICHIER: notifications.service.ts
 *
 * DESCRIPTION:
 * Ce service gère l'envoi de notifications push aux utilisateurs.
 * Il permet d'enregistrer des tokens de notification et d'envoyer
 * des notifications pour différents événements (échanges, messages, thèmes).
 *
 * FONCTIONNALITÉS:
 * - Enregistrement de tokens de notification (FCM, Web Push)
 * - Envoi de notifications de test
 * - Rappel hebdomadaire automatique pour les nouveaux thèmes (cron)
 * - Notifications pour changements de statut d'échange
 * - Notifications pour nouveaux messages dans les threads
 *
 * PROVIDERS SUPPORTÉS:
 * - fcm: Firebase Cloud Messaging (Android/iOS)
 * - webpush: Web Push API (navigateurs)
 *
 * NOTE:
 * L'implémentation actuelle est un placeholder. Dans un vrai projet,
 * il faudrait implémenter FCM HTTP v1 et Web Push avec VAPID.
 */

// Import des classes NestJS
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

// Import du service Prisma
import { PrismaService } from '../../common/prisma/prisma.service';

// Import des DTOs
import {
  RegisterTokenInput,
  SendTestNotificationInput,
  NotificationTokenResponse,
  SendNotificationResponse,
} from './dtos/notifications.dto';

// Import du module de scheduling
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * SERVICE: NotificationsService
 *
 * Service pour la gestion des notifications push.
 */
@Injectable()
export class NotificationsService {
  /**
   * Logger pour enregistrer les événements
   */
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * CONSTRUCTEUR
   *
   * Injection du service Prisma
   */
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MÉTHODE: registerToken (Enregistrer un token)
  // ============================================

  /**
   * Enregistre un token de notification pour un utilisateur.
   *
   * FONCTIONNEMENT:
   * - Si le token existe déjà pour cet utilisateur et provider, le retourne
   * - Sinon, crée ou met à jour le token (upsert)
   *
   * @param userId - ID de l'utilisateur
   * @param input - Données du token (token, provider)
   * @returns Token enregistré
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

  // ============================================
  // MÉTHODE: sendTestNotification
  // ============================================

  /**
   * Envoie une notification de test à un utilisateur.
   *
   * UTILISATION:
   * - Tests de configuration des notifications
   * - Vérification que les tokens fonctionnent
   *
   * @param currentUserId - ID de l'utilisateur actuel (par défaut si userId non fourni)
   * @param input - Données de la notification (userId?, title, body)
   * @returns Résultat de l'envoi (nombre de notifications envoyées)
   * @throws NotFoundException si aucun token trouvé
   * @throws BadRequestException si aucune notification n'a pu être envoyée
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

  // ============================================
  // TÂCHE CRON: sendWeeklyThemeReminder
  // ============================================

  /**
   * Envoie un rappel hebdomadaire pour le nouveau thème.
   *
   * EXPRESSION CRON: '0 9 * * 1'
   * - 0: minute 0
   * - 9: heure 9 (09:00)
   * - *: tous les jours du mois
   * - *: tous les mois
   * - 1: lundi
   *
   * Résultat: Tous les lundis à 09:00
   *
   * PROCESSUS:
   * 1. Récupère le thème actif
   * 2. Récupère tous les tokens de notification
   * 3. Envoie une notification à tous les utilisateurs
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

  // ============================================
  // MÉTHODE: sendExchangeStatusNotification
  // ============================================

  /**
   * Envoie une notification lors d'un changement de statut d'échange.
   *
   * STATUTS:
   * - PENDING: Nouvelle demande d'échange
   * - ACCEPTED: Échange accepté
   * - DECLINED: Échange décliné
   * - COMPLETED: Échange terminé
   * - CANCELLED: Échange annulé
   *
   * @param exchangeId - ID de l'échange
   * @param status - Nouveau statut de l'échange
   * @param recipientUserId - ID de l'utilisateur destinataire
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

  // ============================================
  // MÉTHODE: sendNewMessageNotification
  // ============================================

  /**
   * Envoie une notification pour un nouveau message dans un thread.
   *
   * @param threadId - ID du thread
   * @param threadTitle - Titre du thread
   * @param recipientUserId - ID de l'utilisateur destinataire
   * @param senderName - Nom de l'expéditeur
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

  // ============================================
  // MÉTHODE PRIVÉE: sendNotificationToToken
  // ============================================

  /**
   * Envoie une notification à un token spécifique.
   *
   * NOTE:
   * Cette méthode est un placeholder. Dans un vrai projet, il faudrait:
   * - Implémenter FCM HTTP v1 pour les tokens 'fcm'
   * - Implémenter Web Push avec VAPID pour les tokens 'webpush'
   *
   * @param token - Token de notification
   * @param provider - Provider (fcm ou webpush)
   * @param payload - Données de la notification (title, body, icon, badge, data)
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

  // ============================================
  // MÉTHODE PRIVÉE: mapToResponse
  // ============================================

  /**
   * Mappe un token Prisma vers la réponse API.
   *
   * @param token - Token depuis Prisma
   * @returns Token formaté pour la réponse API
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

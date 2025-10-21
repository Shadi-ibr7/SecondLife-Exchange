import { apiClient } from './api';
import {
  NotificationToken,
  RegisterTokenDto,
  SendTestNotificationDto,
  SendNotificationResponse,
} from '@/types';

export const notificationsApi = {
  /**
   * Enregistre un token de notification
   */
  async registerToken(data: RegisterTokenDto): Promise<NotificationToken> {
    const response = await apiClient.client.post<NotificationToken>(
      '/notifications/register',
      data
    );
    return response.data;
  },

  /**
   * Envoie une notification de test (admin uniquement)
   */
  async sendTestNotification(
    data: SendTestNotificationDto = {}
  ): Promise<SendNotificationResponse> {
    const response = await apiClient.client.post<SendNotificationResponse>(
      '/notifications/test',
      data
    );
    return response.data;
  },
};


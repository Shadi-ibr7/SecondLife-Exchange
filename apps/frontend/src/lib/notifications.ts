import { notificationsApi } from './notifications.api';
import { toast } from 'react-hot-toast';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Vérifie l'état actuel des permissions
   */
  private checkPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Les notifications ne sont pas supportées par ce navigateur');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        toast.success('Notifications activées !');
        return true;
      } else if (permission === 'denied') {
        toast.error(
          'Notifications refusées. Vous pouvez les activer dans les paramètres du navigateur.'
        );
        return false;
      } else {
        toast.error('Permission de notification refusée');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      toast.error("Erreur lors de l'activation des notifications");
      return false;
    }
  }

  /**
   * Obtient un token de notification (Web Push)
   */
  async getToken(): Promise<string | null> {
    if (this.permission !== 'granted') {
      return null;
    }

    try {
      // Vérifier si le service worker est enregistré
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Simuler l'obtention d'un token (dans un vrai projet, utiliser Firebase)
        const token = this.generateMockToken();

        // Enregistrer le token côté serveur
        await this.registerToken(token);

        return token;
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de l'obtention du token:", error);
      return null;
    }
  }

  /**
   * Enregistre un token de notification côté serveur
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      await notificationsApi.registerToken({
        token,
        provider: 'webpush',
      });

      console.log('Token de notification enregistré');
      return true;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du token:", error);
      return false;
    }
  }

  /**
   * Envoie une notification de test
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      const response = await notificationsApi.sendTestNotification({
        title: 'Test SecondLife',
        body: 'Ceci est une notification de test !',
      });

      if (response.success) {
        toast.success(
          `Notification envoyée à ${response.sentCount} appareil(s)`
        );
        return true;
      } else {
        toast.error("Erreur lors de l'envoi de la notification");
        return false;
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification de test:",
        error
      );
      toast.error("Erreur lors de l'envoi de la notification");
      return false;
    }
  }

  /**
   * Affiche une notification locale
   */
  showLocalNotification(title: string, options?: NotificationOptions): void {
    if (this.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.svg',
        badge: '/badge.png',
        tag: 'secondlife-notification',
        ...options,
      });
    }
  }

  /**
   * Vérifie si les notifications sont supportées
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Vérifie si les notifications sont autorisées
   */
  isGranted(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Vérifie si les notifications sont activées (alias pour isGranted)
   */
  isEnabled(): boolean {
    return this.isGranted();
  }

  /**
   * Obtient l'état des permissions
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Génère un token mock pour les tests
   */
  private generateMockToken(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Initialise le service de notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Les notifications ne sont pas supportées');
      return false;
    }

    // Enregistrer le service worker si nécessaire
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker enregistré');
      } catch (error) {
        console.error(
          "Erreur lors de l'enregistrement du Service Worker:",
          error
        );
      }
    }

    return true;
  }
}

// Instance singleton
export const notificationService = NotificationService.getInstance();

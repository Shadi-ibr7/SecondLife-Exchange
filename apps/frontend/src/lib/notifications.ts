import { toast } from 'react-hot-toast';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class NotificationService {
  private vapidKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || null;
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      toast.error('Les notifications ne sont pas supportées par ce navigateur');
      return { granted: false, denied: true, default: false };
    }

    if (Notification.permission === 'granted') {
      return { granted: true, denied: false, default: false };
    }

    if (Notification.permission === 'denied') {
      toast.error(
        'Les notifications ont été bloquées. Vous pouvez les activer dans les paramètres du navigateur.'
      );
      return { granted: false, denied: true, default: false };
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        toast.success('Notifications activées !');
        await this.registerServiceWorker();
        return { granted: true, denied: false, default: false };
      } else {
        toast.error('Permission de notification refusée');
        return { granted: false, denied: true, default: false };
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      toast.error("Erreur lors de l'activation des notifications");
      return { granted: false, denied: false, default: true };
    }
  }

  /**
   * Enregistre le service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker non supporté');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      );
      console.log('Service Worker enregistré:', this.registration);
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du Service Worker:",
        error
      );
    }
  }

  /**
   * Obtient le token FCM pour les notifications push
   */
  async getFCMToken(): Promise<string | null> {
    if (!this.vapidKey) {
      console.warn('Clé VAPID non configurée');
      return null;
    }

    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    try {
      // Import dynamique de Firebase pour éviter les erreurs côté serveur
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { initializeApp, getApps } = await import('firebase/app');

      // Configuration Firebase (placeholder)
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Initialiser Firebase si pas déjà fait
      if (getApps().length === 0) {
        initializeApp(firebaseConfig);
      }

      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: this.registration,
      });

      return token;
    } catch (error) {
      console.error("Erreur lors de l'obtention du token FCM:", error);
      return null;
    }
  }

  /**
   * Enregistre le token FCM côté serveur
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement du token");
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du token:", error);
      return false;
    }
  }

  /**
   * Affiche une notification toast
   */
  showToast(
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) {
    const fullMessage = `${title}: ${message}`;

    switch (type) {
      case 'success':
        toast.success(fullMessage);
        break;
      case 'error':
        toast.error(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  }

  /**
   * Affiche une notification native
   */
  showNativeNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    } catch (error) {
      console.error("Erreur lors de l'affichage de la notification:", error);
    }
  }

  /**
   * Initialise le service de notifications
   */
  async initialize(): Promise<boolean> {
    const permission = await this.requestPermission();

    if (!permission.granted) {
      return false;
    }

    // Essayer d'obtenir et enregistrer le token FCM
    if (this.vapidKey) {
      const token = await this.getFCMToken();
      if (token) {
        await this.registerToken(token);
        return true;
      }
    }

    // Fallback: utiliser les notifications natives
    return true;
  }

  /**
   * Vérifie si les notifications sont supportées
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Vérifie si les notifications sont activées
   */
  isEnabled(): boolean {
    return Notification.permission === 'granted';
  }
}

export const notificationService = new NotificationService();

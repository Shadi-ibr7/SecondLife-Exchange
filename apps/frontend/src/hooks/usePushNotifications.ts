/**
 * FICHIER: hooks/usePushNotifications.ts
 *
 * DESCRIPTION:
 * Hook pour gérer les notifications push Web.
 * - Enregistre le service worker
 * - Demande la permission
 * - S'abonne aux notifications
 * - Envoie la subscription au backend
 *
 * UTILISATION:
 * ```tsx
 * const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { subscribePush, unsubscribePush } from '@/lib/notifications.api';
import { toast } from 'react-hot-toast';

// Clé publique VAPID (doit correspondre à celle du backend)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Convertit une clé VAPID en Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // ============================================
  // Initialisation
  // ============================================

  useEffect(() => {
    // Vérifier le support côté client
    if (typeof window === 'undefined') return;

    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Enregistrer le service worker et vérifier la subscription
      registerServiceWorker();
    }
  }, []);

  // ============================================
  // Enregistrement du Service Worker
  // ============================================

  const registerServiceWorker = async () => {
    try {
      // Utiliser sw-push.js pour les push ou le SW généré par next-pwa
      const reg = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      });

      setRegistration(reg);

      // Vérifier si déjà abonné
      const subscription = await reg.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      console.log('[Push] Service Worker enregistré');
    } catch (error) {
      console.error('[Push] Erreur enregistrement SW:', error);
    }
  };

  // ============================================
  // Subscribe
  // ============================================

  const subscribe = useCallback(async () => {
    if (!isSupported || !registration || !isAuthenticated) {
      toast.error('Push notifications non disponibles');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VAPID_PUBLIC_KEY non configuré');
      toast.error('Configuration push incomplète');
      return false;
    }

    setIsLoading(true);

    try {
      // Demander la permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Permission notifications refusée');
        return false;
      }

      // S'abonner aux push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Extraire les données de la subscription
      const subscriptionJson = subscription.toJSON();

      // Envoyer au backend
      await subscribePush({
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        },
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast.success('Notifications push activées !');
      return true;
    } catch (error: any) {
      console.error('[Push] Erreur subscription:', error);

      if (error.message?.includes('permission')) {
        toast.error('Permission notifications refusée');
      } else {
        toast.error("Erreur lors de l'activation des push");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, registration, isAuthenticated]);

  // ============================================
  // Unsubscribe
  // ============================================

  const unsubscribe = useCallback(async () => {
    if (!registration) return false;

    setIsLoading(true);

    try {
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Désabonner côté navigateur
        await subscription.unsubscribe();

        // Désabonner côté backend
        await unsubscribePush(subscription.endpoint);

        setIsSubscribed(false);
        toast.success('Notifications push désactivées');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Push] Erreur unsubscribe:', error);
      toast.error('Erreur lors de la désactivation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [registration]);

  // ============================================
  // Test notification
  // ============================================

  const sendTestNotification = useCallback(() => {
    if (!registration) return;

    // Envoyer un message au SW pour afficher une notification locale
    registration.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title: 'Test SecondLife Exchange',
        body: 'Les notifications fonctionnent correctement !',
        icon: '/icons/icon-192x192.png',
        data: { type: 'test', url: '/notifications' },
      },
    });
  }, [registration]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

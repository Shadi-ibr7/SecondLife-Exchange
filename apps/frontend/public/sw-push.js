/**
 * FICHIER: sw-push.js
 *
 * DESCRIPTION:
 * Service Worker pour les notifications Push Web.
 * Ce fichier gère la réception des notifications push et les clics.
 *
 * FONCTIONNALITÉS:
 * - Écoute des événements push
 * - Affichage des notifications
 * - Gestion des clics sur les notifications
 * - Navigation vers l'URL appropriée
 */

// ============================================
// ÉVÉNEMENT: push
// ============================================

/**
 * Gestionnaire pour les notifications push reçues.
 * Appelé quand le serveur envoie une notification push.
 */
self.addEventListener('push', (event) => {
  console.log('[SW Push] Notification reçue');

  // Extraire les données de la notification
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW Push] Erreur parsing data:', e);
    data = {
      title: 'SecondLife Exchange',
      body: event.data ? event.data.text() : 'Nouvelle notification',
    };
  }

  const {
    title = 'SecondLife Exchange',
    body = 'Vous avez une nouvelle notification',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/icon-72x72.png',
    tag,
    data: notificationData = {},
  } = data;

  // Options de la notification
  const options = {
    body,
    icon,
    badge,
    tag: tag || 'secondlife-notification',
    data: notificationData,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Voir',
      },
      {
        action: 'close',
        title: 'Fermer',
      },
    ],
  };

  // Afficher la notification
  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================
// ÉVÉNEMENT: notificationclick
// ============================================

/**
 * Gestionnaire pour les clics sur les notifications.
 * Navigue vers l'URL appropriée selon le type de notification.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification cliquée:', event.action);

  // Fermer la notification
  event.notification.close();

  // Si l'utilisateur a cliqué sur "Fermer", ne rien faire
  if (event.action === 'close') {
    return;
  }

  // Déterminer l'URL de destination
  const { url, type, exchangeId, itemId, themeId, contentId, threadId } =
    event.notification.data || {};

  let targetUrl = url || '/notifications';

  // Si pas d'URL explicite, construire selon le type
  if (!url && type) {
    switch (type) {
      case 'MESSAGE':
      case 'EXCHANGE_REQUEST':
      case 'EXCHANGE_STATUS':
        // Routes app: /exchanges (liste) et /exchange/[id] (détail)
        targetUrl = exchangeId ? `/exchange/${exchangeId}` : '/exchanges';
        break;
      case 'MATCH_FOUND':
        // Routes app: /item/[id]
        targetUrl = itemId ? `/item/${itemId}` : '/matching';
        break;
      case 'WEEKLY_THEME':
        targetUrl = themeId ? `/themes/${themeId}` : '/themes';
        break;
      case 'ECO_CONTENT_PUBLISHED':
        // Routes app: /discover/[id]
        targetUrl = contentId ? `/discover/${contentId}` : '/discover';
        break;
      case 'ADMIN_ACTION':
        targetUrl = '/profile';
        break;
      case 'POST_LIKED':
      case 'THREAD_REPLY':
      case 'POST_REPLY':
        targetUrl = threadId ? `/thread/${threadId}` : '/community';
        break;
      default:
        targetUrl = '/notifications';
    }
  }

  // Toujours utiliser une URL absolue (meilleure compatibilité PWA)
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  // Ouvrir ou focus sur la fenêtre (PWA si déjà ouverte)
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Priorité: une fenêtre déjà ouverte sur le même origin
        const sameOriginClients = clientList.filter((c) => {
          try {
            return new URL(c.url).origin === self.location.origin;
          } catch {
            return false;
          }
        });

        const client = sameOriginClients[0] || clientList[0];
        if (client) {
          // Naviguer directement côté SW (pas besoin de postMessage côté app)
          return client.navigate(absoluteUrl).then(() => client.focus());
        }

        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
      })
  );
});

// ============================================
// ÉVÉNEMENT: notificationclose
// ============================================

/**
 * Gestionnaire pour les notifications fermées (swipées).
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW Push] Notification fermée:', event.notification.tag);
});

// ============================================
// ÉVÉNEMENTS: install & activate
// ============================================

/**
 * Installation du service worker.
 */
self.addEventListener('install', (event) => {
  console.log('[SW Push] Installé');
  self.skipWaiting();
});

/**
 * Activation du service worker.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW Push] Activé');
  event.waitUntil(self.clients.claim());
});

// ============================================
// ÉVÉNEMENT: message
// ============================================

/**
 * Gestionnaire pour les messages depuis l'application.
 * Permet de tester les notifications localement.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, data } = event.data.payload;

    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-72x72.png',
      data: data || {},
      tag: 'secondlife-local',
    });
  }
});

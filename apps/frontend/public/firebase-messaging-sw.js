// Service Worker pour Firebase Cloud Messaging
// Ce fichier gère les notifications en arrière-plan

// Configuration Firebase (placeholder)
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-app-id',
};

// Initialiser Firebase (placeholder)
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// Gestionnaire pour les messages en arrière-plan
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FCM_MESSAGE') {
    const { title, body, icon, badge, data } = event.data.payload;

    const notificationOptions = {
      body: body,
      icon: icon || '/logo.svg',
      badge: badge || '/badge.png',
      data: data || {},
      tag: 'secondlife-notification',
      requireInteraction: false,
      silent: false,
    };

    self.registration.showNotification(title, notificationOptions);
  }
});

// Gestionnaire pour les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url, type } = event.notification.data || {};

  // URL par défaut
  let targetUrl = '/';

  if (url) {
    targetUrl = url;
  } else if (type) {
    // URLs basées sur le type de notification
    switch (type) {
      case 'weekly_theme':
        targetUrl = '/themes';
        break;
      case 'exchange_status':
        targetUrl = '/exchanges';
        break;
      case 'new_message':
        targetUrl = url || '/community';
        break;
      case 'test':
        targetUrl = '/';
        break;
      default:
        targetUrl = '/';
    }
  }

  // Ouvrir ou focus sur l'onglet
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher un client existant
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }

        // Ouvrir une nouvelle fenêtre si aucun client existant
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Gestionnaire pour les erreurs
self.addEventListener('error', (event) => {
  console.error('Erreur dans le service worker:', event.error);
});

// Gestionnaire pour les notifications fermées
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event.notification.tag);
});

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(self.clients.claim());
});

// Fonction utilitaire pour envoyer des messages au service worker
function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Export pour utilisation dans l'application
if (typeof self !== 'undefined') {
  self.sendMessageToSW = sendMessageToSW;
}

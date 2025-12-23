'use client';

import { useEffect } from 'react';

/**
 * Composant pour enregistrer le Service Worker PWA.
 * 
 * Ce composant s'exécute côté client et enregistre le service worker
 * généré par next-pwa pour activer les fonctionnalités PWA (cache, offline, etc.).
 * 
 * IMPORTANT: Ce composant doit être rendu uniquement côté client et en production.
 */
export function RegisterSW() {
  useEffect(() => {
    // Ne s'exécuter que côté client et en production
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV === 'development' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    // Enregistrer le service worker généré par next-pwa
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker PWA enregistré:', registration.scope);

        // Vérifier les mises à jour du service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Nouvelle version du Service Worker disponible');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error);
      });
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}


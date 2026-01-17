/**
 * FICHIER: AnalyticsProvider.tsx
 * 
 * DESCRIPTION:
 * Provider conditionnel pour les scripts analytics.
 * Ne charge les scripts que si le consentement analytics est donné.
 * 
 * UTILISATION:
 * - Ajoutez vos scripts analytics (GA, Plausible, etc.) dans ce provider
 * - Le provider vérifie automatiquement le consentement
 */

'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { isCategoryAccepted, getConsent } from '@/lib/cookies/consent';

// Configuration des analytics (à personnaliser)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Vérifier le consentement initial
    const checkConsent = () => {
      const consent = getConsent();
      setAnalyticsEnabled(consent?.consent.analytics === true);
    };

    checkConsent();

    // Écouter les changements de consentement
    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange);
    
    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Google Analytics - chargé uniquement si consentement donné */}
      {analyticsEnabled && GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true
                });
              `,
            }}
          />
        </>
      )}

      {/* Plausible Analytics - chargé uniquement si consentement donné */}
      {analyticsEnabled && PLAUSIBLE_DOMAIN && (
        <Script
          strategy="afterInteractive"
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
        />
      )}
    </>
  );
}

/**
 * Hook pour tracker des événements analytics
 * N'envoie l'événement que si le consentement est donné
 */
export function useAnalytics() {
  const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
    if (!isCategoryAccepted('analytics')) return;

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    }

    // Plausible
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(eventName, { props: eventParams });
    }
  };

  const trackPageView = (url: string) => {
    if (!isCategoryAccepted('analytics')) return;

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag && GA_MEASUREMENT_ID) {
      (window as any).gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  };

  return { trackEvent, trackPageView };
}

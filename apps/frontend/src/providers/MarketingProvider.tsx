/**
 * FICHIER: MarketingProvider.tsx
 * 
 * DESCRIPTION:
 * Provider conditionnel pour les pixels marketing.
 * Ne charge les scripts que si le consentement marketing est donné.
 * 
 * UTILISATION:
 * - Ajoutez vos pixels marketing (Facebook, Google Ads, etc.) dans ce provider
 * - Le provider vérifie automatiquement le consentement
 */

'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { isCategoryAccepted, getConsent } from '@/lib/cookies/consent';

// Configuration des pixels marketing (à personnaliser)
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

interface MarketingProviderProps {
  children: React.ReactNode;
}

export function MarketingProvider({ children }: MarketingProviderProps) {
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    // Vérifier le consentement initial
    const checkConsent = () => {
      const consent = getConsent();
      setMarketingEnabled(consent?.consent.marketing === true);
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
      
      {/* Facebook Pixel - chargé uniquement si consentement donné */}
      {marketingEnabled && FB_PIXEL_ID && (
        <>
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Ads - chargé uniquement si consentement donné */}
      {marketingEnabled && GOOGLE_ADS_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          />
          <Script
            id="google-ads"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ADS_ID}');
              `,
            }}
          />
        </>
      )}
    </>
  );
}

/**
 * Hook pour tracker des conversions marketing
 * N'envoie l'événement que si le consentement est donné
 */
export function useMarketing() {
  const trackConversion = (eventName: string, value?: number, currency?: string) => {
    if (!isCategoryAccepted('marketing')) return;

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, {
        value: value,
        currency: currency || 'EUR',
      });
    }

    // Google Ads
    if (typeof window !== 'undefined' && (window as any).gtag && GOOGLE_ADS_ID) {
      (window as any).gtag('event', 'conversion', {
        send_to: GOOGLE_ADS_ID,
        value: value,
        currency: currency || 'EUR',
      });
    }
  };

  const trackCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
    if (!isCategoryAccepted('marketing')) return;

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, params);
    }
  };

  return { trackConversion, trackCustomEvent };
}

/**
 * FICHIER: CookieProvider.tsx
 * 
 * DESCRIPTION:
 * Provider global pour la gestion du consentement cookies.
 * Expose le contexte useCookieConsent() pour accéder à l'état et aux actions.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ConsentState,
  StoredConsent,
  getConsent,
  setConsent as saveConsent,
  acceptAll as acceptAllCookies,
  rejectAll as rejectAllCookies,
  hasConsent,
  getDefaultConsent,
} from '@/lib/cookies/consent';
import { CookieBanner } from './CookieBanner';
import { CookiePreferencesModal } from './CookiePreferencesModal';

// ============================================
// TYPES
// ============================================

interface CookieConsentContextType {
  // État
  consent: ConsentState;
  hasGivenConsent: boolean;
  isPreferencesOpen: boolean;
  
  // Actions
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (consent: ConsentState) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  
  // Helpers
  isAccepted: (category: keyof ConsentState) => boolean;
}

// ============================================
// CONTEXT
// ============================================

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

// ============================================
// HOOK
// ============================================

export function useCookieConsent(): CookieConsentContextType {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface CookieProviderProps {
  children: React.ReactNode;
}

export function CookieProvider({ children }: CookieProviderProps) {
  const [consent, setConsentState] = useState<ConsentState>(getDefaultConsent());
  const [hasGivenConsent, setHasGivenConsent] = useState<boolean>(true); // true par défaut pour éviter le flash
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Charger le consentement au montage
  useEffect(() => {
    setIsMounted(true);
    const storedConsent = getConsent();
    
    if (storedConsent) {
      setConsentState(storedConsent.consent);
      setHasGivenConsent(true);
    } else {
      setHasGivenConsent(false);
    }

    // Écouter les changements de consentement
    const handleConsentChange = (event: CustomEvent<StoredConsent>) => {
      setConsentState(event.detail.consent);
      setHasGivenConsent(true);
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange as EventListener);
    
    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange as EventListener);
    };
  }, []);

  // Actions
  const acceptAll = useCallback(() => {
    acceptAllCookies();
    setConsentState({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
    setHasGivenConsent(true);
  }, []);

  const rejectAll = useCallback(() => {
    rejectAllCookies();
    setConsentState({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    setHasGivenConsent(true);
  }, []);

  const savePreferences = useCallback((newConsent: ConsentState) => {
    saveConsent(newConsent);
    setConsentState(newConsent);
    setHasGivenConsent(true);
    setIsPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const isAccepted = useCallback((category: keyof ConsentState) => {
    return consent[category] === true;
  }, [consent]);

  // Valeur du contexte
  const value: CookieConsentContextType = {
    consent,
    hasGivenConsent,
    isPreferencesOpen,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
    isAccepted,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      
      {/* Banner affiché tant que pas de consentement */}
      {isMounted && !hasGivenConsent && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={openPreferences}
        />
      )}
      
      {/* Modal de préférences */}
      <CookiePreferencesModal
        open={isPreferencesOpen}
        onOpenChange={setIsPreferencesOpen}
        consent={consent}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
      />
    </CookieConsentContext.Provider>
  );
}

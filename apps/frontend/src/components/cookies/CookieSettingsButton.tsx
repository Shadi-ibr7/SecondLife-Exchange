/**
 * FICHIER: CookieSettingsButton.tsx
 * 
 * DESCRIPTION:
 * Bouton pour ouvrir les préférences de cookies.
 * À utiliser dans le footer pour permettre la modification du consentement.
 */

'use client';

import { Cookie } from 'lucide-react';
import { useCookieConsent } from './CookieProvider';

interface CookieSettingsButtonProps {
  className?: string;
}

export function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  const { openPreferences } = useCookieConsent();

  return (
    <button
      onClick={openPreferences}
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary ${className}`}
      aria-label="Gérer les préférences de cookies"
    >
      <Cookie className="h-4 w-4" />
      Gestion des cookies
    </button>
  );
}

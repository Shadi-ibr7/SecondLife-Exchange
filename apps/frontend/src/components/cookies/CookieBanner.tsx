/**
 * FICHIER: CookieBanner.tsx
 * 
 * DESCRIPTION:
 * Bannière de consentement cookies affichée en bas de page.
 * Conforme RGPD avec options "Accepter", "Refuser" et "Personnaliser".
 */

'use client';

import { Cookie, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}

export function CookieBanner({ onAcceptAll, onRejectAll, onCustomize }: CookieBannerProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 duration-300"
      role="dialog"
      aria-label="Gestion des cookies"
      aria-describedby="cookie-banner-description"
    >
      <div className="border-t border-[#e4e4e7] bg-white/95 backdrop-blur-md dark:border-[#27272a] dark:bg-[#121216]/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Texte */}
            <div className="flex items-start gap-3 lg:flex-1">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <Cookie className="h-5 w-5 text-[#10b981]" />
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-sm font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  🍪 Nous respectons votre vie privée
                </h2>
                <p 
                  id="cookie-banner-description" 
                  className="text-sm text-[#71717a] dark:text-[#a1a1aa]"
                >
                  Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                  Vous pouvez accepter tous les cookies, les refuser ou{' '}
                  <button 
                    onClick={onCustomize}
                    className="font-medium text-[#10b981] underline-offset-2 hover:underline"
                  >
                    personnaliser vos choix
                  </button>
                  .{' '}
                  <Link 
                    href="/legal/cookies" 
                    className="font-medium text-[#10b981] underline-offset-2 hover:underline"
                  >
                    En savoir plus
                  </Link>
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
              {/* Personnaliser */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCustomize}
                className="order-3 h-9 gap-2 border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:text-[#a1a1aa] dark:hover:bg-[#27272a] sm:order-1"
              >
                <Settings className="h-4 w-4" />
                Personnaliser
              </Button>
              
              {/* Tout refuser */}
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectAll}
                className="order-2 h-9 border-[#e4e4e7] text-[#0b0b0d] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:text-[#ededee] dark:hover:bg-[#27272a]"
              >
                Tout refuser
              </Button>
              
              {/* Tout accepter */}
              <Button
                size="sm"
                onClick={onAcceptAll}
                className="order-1 h-9 bg-[#10b981] text-white hover:bg-[#10b981]/90 sm:order-3"
              >
                Tout accepter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

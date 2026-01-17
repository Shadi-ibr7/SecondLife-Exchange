/**
 * FICHIER: CookiePreferencesModal.tsx
 * 
 * DESCRIPTION:
 * Modal de personnalisation des préférences de cookies.
 * Permet d'activer/désactiver chaque catégorie de cookies.
 */

'use client';

import { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart3, Megaphone, Settings, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ConsentState, COOKIE_CATEGORIES, ConsentCategoryId } from '@/lib/cookies/consent';
import Link from 'next/link';

// Icônes par catégorie
const categoryIcons: Record<ConsentCategoryId, typeof Cookie> = {
  necessary: Shield,
  preferences: Settings,
  analytics: BarChart3,
  marketing: Megaphone,
};

interface CookiePreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent: ConsentState;
  onSave: (consent: ConsentState) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function CookiePreferencesModal({
  open,
  onOpenChange,
  consent,
  onSave,
  onAcceptAll,
  onRejectAll,
}: CookiePreferencesModalProps) {
  // État local pour les préférences en cours d'édition
  const [localConsent, setLocalConsent] = useState<ConsentState>(consent);

  // Synchroniser avec le consent externe quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setLocalConsent(consent);
    }
  }, [open, consent]);

  const handleToggle = (categoryId: ConsentCategoryId, checked: boolean) => {
    setLocalConsent(prev => ({
      ...prev,
      [categoryId]: checked,
    }));
  };

  const handleSave = () => {
    onSave(localConsent);
  };

  const handleAcceptAll = () => {
    onAcceptAll();
    onOpenChange(false);
  };

  const handleRejectAll = () => {
    onRejectAll();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
              <Cookie className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <DialogTitle className="text-lg">Préférences de cookies</DialogTitle>
              <DialogDescription className="text-sm">
                Gérez vos préférences de cookies
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Nous utilisons différents types de cookies pour optimiser votre expérience sur notre site. 
            Cliquez sur les catégories ci-dessous pour en savoir plus et modifier vos préférences.
          </p>

          {/* Liste des catégories */}
          <div className="space-y-4">
            {COOKIE_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.id];
              const isEnabled = localConsent[category.id];

              return (
                <div
                  key={category.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isEnabled
                      ? 'border-[#10b981]/30 bg-[rgba(16,185,129,0.05)]'
                      : 'border-[#e4e4e7] dark:border-[#27272a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        isEnabled 
                          ? 'bg-[rgba(16,185,129,0.2)]' 
                          : 'bg-[#f4f4f5] dark:bg-[#27272a]'
                      }`}>
                        <Icon className={`h-4 w-4 ${isEnabled ? 'text-[#10b981]' : 'text-[#71717a]'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                            {category.label}
                          </h3>
                          {category.required && (
                            <span className="rounded bg-[#f4f4f5] px-1.5 py-0.5 text-[10px] font-medium text-[#71717a] dark:bg-[#27272a]">
                              Requis
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#71717a] dark:text-[#a1a1aa]">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(category.id, checked)}
                      disabled={category.required}
                      aria-label={`${isEnabled ? 'Désactiver' : 'Activer'} ${category.label}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lien vers politique cookies */}
          <div className="mt-4 rounded-lg bg-[#f4f4f5] p-3 dark:bg-[#1a1a1f]">
            <Link 
              href="/legal/cookies" 
              className="flex items-center gap-2 text-sm font-medium text-[#10b981] hover:underline"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="h-4 w-4" />
              En savoir plus sur notre politique de cookies
            </Link>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleRejectAll}
            className="w-full border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:hover:bg-[#27272a] sm:w-auto"
          >
            Tout refuser
          </Button>
          <Button
            variant="outline"
            onClick={handleAcceptAll}
            className="w-full border-[#e4e4e7] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:hover:bg-[#27272a] sm:w-auto"
          >
            Tout accepter
          </Button>
          <Button
            onClick={handleSave}
            className="w-full bg-[#10b981] text-white hover:bg-[#10b981]/90 sm:w-auto"
          >
            Enregistrer mes choix
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

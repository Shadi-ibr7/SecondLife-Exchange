'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('Application installée avec succès !');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('Installation en cours...');
      } else {
        toast('Installation annulée');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
      toast.error("Erreur lors de l'installation");
    }
  };

  // Ne pas afficher si déjà installée ou si pas de prompt disponible
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstall}
      className="hidden h-10 items-center gap-2 px-3 hover:bg-primary/10 sm:flex"
    >
      <Download className="h-4 w-4" />
      <span className="hidden text-sm font-medium md:inline">Installer</span>
    </Button>
  );
}

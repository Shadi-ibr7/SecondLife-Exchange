/**
 * FICHIER: components/common/NotificationBell.tsx
 *
 * DESCRIPTION:
 * Bouton (icône cloche) permettant d’activer les notifications push via
 * `notificationService`. Utilisé dans la barre de navigation pour inciter
 * l’utilisateur à accepter les rappels hebdomadaires.
 *
 * FLUX:
 * 1. Demande la permission navigateur (notificationService.requestPermission)
 * 2. Si accordée, tente de récupérer un token FCM/webpush
 * 3. Enregistre le token côté backend (`notificationService.registerToken`)
 * 4. Affiche des toasts de succès/erreur
 *
 * UX:
 * - `isLoading` empêche les clics multiples et ajoute un état disabled.
 * - Message spécifique si la permission est refusée côté navigateur.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notificationService } from '@/lib/notifications';

export function NotificationBell() {
  const [isLoading, setIsLoading] = useState(false);

  const handleNotificationPermission = async () => {
    setIsLoading(true);
    try {
      // 1) Demander la permission notification au navigateur
      const permission = await notificationService.requestPermission();

      if (permission) {
        // 2) Récupérer un token (FCM/WebPush). Peut être null selon l’environnement.
        const token = await notificationService.getToken();
        if (token) {
          // 3) Envoyer ce token à l’API backend pour qu’il soit stocké
          await notificationService.registerToken(token);
          toast.success('Notifications activées !');
        } else {
          // Certains navigateurs peuvent autoriser mais ne pas fournir de token
          toast.success('Notifications activées (mode local)');
        }
      } else {
        toast.error('Notifications bloquées dans les paramètres du navigateur');
      }
    } catch (error) {
      console.error("Erreur lors de l'activation des notifications:", error);
      toast.error("Erreur lors de l'activation des notifications");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleNotificationPermission}
      disabled={isLoading}
      className="h-10 w-10 hover:bg-primary/10"
      aria-label="Activer les notifications"
    >
      <Bell className="h-5 w-5" />
    </Button>
  );
}

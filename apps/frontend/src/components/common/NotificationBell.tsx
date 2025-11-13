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
      const permission = await notificationService.requestPermission();

      if (permission) {
        // Essayer d'enregistrer le token FCM
        const token = await notificationService.getToken();
        if (token) {
          await notificationService.registerToken(token);
          toast.success('Notifications activées !');
        } else {
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

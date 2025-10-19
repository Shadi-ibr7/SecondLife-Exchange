import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/lib/notifications';
import { Bell, X, Check } from 'lucide-react';

interface NotificationBannerProps {
  onDismiss?: () => void;
}

export function NotificationBanner({ onDismiss }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont déjà activées
    if (notificationService.isEnabled()) {
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé
    if (Notification.permission === 'denied') {
      return;
    }

    // Afficher le banner après un délai
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const success = await notificationService.initialize();
      if (success) {
        setIsVisible(false);
        onDismiss?.();
      }
    } catch (error) {
      console.error("Erreur lors de l'activation des notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!notificationService.isSupported()) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed left-4 right-4 top-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold">
                    Activer les notifications
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recevez des notifications pour les nouveaux messages et
                    mises à jour d'échanges
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={handleEnable}
                      disabled={isLoading}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {isLoading ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Activer
                    </Button>

                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Plus tard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

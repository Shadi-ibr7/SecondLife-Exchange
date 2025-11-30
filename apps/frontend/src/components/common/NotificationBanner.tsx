/**
 * FICHIER: components/common/NotificationBanner.tsx
 *
 * DESCRIPTION:
 * Bannière incitant l'utilisateur à activer les notifications push. S'affiche
 * tant que les permissions ne sont pas accordées. Permet aussi d'envoyer
 * une notification de test. Utilisée sur la page d’accueil/notifications.
 *
 * FONCTIONNEMENT:
 * - Vérifie support navigateur + statut (default/denied/granted).
 * - Bouton “Activer” déclenche `notificationService.requestPermission()` puis enregistre le token.
 * - Bouton “Test” (si déjà granted) appelle `notificationService.sendTestNotification()`.
 * - Bouton “Fermer” masque la bannière (callback optionnel).
 *
 * UX:
 * - Animations d’entrée/sortie via Framer Motion.
 * - Card stylée avec icônes (Bell, CheckCircle, AlertCircle, etc.).
 * - Messages d’erreur/succès avec react-hot-toast.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/lib/notifications';
import { toast } from 'react-hot-toast';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function NotificationBanner({
  onDismiss,
  className,
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>('default');

  useEffect(() => {
    /**
     * Au montage :
     * - Vérifier si la Web Notification API est supportée
     * - Si oui et que la permission n’est pas encore accordée → afficher la bannière
     * - Stocker le statut courant (default / granted / denied)
     */
    if (notificationService.isSupported() && !notificationService.isGranted()) {
      setIsVisible(true);
    }
    setPermissionStatus(notificationService.getPermissionStatus());
  }, []);

  /**
   * Handler pour activer les notifications :
   * 1. Demander la permission navigateur
   * 2. Si accordée, récupérer un token (FCM/webpush)
   * 3. Enregistrer le token côté backend
   * 4. Fermer la bannière
   */
  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationService.requestPermission();

      if (granted) {
        const token = await notificationService.getToken();

        if (token) {
          toast.success('Notifications activées avec succès !');
          setIsVisible(false);
          onDismiss?.();
        } else {
          toast.error("Erreur lors de l'activation des notifications");
        }
      } else {
        toast.error('Permission de notification refusée');
      }
    } catch (error) {
      console.error("Erreur lors de l'activation des notifications:", error);
      toast.error("Erreur lors de l'activation des notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  /**
   * Handler pour envoyer une notification de test (uniquement si permission granted).
   */
  const handleTestNotification = async () => {
    setIsLoading(true);

    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        toast.success('Notification de test envoyée !');
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification de test:",
        error
      );
      toast.error("Erreur lors de l'envoi de la notification de test");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    Activer les rappels hebdomadaires
                  </h3>
                  {permissionStatus === 'denied' && (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  {permissionStatus === 'granted' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                  Recevez une notification chaque lundi à 9h pour découvrir le
                  nouveau thème de la semaine.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={isLoading || permissionStatus === 'denied'}
                    size="sm"
                    className="flex-1"
                  >
                    {isLoading ? 'Activation...' : 'Activer les notifications'}
                  </Button>

                  {permissionStatus === 'granted' && (
                    <Button
                      onClick={handleTestNotification}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      Test
                    </Button>
                  )}

                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {permissionStatus === 'denied' && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Les notifications ont été refusées. Vous pouvez les activer
                    dans les paramètres de votre navigateur.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

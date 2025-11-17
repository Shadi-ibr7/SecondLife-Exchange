'use client';

/**
 * FICHIER: app/notifications/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des notifications push. Elle guide l'utilisateur dans
 * l'activation des notifications, l'enregistrement du token et le test
 * d'envoi via notificationsApi.
 *
 * FONCTIONNALITÉS:
 * - Vérification du support navigateur + statut de permission
 * - Demande de permission et enregistrement du token (notificationService)
 * - Test d'envoi de notification (notificationsApi.sendTestNotification)
 * - Affichage d'un historique de tests (succès/erreur)
 *
 * UX:
 * - Cartes explicatives avec icônes
 * - Boutons CTA (Activer, Tester, Désactiver)
 * - ProtectedRoute pour restreindre aux utilisateurs connectés
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/common/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationService } from '@/lib/notifications';
import { notificationsApi } from '@/lib/notifications.api';
import { toast } from 'react-hot-toast';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  XCircle,
  TestTube,
} from 'lucide-react';
import ProtectedRoute from '../(auth)/protected';

function NotificationsPageContent() {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Vérifier l'état des permissions
    if (notificationService.isSupported()) {
      setPermissionStatus(notificationService.getPermissionStatus());
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const granted = await notificationService.requestPermission();

      if (granted) {
        // Obtenir et enregistrer le token
        const token = await notificationService.getToken();

        if (token) {
          toast.success('Notifications activées avec succès !');
          setPermissionStatus('granted');
        } else {
          toast.error("Erreur lors de l'activation des notifications");
        }
      } else {
        toast.error('Permission de notification refusée');
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error("Erreur lors de l'activation des notifications:", error);
      toast.error("Erreur lors de l'activation des notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        setTestResult({
          success: true,
          message: 'Notification de test envoyée avec succès !',
        });
        toast.success('Notification de test envoyée !');
      } else {
        setTestResult({
          success: false,
          message: "Erreur lors de l'envoi de la notification de test",
        });
        toast.error("Erreur lors de l'envoi de la notification de test");
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification de test:",
        error
      );
      setTestResult({
        success: false,
        message: "Erreur lors de l'envoi de la notification de test",
      });
      toast.error("Erreur lors de l'envoi de la notification de test");
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Activées
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Refusées
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Non configurées
          </Badge>
        );
    }
  };

  const getStatusMessage = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Vous recevrez des notifications pour les nouveaux thèmes hebdomadaires et les mises à jour importantes.';
      case 'denied':
        return 'Les notifications ont été refusées. Vous pouvez les activer dans les paramètres de votre navigateur.';
      default:
        return 'Activez les notifications pour recevoir des rappels hebdomadaires sur les nouveaux thèmes.';
    }
  };

  return (
    <Container className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        {/* En-tête */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="mt-2 text-muted-foreground">
                Gérez vos préférences de notifications
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Carte principale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Paramètres de notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* État actuel */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold">État actuel</h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">
                {getStatusMessage()}
              </p>
            </div>

            {/* Actions */}
            {permissionStatus !== 'granted' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">
                    Activer les notifications
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Recevez des notifications pour :
                  </p>
                  <ul className="mb-4 ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Nouveau thème hebdomadaire (chaque lundi à 9h)</li>
                    <li>Mises à jour sur vos échanges</li>
                    <li>Nouveaux messages</li>
                    <li>Suggestions d'objets personnalisées</li>
                  </ul>
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={isLoading || permissionStatus === 'denied'}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Activation...
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        Activer les notifications
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Test de notification */}
            {permissionStatus === 'granted' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">
                    Tester les notifications
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Envoyez une notification de test pour vérifier que tout
                    fonctionne correctement.
                  </p>
                  <Button
                    onClick={handleTestNotification}
                    disabled={isTesting}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {isTesting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Envoyer une notification de test
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg border p-4 ${
                      testResult.success
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-red-500 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <p
                        className={
                          testResult.success
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }
                      >
                        {testResult.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Message pour permissions refusées */}
            {permissionStatus === 'denied' && (
              <div className="rounded-lg border border-amber-500 bg-amber-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                    Notifications refusées
                  </h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Pour activer les notifications :
                </p>
                <ol className="ml-4 mt-2 list-decimal space-y-1 text-sm text-amber-700 dark:text-amber-400">
                  <li>
                    Ouvrez les paramètres de votre navigateur (icône de cadenas
                    ou de site web dans la barre d'adresse)
                  </li>
                  <li>Recherchez la section "Notifications"</li>
                  <li>Autorisez les notifications pour ce site</li>
                  <li>Rechargez cette page</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
}


'use client';

/**
 * FICHIER: app/notifications/page.tsx
 *
 * DESCRIPTION:
 * Page de notifications avec deux onglets :
 * 1. Liste des notifications in-app (messages, échanges, etc.)
 * 2. Paramètres des notifications push
 *
 * FONCTIONNALITÉS:
 * - Liste paginée des notifications in-app
 * - Marquer comme lu (individuel ou tout)
 * - Navigation vers la destination de la notification
 * - Configuration des push notifications (activation/test)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/common/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  XCircle,
  TestTube,
  Inbox,
  CheckCheck,
  Settings,
  RefreshCw,
} from 'lucide-react';
import ProtectedRoute from '../(auth)/protected';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  getNotifications,
  AppNotification,
  PaginatedNotifications,
} from '@/lib/notifications.api';

// ============================================
// COMPOSANT: NotificationsListTab
// ============================================

function NotificationsListTab() {
  const { markAsRead, markAllAsRead, refetch } = useNotifications();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const data: PaginatedNotifications = await getNotifications({
        page: pageNum,
        limit: 20,
      });
      setNotifications(data.items);
      setTotalPages(data.totalPages);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    // Mettre à jour localement
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
      // Mettre à jour localement
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      toast.error('Erreur lors du marquage');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(page);
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {unreadCount > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {unreadCount}
                </span>{' '}
                non lue{unreadCount > 1 ? 's' : ''}
              </>
            ) : (
              'Aucune notification non lue'
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Liste des notifications */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Aucune notification</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore reçu de notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT: NotificationsSettingsTab
// ============================================

function NotificationsSettingsTab() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission: permissionStatus,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const [isTesting, setIsTesting] = useState(false);

  const handleEnableNotifications = async () => {
    await subscribe();
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
  };

  const handleTestNotification = async () => {
    setIsTesting(true);

    try {
      // Utiliser le service worker pour envoyer une notification
      sendTestNotification();
      toast.success('Notification de test envoyée !');
    } catch (error) {
      console.error('Erreur test notification:', error);
      toast.error("Erreur lors de l'envoi du test");
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) {
      return (
        <Badge variant="secondary">
          <BellOff className="mr-1 h-3 w-3" />
          Non supporté
        </Badge>
      );
    }

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

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BellOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">Non supporté</h3>
          <p className="text-sm text-muted-foreground">
            Votre navigateur ne supporte pas les notifications push.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres Push
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* État actuel */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {permissionStatus === 'granted'
              ? 'Les notifications push sont activées. Vous recevrez des alertes même quand le site est fermé.'
              : permissionStatus === 'denied'
                ? 'Les notifications ont été refusées. Modifiez les paramètres de votre navigateur pour les activer.'
                : 'Activez les notifications pour recevoir des alertes en temps réel.'}
          </p>
        </div>

        {/* Actions */}
        {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Ce que vous recevrez :</h3>
              <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                <li>Nouveaux messages dans vos échanges</li>
                <li>Demandes d'échange sur vos objets</li>
                <li>Mises à jour de statut d'échange</li>
                <li>Nouveau thème hebdomadaire (lundi 9h)</li>
              </ul>
            </div>
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
        )}

        {/* Test et désactivation */}
        {permissionStatus === 'granted' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Tester les notifications</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Envoyez une notification de test pour vérifier le bon
                fonctionnement.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleTestNotification}
                  disabled={isTesting}
                  variant="outline"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Envoyer un test
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Désactiver */}
            {isSubscribed && (
              <div className="border-t border-border pt-4">
                <h3 className="mb-2 font-semibold text-muted-foreground">
                  Désactiver les notifications
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Vous ne recevrez plus de notifications push.
                </p>
                <Button
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Désactivation...
                    </>
                  ) : (
                    <>
                      <BellOff className="mr-2 h-4 w-4" />
                      Désactiver les push
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Instructions pour permissions refusées */}
        {permissionStatus === 'denied' && (
          <div className="rounded-lg border border-amber-500 bg-amber-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                Comment réactiver les notifications
              </h3>
            </div>
            <ol className="ml-4 list-decimal space-y-1 text-sm text-amber-700 dark:text-amber-400">
              <li>Cliquez sur l'icône de cadenas dans la barre d'adresse</li>
              <li>Trouvez "Notifications" dans les permissions</li>
              <li>Changez "Bloquer" en "Autoriser"</li>
              <li>Rechargez la page</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPOSANT: NotificationsPageContent
// ============================================

function NotificationsPageContent() {
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
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            Consultez vos notifications et gérez vos préférences
          </p>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              <Inbox className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <NotificationsListTab />
          </TabsContent>

          <TabsContent value="settings">
            <NotificationsSettingsTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </Container>
  );
}

// ============================================
// EXPORT
// ============================================

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
}

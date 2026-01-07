/**
 * FICHIER: notifications/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des notifications et alertes système pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Filter,
  Search,
  Settings,
  Trash2,
  Check,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NOTIFICATION_TYPES = {
  INFO: { label: 'Information', icon: Info, variant: 'default' as const },
  WARNING: { label: 'Avertissement', icon: AlertCircle, variant: 'secondary' as const },
  ERROR: { label: 'Erreur', icon: XCircle, variant: 'destructive' as const },
  SUCCESS: { label: 'Succès', icon: CheckCircle, variant: 'default' as const },
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  // Simulation de données - à remplacer par une vraie API
  const notifications = [
    {
      id: '1',
      type: 'ERROR',
      title: 'Erreur de connexion base de données',
      message: 'Connexion perdue à la base de données principale. Reconnexion en cours...',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      category: 'system',
    },
    {
      id: '2',
      type: 'WARNING',
      title: 'Espace disque faible',
      message: "L'espace disque disponible est inférieur à 20%. Veuillez libérer de l'espace.",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      category: 'system',
    },
    {
      id: '3',
      type: 'INFO',
      title: 'Nouveau signalement',
      message: 'Un nouveau signalement a été créé par un utilisateur.',
      read: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      category: 'reports',
    },
    {
      id: '4',
      type: 'SUCCESS',
      title: 'Sauvegarde terminée',
      message: 'La sauvegarde automatique de la base de données a été effectuée avec succès.',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      category: 'backup',
    },
    {
      id: '5',
      type: 'WARNING',
      title: 'Utilisateur banni',
      message: "L'utilisateur john.doe@example.com a été banni par l'administrateur.",
      read: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      category: 'users',
    },
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (filter !== 'all' && notif.category !== filter) return false;
    if (search && !notif.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    toast.success('Notification marquée comme lue');
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const handleMarkAllAsRead = () => {
    toast.success('Toutes les notifications ont été marquées comme lues');
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const handleDelete = () => {
    if (!selectedNotification) return;
    toast.success('Notification supprimée');
    setDeleteDialogOpen(false);
    setSelectedNotification(null);
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="admin-page-title">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} non lues</Badge>
              )}
            </div>
            <p className="admin-page-description">
              Gérer les notifications et alertes système
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une notification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="reports">Signalements</SelectItem>
                <SelectItem value="users">Utilisateurs</SelectItem>
                <SelectItem value="backup">Sauvegardes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Non lues ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des notifications</CardTitle>
              <CardDescription>
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} trouvée{filteredNotifications.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length > 0 ? (
                <div className="space-y-2">
                  {filteredNotifications.map((notif) => {
                    const typeConfig = NOTIFICATION_TYPES[notif.type as keyof typeof NOTIFICATION_TYPES] || NOTIFICATION_TYPES.INFO;
                    const Icon = typeConfig.icon;

                    return (
                      <div
                        key={notif.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          !notif.read ? 'bg-muted/50 border-primary/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${
                            notif.type === 'ERROR' ? 'bg-destructive/10' :
                            notif.type === 'WARNING' ? 'bg-yellow-500/10' :
                            notif.type === 'SUCCESS' ? 'bg-green-500/10' :
                            'bg-primary/10'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              notif.type === 'ERROR' ? 'text-destructive' :
                              notif.type === 'WARNING' ? 'text-yellow-600' :
                              notif.type === 'SUCCESS' ? 'text-green-600' :
                              'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{notif.title}</h4>
                                  {!notif.read && (
                                    <Badge variant="default" className="text-xs">Nouveau</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(notif.createdAt, 'PPp', { locale: fr })}
                              </div>
                              <div className="flex items-center gap-2">
                                {!notif.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notif.id)}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Marquer comme lu
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedNotification(notif.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune notification trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications non lues</CardTitle>
              <CardDescription>
                {filteredNotifications.filter((n) => !n.read).length} notification{filteredNotifications.filter((n) => !n.read).length !== 1 ? 's' : ''} non lue{filteredNotifications.filter((n) => !n.read).length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications.filter((n) => !n.read).length > 0 ? (
                <div className="space-y-2">
                  {filteredNotifications
                    .filter((n) => !n.read)
                    .map((notif) => {
                      const typeConfig = NOTIFICATION_TYPES[notif.type as keyof typeof NOTIFICATION_TYPES] || NOTIFICATION_TYPES.INFO;
                      const Icon = typeConfig.icon;

                      return (
                        <div
                          key={notif.id}
                          className="p-4 border rounded-lg bg-muted/50 border-primary/20"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${
                              notif.type === 'ERROR' ? 'bg-destructive/10' :
                              notif.type === 'WARNING' ? 'bg-yellow-500/10' :
                              notif.type === 'SUCCESS' ? 'bg-green-500/10' :
                              'bg-primary/10'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                notif.type === 'ERROR' ? 'text-destructive' :
                                notif.type === 'WARNING' ? 'text-yellow-600' :
                                notif.type === 'SUCCESS' ? 'text-green-600' :
                                'text-primary'
                              }`} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{notif.title}</h4>
                                    <Badge variant="default" className="text-xs">Nouveau</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notif.message}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {format(notif.createdAt, 'PPp', { locale: fr })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notif.id)}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Marquer comme lu
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedNotification(notif.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Toutes les notifications ont été lues</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la notification</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


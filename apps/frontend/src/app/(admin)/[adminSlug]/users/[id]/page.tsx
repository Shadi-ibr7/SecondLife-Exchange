/**
 * FICHIER: users/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un utilisateur pour l'admin.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Package,
  ArrowLeftRight,
  Ban,
  UserCheck,
  MapPin,
  User,
  Shield,
  Activity,
  FileText,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: () => adminApi.getUserById(id),
  });

  const handleBan = async () => {
    try {
      await adminApi.banUser(id, banReason || undefined);
      toast.success('Utilisateur banni avec succès');
      setBanDialogOpen(false);
      setBanReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du bannissement');
    }
  };

  const handleUnban = async () => {
    try {
      await adminApi.unbanUser(id);
      toast.success('Utilisateur débanni avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du débannissement');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails utilisateur</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Utilisateur non trouvé</h1>
          <p className="text-muted-foreground">L'utilisateur demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/users`)} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const isBanned = !!user.ban;
  const totalExchanges =
    (user._count?.exchangesRequested || 0) + (user._count?.exchangesResponded || 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="admin-page-title">Détails utilisateur</h1>
            <p className="text-muted-foreground">Informations complètes sur l'utilisateur</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBanned ? (
            <Button variant="outline" onClick={handleUnban}>
              <UserCheck className="w-4 h-4 mr-2" />
              Débannir
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setBanDialogOpen(true)}>
              <Ban className="w-4 h-4 mr-2" />
              Bannir
            </Button>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Badge variant={isBanned ? 'destructive' : 'default'}>
                {isBanned ? 'Banni' : 'Actif'}
              </Badge>
              {user.roles === 'ADMIN' && (
                <Badge variant="secondary" className="mt-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{user.displayName}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  {user.profile?.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {user.profile.location}
                    </div>
                  )}
                </div>
              </div>

              {user.profile?.bio && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Bio</h3>
                  <p className="text-sm text-muted-foreground">{user.profile.bio}</p>
                </div>
              )}

              {user.ban && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-4 h-4 text-destructive" />
                    <span className="font-medium text-destructive">Utilisateur banni</span>
                  </div>
                  {user.ban.reason && (
                    <p className="text-sm text-muted-foreground">
                      Raison: {user.ban.reason}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Banni le {new Date(user.ban.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{user._count?.items || 0}</div>
                <div className="text-xs text-muted-foreground">Objets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalExchanges}</div>
                <div className="text-xs text-muted-foreground">Échanges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {user._count?.exchangesRequested || 0}
                </div>
                <div className="text-xs text-muted-foreground">Demandés</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">
            <Package className="w-4 h-4 mr-2" />
            Objets ({user._count?.items || 0})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <FileText className="w-4 h-4 mr-2" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objets publiés</CardTitle>
              <CardDescription>
                {user.items?.length || 0} objet{user.items?.length !== 1 ? 's' : ''} au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.items && user.items.length > 0 ? (
                <div className="space-y-4">
                  {user.items.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/${ADMIN_BASE_PATH}/items`}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      {item.photos && item.photos.length > 0 ? (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden">
                          <Image
                            src={item.photos[0].url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.category} • {item.status}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun objet publié</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
                <CardDescription>Activité sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Objets publiés</span>
                  <span className="font-medium">{user._count?.items || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Échanges demandés</span>
                  <span className="font-medium">{user._count?.exchangesRequested || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Échanges reçus</span>
                  <span className="font-medium">{user._count?.exchangesResponded || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total échanges</span>
                  <span className="font-medium">{totalExchanges}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
                <CardDescription>Détails du compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rôle</span>
                  <Badge variant="secondary">{user.roles}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date d'inscription</span>
                  <span className="text-sm font-medium">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <Badge variant={isBanned ? 'destructive' : 'default'}>
                    {isBanned ? 'Banni' : 'Actif'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>Préférences utilisateur</CardDescription>
            </CardHeader>
            <CardContent>
              {user.preferences ? (
                <div className="space-y-4">
                  {user.preferences.preferredCategories &&
                    user.preferences.preferredCategories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Catégories préférées</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.preferences.preferredCategories.map((cat: string) => (
                            <Badge key={cat} variant="secondary">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  {user.preferences.locale && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Locale</span>
                      <span className="text-sm font-medium">{user.preferences.locale}</span>
                    </div>
                  )}
                  {user.preferences.country && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pays</span>
                      <span className="text-sm font-medium">{user.preferences.country}</span>
                    </div>
                  )}
                  {user.preferences.radiusKm && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rayon (km)</span>
                      <span className="text-sm font-medium">{user.preferences.radiusKm}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune préférence configurée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bannir l'utilisateur</DialogTitle>
            <DialogDescription>
              Bannir {user.displayName} ({user.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du bannissement (optionnel)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Contenu inapproprié, comportement abusif..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleBan}>
              Bannir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


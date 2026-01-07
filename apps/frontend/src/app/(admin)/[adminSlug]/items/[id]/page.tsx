/**
 * FICHIER: items/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un objet pour l'admin.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  Archive,
  Trash2,
  Edit,
  Eye,
  MapPin,
  Tag,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ITEM_CATEGORY_LABELS } from '@/lib/constants';

export default function ItemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['admin-item-detail', id],
    queryFn: () => adminApi.getItemById(id),
  });

  const handleArchive = async () => {
    try {
      await adminApi.archiveItem(id);
      toast.success('Objet archivé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-item-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'archivage');
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteItem(id);
      toast.success('Objet supprimé avec succès');
      router.push(`/${ADMIN_BASE_PATH}/items`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      AVAILABLE: { variant: 'default', label: 'Disponible' },
      TRADED: { variant: 'secondary', label: 'Échangé' },
      ARCHIVED: { variant: 'secondary', label: 'Archivé' },
      PENDING: { variant: 'default', label: 'En attente' },
    };
    const config = variants[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails objet</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Objet non trouvé</h1>
          <p className="text-muted-foreground">L'objet demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/items`)} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="admin-page-title">Détails objet</h1>
            <p className="text-muted-foreground">Informations complètes sur l'objet</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.status !== 'ARCHIVED' && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Archiver
            </Button>
          )}
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          {item.photos && item.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>{item.photos.length} photo(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.photos.map((photo: any) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{item.title}</CardTitle>
                {getStatusBadge(item.status)}
              </div>
              <CardDescription>
                Publié le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.description || 'Aucune description'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Catégorie</h3>
                  <Badge variant="secondary">
                    {ITEM_CATEGORY_LABELS[item.category] || item.category}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Condition</h3>
                  <Badge variant="secondary">{item.condition}</Badge>
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle>Propriétaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.owner?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {item.owner?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{item.owner?.displayName}</div>
                  <div className="text-sm text-muted-foreground">{item.owner?.email}</div>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/${ADMIN_BASE_PATH}/users/${item.ownerId}`}>
                  <User className="w-4 h-4 mr-2" />
                  Voir le profil
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{item.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dernière mise à jour</span>
                <span>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString('fr-FR')
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {item.status !== 'ARCHIVED' && (
                <Button variant="outline" className="w-full" onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archiver
                </Button>
              )}
              <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'objet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cet objet ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{item.title}</strong> sera supprimé de manière permanente.
            </p>
          </div>
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


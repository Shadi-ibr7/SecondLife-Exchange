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
  MapPin,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    const config: Record<string, { className: string; label: string }> = {
      AVAILABLE: {
        className: 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]',
        label: 'Disponible',
      },
      TRADED: {
        className: 'bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]',
        label: 'Échangé',
      },
      ARCHIVED: {
        className: 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]',
        label: 'Archivé',
      },
      PENDING: {
        className: 'bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:bg-[rgba(217,160,85,0.1)] dark:text-[#d9a055]',
        label: 'En attente',
      },
    };
    const { className, label } = config[status] || {
      className: 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]',
      label: status,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${className}`}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails objet</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Objet non trouvé</h1>
          <p className="admin-page-description">L'objet demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/items`)} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="admin-page-title">Détails objet</h1>
            <p className="admin-page-description">Informations complètes sur l'objet</p>
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
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardContent className="p-0">
                <div className="mb-4">
                  <h3 className="text-base font-normal text-foreground mb-1">Photos</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    {item.photos.length} photo(s)
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.photos.map((photo: any) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                    >
                      <Image src={photo.url} alt={item.title} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">{item.title}</h2>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-sm text-muted-foreground font-normal mb-6">
                Publié le {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: fr })}
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-foreground">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {item.description || 'Aucune description'}
                  </p>
                </div>

                <Separator className="bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)]" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-foreground">Catégorie</h3>
                    <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                      {ITEM_CATEGORY_LABELS[item.category] || item.category}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-foreground">Condition</h3>
                    <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                      {item.condition}
                    </Badge>
                  </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <>
                    <Separator className="bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)]" />
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-foreground">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Info */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4">
                <h3 className="text-base font-normal text-foreground mb-1">Propriétaire</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.owner?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {item.owner?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{item.owner?.displayName}</div>
                    <div className="text-sm text-muted-foreground">{item.owner?.email}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${ADMIN_BASE_PATH}/users/${item.ownerId}`}>
                    <User className="w-4 h-4 mr-2" />
                    Voir le profil
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4">
                <h3 className="text-base font-normal text-foreground mb-1">Informations</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs text-foreground">{item.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date de création</span>
                  <span className="text-foreground">
                    {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dernière mise à jour</span>
                  <span className="text-foreground">
                    {item.updatedAt
                      ? format(new Date(item.updatedAt), 'dd MMM yyyy', { locale: fr })
                      : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4">
                <h3 className="text-base font-normal text-foreground mb-1">Actions rapides</h3>
              </div>
              <div className="space-y-2">
                {item.status !== 'ARCHIVED' && (
                  <Button variant="outline" className="w-full" onClick={handleArchive}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archiver
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </Button>
              </div>
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

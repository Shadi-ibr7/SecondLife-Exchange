/**
 * FICHIER: exchanges/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un échange pour l'admin.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  User,
  Calendar,
  Trash2,
  MessageSquare,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ExchangeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: exchange, isLoading } = useQuery({
    queryKey: ['admin-exchange-detail', id],
    queryFn: () => adminApi.getExchangeById(id),
  });

  const handleDelete = async () => {
    try {
      await adminApi.deleteExchange(id);
      toast.success('Échange supprimé avec succès');
      router.push(`/${ADMIN_BASE_PATH}/exchanges`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string; icon: any }> = {
      PENDING: { variant: 'default', label: 'En attente', icon: Clock },
      ACCEPTED: { variant: 'default', label: 'Accepté', icon: CheckCircle },
      COMPLETED: { variant: 'secondary', label: 'Complété', icon: CheckCircle },
      CANCELLED: { variant: 'destructive', label: 'Annulé', icon: XCircle },
      DECLINED: { variant: 'destructive', label: 'Refusé', icon: XCircle },
    };
    const config = variants[status] || { variant: 'default' as const, label: status, icon: Clock };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails échange</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Échange non trouvé</h1>
          <p className="text-muted-foreground">L'échange demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/exchanges`)} className="mt-4">
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
            <div className="flex items-center gap-3">
              <h1 className="admin-page-title">Détails échange</h1>
              {getStatusBadge(exchange.status)}
            </div>
            <p className="text-muted-foreground">
              Créé le {format(new Date(exchange.createdAt), 'PPpp', { locale: fr })}
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exchange Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Détails de l'échange
              </CardTitle>
              <CardDescription>Informations sur la proposition d'échange</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message initial */}
              {exchange.message && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Message</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{exchange.message}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    <div className="w-px h-full bg-border min-h-[40px]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Échange créé</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(exchange.createdAt), 'PPpp', { locale: fr })}
                    </div>
                  </div>
                </div>

                {exchange.completedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Échange complété</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(exchange.completedAt), 'PPpp', { locale: fr })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {exchange.messages && exchange.messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages ({exchange.messages.length})
                </CardTitle>
                <CardDescription>Historique des messages de l'échange</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {exchange.messages.map((message: any) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {message.sender?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.sender?.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'PPp', { locale: fr })}
                          </span>
                        </div>
                        <div className="text-sm bg-muted p-3 rounded-lg">
                          {message.content}
                        </div>
                        {message.images && message.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {message.images.map((img: string, idx: number) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-lg bg-muted overflow-hidden"
                              >
                                {/* Image preview would go here */}
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                  Image {idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester */}
          <Card>
            <CardHeader>
              <CardTitle>Demandeur</CardTitle>
              <CardDescription>Utilisateur qui propose l'échange</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={exchange.requester?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {exchange.requester?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{exchange.requester?.displayName}</div>
                  <div className="text-sm text-muted-foreground">{exchange.requester?.email}</div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Objet demandé</div>
                <div className="font-medium text-sm">{exchange.requestedItemTitle}</div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/${ADMIN_BASE_PATH}/users/${exchange.requesterId}`}>
                  <User className="w-4 h-4 mr-2" />
                  Voir le profil
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Responder */}
          <Card>
            <CardHeader>
              <CardTitle>Répondeur</CardTitle>
              <CardDescription>Utilisateur qui répond à la demande</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={exchange.responder?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {exchange.responder?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{exchange.responder?.displayName}</div>
                  <div className="text-sm text-muted-foreground">{exchange.responder?.email}</div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Objet offert</div>
                <div className="font-medium text-sm">{exchange.offeredItemTitle}</div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/${ADMIN_BASE_PATH}/users/${exchange.responderId}`}>
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
                <span className="font-mono text-xs">{exchange.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span>{format(new Date(exchange.createdAt), 'PP', { locale: fr })}</span>
              </div>
              {exchange.completedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date de complétion</span>
                  <span>{format(new Date(exchange.completedAt), 'PP', { locale: fr })}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Messages</span>
                <span>{exchange._count?.messages || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer l'échange
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'échange</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cet échange ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              L'échange entre <strong>{exchange.requester?.displayName}</strong> et{' '}
              <strong>{exchange.responder?.displayName}</strong> sera supprimé de manière
              permanente, ainsi que tous les messages associés.
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


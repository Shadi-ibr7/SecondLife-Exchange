'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  User,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
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
    const config: Record<
      string,
      { className: string; label: string; icon: React.ReactNode }
    > = {
      PENDING: {
        className:
          'bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:bg-[rgba(217,160,85,0.1)] dark:text-[#d9a055]',
        label: 'En attente',
        icon: <Clock className="w-3 h-3" />,
      },
      ACCEPTED: {
        className:
          'bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]',
        label: 'Accepté',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      COMPLETED: {
        className:
          'bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]',
        label: 'Complété',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      CANCELLED: {
        className:
          'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]',
        label: 'Annulé',
        icon: <XCircle className="w-3 h-3" />,
      },
      DECLINED: {
        className:
          'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]',
        label: 'Refusé',
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    const { className, label, icon } = config[status] || {
      className:
        'bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:bg-[rgba(217,160,85,0.1)] dark:text-[#d9a055]',
      label: status,
      icon: <Clock className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal gap-1 ${className}`}>
        {icon} {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails échange</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Échange non trouvé</h1>
          <p className="admin-page-description">L'échange demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/exchanges`)} className="mt-4">
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
            <div className="flex items-center gap-3">
              <h1 className="admin-page-title">Détails échange</h1>
              {getStatusBadge(exchange.status)}
            </div>
            <p className="admin-page-description">
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
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-foreground" />
                <h3 className="text-base font-normal text-foreground">Détails de l'échange</h3>
              </div>
              <p className="text-sm text-muted-foreground font-normal mb-6">
                Informations sur la proposition d'échange
              </p>

              <div className="space-y-6">
                {/* Message initial */}
                {exchange.message && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-foreground">Message</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap text-foreground">
                        {exchange.message}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)]" />

                {/* Timeline */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                      <div className="w-px h-full bg-border min-h-[40px]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Échange créé</div>
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
                        <div className="font-medium text-foreground">Échange complété</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(exchange.completedAt), 'PPpp', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {exchange.messages && exchange.messages.length > 0 && (
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardContent className="p-0">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-foreground" />
                  <h3 className="text-base font-normal text-foreground">
                    Messages ({exchange.messages.length})
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground font-normal mb-6">
                  Historique des messages de l'échange
                </p>
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
                          <span className="text-sm font-medium text-foreground">
                            {message.sender?.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'PPp', { locale: fr })}
                          </span>
                        </div>
                        <div className="text-sm bg-muted p-3 rounded-lg text-foreground">
                          {message.content}
                        </div>
                        {message.images && message.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {message.images.map((img: string, idx: number) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-lg bg-muted overflow-hidden border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                              >
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
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4">
                <h3 className="text-base font-normal text-foreground mb-1">Demandeur</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  Utilisateur qui propose l'échange
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={exchange.requester?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {exchange.requester?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{exchange.requester?.displayName}</div>
                    <div className="text-sm text-muted-foreground">{exchange.requester?.email}</div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Objet demandé</div>
                  <div className="font-medium text-sm text-foreground">
                    {exchange.requestedItemTitle}
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${ADMIN_BASE_PATH}/users/${exchange.requesterId}`}>
                    <User className="w-4 h-4 mr-2" />
                    Voir le profil
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Responder */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4">
                <h3 className="text-base font-normal text-foreground mb-1">Répondeur</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  Utilisateur qui répond à la demande
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={exchange.responder?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {exchange.responder?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{exchange.responder?.displayName}</div>
                    <div className="text-sm text-muted-foreground">{exchange.responder?.email}</div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Objet offert</div>
                  <div className="font-medium text-sm text-foreground">
                    {exchange.offeredItemTitle}
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${ADMIN_BASE_PATH}/users/${exchange.responderId}`}>
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
                  <span className="font-mono text-xs text-foreground">{exchange.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date de création</span>
                  <span className="text-foreground">
                    {format(new Date(exchange.createdAt), 'PP', { locale: fr })}
                  </span>
                </div>
                {exchange.completedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Date de complétion</span>
                    <span className="text-foreground">
                      {format(new Date(exchange.completedAt), 'PP', { locale: fr })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="text-foreground">{exchange._count?.messages || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardContent className="p-0">
              <div className="mb-4">
                <h3 className="text-base font-normal text-foreground mb-1">Actions</h3>
              </div>
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

/**
 * FICHIER: reports/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un signalement pour l'admin.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Flag,
  User,
  Calendar,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Package,
  MessageSquare,
  Ban,
  Shield,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
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

const REPORT_TYPE_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Contenu inapproprié',
  FRAUD: 'Fraude',
  HARASSMENT: 'Harcèlement',
  OTHER: 'Autre',
};

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banUser, setBanUser] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin-report-detail', id],
    queryFn: () => adminApi.getReportById(id),
  });

  const handleResolve = async () => {
    try {
      await adminApi.resolveReport(id, banUser);
      toast.success('Signalement résolu avec succès');
      setResolveDialogOpen(false);
      setBanUser(false);
      queryClient.invalidateQueries({ queryKey: ['admin-report-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la résolution');
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteReport(id);
      toast.success('Signalement supprimé avec succès');
      router.push(`/${ADMIN_BASE_PATH}/reports`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails signalement</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Signalement non trouvé</h1>
          <p className="text-muted-foreground">Le signalement demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/reports`)} className="mt-4">
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
              <h1 className="admin-page-title">Détails signalement</h1>
              {report.resolved ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Résolu
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Non résolu
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Signalé le {format(new Date(report.createdAt), 'PPpp', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!report.resolved && (
            <Button variant="default" onClick={() => setResolveDialogOpen(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Résoudre
            </Button>
          )}
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Alert si non résolu */}
      {!report.resolved && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Signalement en attente</AlertTitle>
          <AlertDescription>
            Ce signalement n'a pas encore été traité. Veuillez examiner le contenu et prendre les
            mesures appropriées.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Détails du signalement
                </CardTitle>
                <Badge variant="secondary">
                  {REPORT_TYPE_LABELS[report.type] || report.type}
                </Badge>
              </div>
              <CardDescription>Informations sur le signalement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message */}
              <div>
                <h3 className="text-sm font-medium mb-2">Message du signalement</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{report.message}</p>
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Historique</h3>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    <div className="w-px h-full bg-border min-h-[40px]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Signalement créé</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(report.createdAt), 'PPpp', { locale: fr })}
                    </div>
                  </div>
                </div>

                {report.resolved && report.resolvedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Signalement résolu</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(report.resolvedAt), 'PPpp', { locale: fr })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Target Item (if exists) */}
          {report.targetItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Objet signalé
                </CardTitle>
                <CardDescription>L'objet concerné par ce signalement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {report.targetItem.photos?.[0] && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={report.targetItem.photos[0].url}
                        alt={report.targetItem.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium">{report.targetItem.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.targetItem.description}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{report.targetItem.category}</Badge>
                      <Badge variant="outline">{report.targetItem.condition}</Badge>
                      <Badge
                        variant={report.targetItem.status === 'AVAILABLE' ? 'default' : 'secondary'}
                      >
                        {report.targetItem.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${ADMIN_BASE_PATH}/items/${report.targetItem.id}`}>
                        Voir l'objet
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter */}
          <Card>
            <CardHeader>
              <CardTitle>Signalé par</CardTitle>
              <CardDescription>Utilisateur qui a fait le signalement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.reporter ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={report.reporter.avatarUrl || undefined} />
                      <AvatarFallback>
                        {report.reporter.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{report.reporter.displayName}</div>
                      <div className="text-sm text-muted-foreground">{report.reporter.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/users/${report.reporter.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le profil
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Utilisateur anonyme</p>
              )}
            </CardContent>
          </Card>

          {/* Target User */}
          {report.targetUser && (
            <Card>
              <CardHeader>
                <CardTitle>Utilisateur signalé</CardTitle>
                <CardDescription>Utilisateur concerné par le signalement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={report.targetUser.avatarUrl || undefined} />
                    <AvatarFallback>
                      {report.targetUser.displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.targetUser.displayName}</span>
                      {report.targetUser.ban && (
                        <Badge variant="destructive" className="text-xs">
                          <Ban className="w-3 h-3 mr-1" />
                          Banni
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{report.targetUser.email}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${ADMIN_BASE_PATH}/users/${report.targetUser.id}`}>
                    <User className="w-4 h-4 mr-2" />
                    Voir le profil
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{report.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary">{REPORT_TYPE_LABELS[report.type] || report.type}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span>{format(new Date(report.createdAt), 'PP', { locale: fr })}</span>
              </div>
              {report.resolvedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date de résolution</span>
                  <span>{format(new Date(report.resolvedAt), 'PP', { locale: fr })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!report.resolved && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => setResolveDialogOpen(true)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Résoudre le signalement
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre le signalement</DialogTitle>
            <DialogDescription>
              Marquer ce signalement comme résolu. Vous pouvez également bannir l'utilisateur
              signalé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Type:</strong> {REPORT_TYPE_LABELS[report.type] || report.type}
              </p>
              <p className="text-sm mt-2">
                <strong>Message:</strong> {report.message}
              </p>
            </div>

            {report.targetUser && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="banUser"
                  checked={banUser}
                  onCheckedChange={(checked) => setBanUser(checked as boolean)}
                />
                <Label htmlFor="banUser" className="text-sm">
                  Bannir l'utilisateur signalé ({report.targetUser.displayName})
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleResolve}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le signalement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce signalement ? Cette action est
              irréversible.
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


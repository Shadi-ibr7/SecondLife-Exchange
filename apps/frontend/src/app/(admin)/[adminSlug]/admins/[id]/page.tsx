/**
 * FICHIER: admins/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un administrateur pour l'admin.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Mail,
  Calendar,
  Activity,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Info,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default function AdminDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  // Simulation de données - à remplacer par une vraie API
  const admin = {
    id: id,
    email: 'admin@secondlife.com',
    displayName: 'Admin Principal',
    avatarUrl: null,
    role: 'SUPER_ADMIN',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isActive: true,
    actionsCount: 1250,
    recentActions: [
      { action: 'DELETE_USER', resource: 'User', resourceId: 'user123', date: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { action: 'BAN_USER', resource: 'User', resourceId: 'user456', date: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { action: 'UPDATE_ITEM', resource: 'Item', resourceId: 'item789', date: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    ],
  };

  const handleDelete = async () => {
    if (admin.role === 'SUPER_ADMIN') {
      toast.error('Impossible de supprimer un super administrateur');
      return;
    }
    try {
      toast.success('Administrateur supprimé avec succès');
      router.push(`/${ADMIN_BASE_PATH}/admins`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleResetPassword = async () => {
    try {
      toast.success('Un email de réinitialisation a été envoyé');
      setResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réinitialisation');
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return <Badge variant="destructive">Super Admin</Badge>;
    }
    return <Badge variant="default">Admin</Badge>;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_USER: 'Création utilisateur',
      UPDATE_USER: 'Mise à jour utilisateur',
      DELETE_USER: 'Suppression utilisateur',
      BAN_USER: 'Bannissement utilisateur',
      UNBAN_USER: 'Déban utilisateur',
      CREATE_ITEM: 'Création objet',
      UPDATE_ITEM: 'Mise à jour objet',
      DELETE_ITEM: 'Suppression objet',
      RESOLVE_REPORT: 'Résolution signalement',
    };
    return labels[action] || action;
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
              <h1 className="text-2xl font-medium mb-1">Détails administrateur</h1>
              {getRoleBadge(admin.role)}
            </div>
            <p className="text-muted-foreground">
              Gérer le compte et les permissions de cet administrateur
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setResetPasswordDialogOpen(true)}>
            <Key className="w-4 h-4 mr-2" />
            Réinitialiser le mot de passe
          </Button>
          {admin.role !== 'SUPER_ADMIN' && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Informations
              </CardTitle>
              <CardDescription>Détails du compte administrateur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={admin.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {admin.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{admin.displayName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{admin.email}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Rôle</h4>
                  {getRoleBadge(admin.role)}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Statut</h4>
                  {admin.isActive ? (
                    <Badge variant="default" className="flex items-center gap-1 w-fit">
                      <UserCheck className="w-3 h-3" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <UserX className="w-3 h-3" />
                      Inactif
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité récente
              </CardTitle>
              <CardDescription>Dernières actions effectuées par cet administrateur</CardDescription>
            </CardHeader>
            <CardContent>
              {admin.recentActions && admin.recentActions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admin.recentActions.map((action: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="secondary">{getActionLabel(action.action)}</Badge>
                        </TableCell>
                        <TableCell>{action.resource}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {action.resourceId}
                          </code>
                        </TableCell>
                        <TableCell>
                          {format(action.date, 'PPp', { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune action récente
                </p>
              )}
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${ADMIN_BASE_PATH}/logs?adminId=${admin.id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Voir tous les logs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actions totales</span>
                <Badge variant="secondary">{admin.actionsCount.toLocaleString()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                {admin.isActive ? (
                  <Badge variant="default">Actif</Badge>
                ) : (
                  <Badge variant="secondary">Inactif</Badge>
                )}
              </div>
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
                <span className="font-mono text-xs">{admin.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Créé le</span>
                <span>{format(admin.createdAt, 'PP', { locale: fr })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dernière connexion</span>
                <span>{format(admin.lastLogin, 'PPp', { locale: fr })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => setResetPasswordDialogOpen(true)}>
                <Key className="w-4 h-4 mr-2" />
                Réinitialiser le mot de passe
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/${ADMIN_BASE_PATH}/users/${admin.id}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Voir le profil utilisateur
                </Link>
              </Button>
              {admin.role !== 'SUPER_ADMIN' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer l'administrateur
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Security Alert */}
          {admin.role === 'SUPER_ADMIN' && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  Super Administrateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ce compte a des permissions complètes et ne peut pas être supprimé.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'administrateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est
              irréversible et supprimera également tous ses logs d'actions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{admin.displayName}</strong> ({admin.email}) sera supprimé de manière
              permanente.
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

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Un email de réinitialisation de mot de passe sera envoyé à{' '}
              <strong>{admin.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              L'administrateur devra utiliser le lien reçu par email pour définir un nouveau mot
              de passe.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleResetPassword}>
              <Key className="w-4 h-4 mr-2" />
              Envoyer l'email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


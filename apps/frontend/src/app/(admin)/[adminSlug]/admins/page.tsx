/**
 * FICHIER: admins/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des administrateurs pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Shield,
  UserPlus,
  Search,
  Mail,
  Calendar,
  Activity,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  Key,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default function AdminAdminsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    displayName: '',
    password: '',
  });

  // Simulation de données - à remplacer par une vraie API
  const admins = [
    {
      id: '1',
      email: 'admin@secondlife.com',
      displayName: 'Admin Principal',
      avatarUrl: null,
      role: 'SUPER_ADMIN',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isActive: true,
      actionsCount: 1250,
    },
    {
      id: '2',
      email: 'moderator@secondlife.com',
      displayName: 'Modérateur',
      avatarUrl: null,
      role: 'ADMIN',
      createdAt: new Date('2024-02-20'),
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isActive: true,
      actionsCount: 450,
    },
    {
      id: '3',
      email: 'support@secondlife.com',
      displayName: 'Support',
      avatarUrl: null,
      role: 'ADMIN',
      createdAt: new Date('2024-03-10'),
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isActive: false,
      actionsCount: 120,
    },
  ];

  const filteredAdmins = admins.filter((admin) =>
    admin.email.toLowerCase().includes(search.toLowerCase()) ||
    admin.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.displayName || !newAdmin.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      // Simulation - à remplacer par une vraie API
      toast.success('Administrateur créé avec succès');
      setCreateDialogOpen(false);
      setNewAdmin({ email: '', displayName: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    try {
      // Simulation - à remplacer par une vraie API
      toast.success('Administrateur supprimé avec succès');
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return <Badge variant="destructive">Super Admin</Badge>;
    }
    return <Badge variant="default">Admin</Badge>;
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
            <h1 className="text-2xl font-medium mb-1">Gestion des administrateurs</h1>
            <p className="text-muted-foreground">
              Gérer les comptes administrateurs et leurs permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un administrateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total administrateurs</CardDescription>
            <CardTitle className="text-2xl">{admins.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Actifs</CardDescription>
            <CardTitle className="text-2xl">
              {admins.filter((a) => a.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Super admins</CardDescription>
            <CardTitle className="text-2xl">
              {admins.filter((a) => a.role === 'SUPER_ADMIN').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Actions totales</CardDescription>
            <CardTitle className="text-2xl">
              {admins.reduce((sum, a) => sum + a.actionsCount, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un administrateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des administrateurs</CardTitle>
          <CardDescription>
            {filteredAdmins.length} administrateur{filteredAdmins.length !== 1 ? 's' : ''} trouvé{filteredAdmins.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead className="text-right">Opérations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={admin.avatarUrl || undefined} />
                        <AvatarFallback>
                          {admin.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{admin.displayName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(admin.role)}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(admin.lastLogin, 'PPp', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Activity className="w-4 h-4" />
                      {admin.actionsCount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/${ADMIN_BASE_PATH}/users/${admin.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAdmin(admin.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={admin.role === 'SUPER_ADMIN'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un administrateur</DialogTitle>
            <DialogDescription>
              Créer un nouveau compte administrateur avec accès au panneau d'administration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                value={newAdmin.displayName}
                onChange={(e) => setNewAdmin({ ...newAdmin, displayName: e.target.value })}
                placeholder="Nom de l'administrateur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="Mot de passe sécurisé"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateAdmin}>
              <UserPlus className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


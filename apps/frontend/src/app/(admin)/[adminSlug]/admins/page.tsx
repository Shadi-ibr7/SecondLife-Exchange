'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  UserPlus,
  Search,
  Mail,
  Activity,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  Eye,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import Link from 'next/link';

function AdminStatsCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="h-[90.238px] pt-[17.138px] px-[17.138px] pb-[1.155px]">
      <CardContent className="flex items-center gap-[11.997px] p-0">
        <div className="bg-muted rounded-[6px] size-[39.996px] flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col gap-[1.984px]">
          <p className="text-sm text-muted-foreground font-normal leading-[20px] tracking-[-0.1504px]">
            {title}
          </p>
          <p className="text-2xl font-normal text-foreground leading-[32px] tracking-[0.0703px]">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAdminsPage() {
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

  // TODO: Replace with real API call when endpoint is available
  // const { data: adminsData, isLoading } = useQuery({
  //   queryKey: ['admin-admins', search],
  //   queryFn: () => adminApi.getAdmins(search || undefined),
  // });

  // Mock data for now
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

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email.toLowerCase().includes(search.toLowerCase()) ||
      admin.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.displayName || !newAdmin.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      // TODO: Replace with real API call
      // await adminApi.createAdmin(newAdmin);
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
      // TODO: Replace with real API call
      // await adminApi.deleteAdmin(selectedAdmin);
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
      return (
        <Badge className="bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]">
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:bg-[rgba(217,160,85,0.1)] dark:text-[#d9a055]">
        Admin
      </Badge>
    );
  };

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.isActive).length;
  const superAdmins = admins.filter((a) => a.role === 'SUPER_ADMIN').length;
  const totalActions = admins.reduce((sum, a) => sum + a.actionsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="admin-page-title">Gestion des administrateurs</h1>
          <p className="admin-page-description">
            Gérer les comptes administrateurs et leurs permissions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full md:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un administrateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 h-[90.238px]">
        <AdminStatsCard title="Total administrateurs" value={totalAdmins} icon={<Users className="w-5 h-5 text-primary" />} />
        <AdminStatsCard title="Actifs" value={activeAdmins} icon={<UserCheck className="w-5 h-5 text-primary" />} />
        <AdminStatsCard title="Super admins" value={superAdmins} icon={<Shield className="w-5 h-5 text-primary" />} />
        <AdminStatsCard title="Actions totales" value={totalActions.toLocaleString()} icon={<Activity className="w-5 h-5 text-primary" />} />
      </div>

      {/* Search */}
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[90.293px]">
        <CardContent className="p-0 flex items-center gap-4 h-[39.996px]">
          <div className="flex-1 relative h-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un administrateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-full bg-input-background border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[499.829px]">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-normal text-foreground mb-1">Liste des administrateurs</h3>
            <p className="text-sm text-muted-foreground font-normal">
              {filteredAdmins.length} administrateur{filteredAdmins.length !== 1 ? 's' : ''} trouvé{filteredAdmins.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border h-[44.56px]">
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Administrateur
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Rôle
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Statut
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Dernière connexion
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Actions
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-sm font-bold text-muted-foreground">
                    Opérations
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-sm text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      Aucun administrateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin, index) => {
                    const isLast = index === filteredAdmins.length - 1;
                    return (
                      <tr
                        key={admin.id}
                        className={`${
                          !isLast
                            ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]'
                            : ''
                        } h-[65.108px]`}
                      >
                        <td className="px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={admin.avatarUrl || undefined} />
                              <AvatarFallback>
                                {admin.displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                                {admin.displayName}
                              </p>
                              <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] leading-4 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {admin.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4">{getRoleBadge(admin.role)}</td>
                        <td className="px-4">
                          {admin.isActive ? (
                            <Badge className="bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45] flex items-center gap-1 w-fit">
                              <UserCheck className="w-3 h-3" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge className="bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:bg-[rgba(217,160,85,0.1)] dark:text-[#d9a055] flex items-center gap-1 w-fit">
                              <UserX className="w-3 h-3" />
                              Inactif
                            </Badge>
                          )}
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {format(admin.lastLogin, 'dd MMM yyyy HH:mm', { locale: fr })}
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5 flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {admin.actionsCount.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              asChild
                            >
                              <Link href={`/${ADMIN_BASE_PATH}/admins/${admin.id}`}>
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              asChild
                            >
                              <Link href={`/${ADMIN_BASE_PATH}/admins/${admin.id}/edit`}>
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px] text-destructive"
                              onClick={() => {
                                setSelectedAdmin(admin.id);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={admin.role === 'SUPER_ADMIN'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
              Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est irréversible
              et supprimera également tous ses logs d'actions.
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

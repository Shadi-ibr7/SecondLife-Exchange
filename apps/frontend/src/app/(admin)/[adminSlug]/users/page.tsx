/**
 * FICHIER: users/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des utilisateurs pour l'admin.
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Ban, Mail, UserCheck, Filter } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers(page, 20, search || undefined),
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ['admin-user-analytics'],
    queryFn: () => adminApi.getUserAnalytics(),
    retry: 1,
  });

  const handleBan = async (user: any) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleUnban = async (userId: string) => {
    try {
      await adminApi.unbanUser(userId);
      toast.success('Utilisateur débanni avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du débannissement');
    }
  };

  const confirmBan = async () => {
    if (!selectedUser) return;
    try {
      await adminApi.banUser(selectedUser.id, banReason || undefined);
      toast.success('Utilisateur banni avec succès');
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du bannissement');
    }
  };

  const getStatusBadge = (user: any) => {
    if (user.ban) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.2)] dark:bg-[rgba(217,160,85,0.2)] text-[#d9a055] dark:text-[#d9a055]">
          Banni
        </span>
      );
    }
    // TODO: Ajouter logique pour "En attente" si nécessaire
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
        Actif
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Gestion des utilisateurs</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - selon Figma */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="admin-page-title">Gestion des utilisateurs</h1>
          <p className="admin-page-description">Gérer les utilisateurs de la plateforme</p>
        </div>
        <Button className="bg-[#1a1a1c] dark:bg-[#1a1a1c] hover:bg-[#1a1a1c]/80 text-[#ececed] border-0 h-[40px] px-4 rounded-md">
          <Mail className="w-4 h-4 mr-2" />
          Envoyer un email
        </Button>
      </div>

      {/* Stats Cards - 4 cartes selon Figma (hauteur 90px) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              Total utilisateurs
            </p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {userAnalytics?.total?.toLocaleString() || data?.total?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              Actifs ce mois
            </p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {userAnalytics?.active?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              Nouveaux (30j)
            </p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {(() => {
                // Calculer les nouveaux utilisateurs des 30 derniers jours
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return (
                  data?.users?.filter(
                    (u: any) => new Date(u.createdAt) >= thirtyDaysAgo
                  ).length || 0
                );
              })()}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">Bannis</p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {userAnalytics?.banned?.toLocaleString() ||
                data?.users?.filter((u: any) => u.ban).length ||
                0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar - selon Figma avec bouton Filtrer */}
      <Card>
        <CardContent className="pt-[25px] px-[25px] pb-[1px]">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f6f73] dark:text-[#9a9a9d]" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-[#1a1a1c] dark:bg-[#1a1a1c] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#1e1e20] dark:text-[#ececed] h-[40px] rounded-md"
              />
            </div>
            <Button
              variant="outline"
              className="bg-[#1a1a1c] dark:bg-[#1a1a1c] hover:bg-[#1a1a1c]/80 border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#ececed] h-[40px] px-4 rounded-md"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table - selon Figma */}
      <Card>
        <CardContent className="pt-[25px] px-[25px] pb-[1px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[44.5px]">
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                      Utilisateur
                    </p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Email</p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Statut</p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Objets</p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Échanges</p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                      Inscription
                    </p>
                  </th>
                  <th className="text-right px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Actions</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((user: any, index: number) => {
                  const isLast = index === (data?.users?.length || 0) - 1;
                  return (
                    <tr
                      key={user.id}
                      className={`${
                        !isLast
                          ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]'
                          : ''
                      } h-[65px]`}
                    >
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 bg-[#1a1a1c] dark:bg-[#1a1a1c]">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="text-[#9a9a9d] text-xs">
                              {user.displayName
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            {user.displayName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-4">{getStatusBadge(user)}</td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                          {user._count?.items || 0}
                        </p>
                      </td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                          {(user._count?.exchangesRequested || 0) +
                            (user._count?.exchangesResponded || 0)}
                        </p>
                      </td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            asChild
                          >
                            <Link href={`/${ADMIN_BASE_PATH}/users/${user.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          {user.ban ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleUnban(user.id)}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleBan(user)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bannir l'utilisateur</DialogTitle>
            <DialogDescription>
              Bannir {selectedUser?.displayName} ({selectedUser?.email})
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
            <Button variant="destructive" onClick={confirmBan}>
              Bannir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


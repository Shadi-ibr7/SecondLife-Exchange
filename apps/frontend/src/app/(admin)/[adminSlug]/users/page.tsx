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
import { Search, Eye, Ban, Mail, UserCheck } from 'lucide-react';
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(220,38,38,0.1)] dark:bg-[rgba(239,68,68,0.1)] text-[#dc2626] dark:text-[#ef4444]">
          Banni
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#1b3828] dark:text-[#2d5a45]">
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
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-[#1e1e20] dark:text-[#ececed]">Gestion des utilisateurs</h1>
        <p className="text-base text-[#6f6f73] dark:text-[#9a9a9d]">Gérer les utilisateurs de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal mb-1">Total utilisateurs</p>
          <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed]">{data?.total || 0}</p>
        </div>
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal mb-1">Utilisateurs bannis</p>
          <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed]">
            {data?.users?.filter((u: any) => u.ban).length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal mb-1">Page actuelle</p>
          <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed]">{page}</p>
        </div>
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal mb-1">Total pages</p>
          <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed]">{data?.totalPages || 0}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
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
              className="pl-10 bg-white dark:bg-[#1a1a1c] border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] text-[#1e1e20] dark:text-[#ececed]"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
        <div className="mb-6">
          <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] mb-1">Liste des utilisateurs</h3>
          <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
            {data?.total || 0} utilisateur{data?.total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
                  <th className="text-left py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Objets</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Échanges</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Date d'inscription</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((user: any) => (
                  <tr key={user.id} className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] last:border-0">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed]">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-normal text-[#1e1e20] dark:text-[#ececed]">{user.email}</td>
                    <td className="py-4 px-4">{getStatusBadge(user)}</td>
                    <td className="py-4 px-4 text-sm font-normal text-[#1e1e20] dark:text-[#ececed]">{user._count?.items || 0}</td>
                    <td className="py-4 px-4 text-sm font-normal text-[#1e1e20] dark:text-[#ececed]">
                      {(user._count?.exchangesRequested || 0) +
                        (user._count?.exchangesResponded || 0)}
                    </td>
                    <td className="py-4 px-4 text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d]">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
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
                            onClick={() => handleUnban(user.id)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBan(user)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
        </div>
      </div>

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


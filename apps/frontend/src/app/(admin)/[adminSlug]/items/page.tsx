/**
 * FICHIER: items/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des objets pour l'admin.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Archive, Trash2, Eye, Filter, Edit } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

export default function AdminItemsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-items', page, categoryFilter, statusFilter, search],
    queryFn: () =>
      adminApi.getItems(page, 20, {
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const { data: itemAnalytics } = useQuery({
    queryKey: ['admin-item-analytics'],
    queryFn: () => adminApi.getItemAnalytics(),
    retry: 1,
  });

  const handleArchive = async (itemId: string) => {
    try {
      await adminApi.archiveItem(itemId);
      toast.success('Objet archivé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'archivage');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objet ?')) return;
    try {
      await adminApi.deleteItem(itemId);
      toast.success('Objet supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AVAILABLE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
          Disponible
        </span>
      );
    }
    if (status === 'TRADED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(45,90,69,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:text-[#2d5a45]">
          Échangé
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.1)] dark:bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:text-[#d9a055]">
          En attente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Gestion des objets</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="admin-page-title">Gestion des objets</h1>
        <p className="admin-page-description">Gérer les objets publiés sur la plateforme</p>
      </div>

      {/* Stats Cards - 4 cartes selon Figma (hauteur 90px) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              Total objets
            </p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {itemAnalytics?.total?.toLocaleString() || data?.total?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              Disponibles
            </p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {(() => {
                const available = itemAnalytics?.byStatus?.find((s: any) => s.status === 'AVAILABLE');
                return available?.count?.toLocaleString() ||
                  data?.items?.filter((i: any) => i.status === 'AVAILABLE').length ||
                  0;
              })()}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              En attente
            </p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {(() => {
                const pending = itemAnalytics?.byStatus?.find((s: any) => s.status === 'PENDING');
                return pending?.count?.toLocaleString() ||
                  data?.items?.filter((i: any) => i.status === 'PENDING').length ||
                  0;
              })()}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[90px]">
          <CardContent className="pt-[17px] px-[17px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">Échangés</p>
            <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-8">
              {(() => {
                const traded = itemAnalytics?.byStatus?.find((s: any) => s.status === 'TRADED');
                return traded?.count?.toLocaleString() ||
                  data?.items?.filter((i: any) => i.status === 'TRADED').length ||
                  0;
              })()}
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
                placeholder="Rechercher par titre, catégorie ou propriétaire..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-[#fafafa] dark:bg-[#1a1a1c] border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] text-[#1e1e20] dark:text-[#ececed] h-[40px] rounded-md"
              />
            </div>
            <Button
              variant="outline"
              className="bg-[#f7f7f8] dark:bg-[#1a1a1c] hover:bg-[#f7f7f8]/80 dark:hover:bg-[#1a1a1c]/80 border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] text-[#1e1e20] dark:text-[#ececed] h-[40px] px-4 rounded-md"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table - selon Figma */}
      <Card>
        <CardContent className="pt-[25px] px-[25px] pb-[1px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[44.5px]">
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                      Image
                    </p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Titre</p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                      Catégorie
                    </p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                      Propriétaire
                    </p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Statut</p>
                  </th>
                  <th className="text-left px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Date</p>
                  </th>
                  <th className="text-right px-4 py-3">
                    <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Actions</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((item: any, index: number) => {
                  const isLast = index === (data?.items?.length || 0) - 1;
                  return (
                    <tr
                      key={item.id}
                      className={`${
                        !isLast
                          ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]'
                          : ''
                      } h-[81px]`}
                    >
                      <td className="px-4">
                        {item.photos?.[0] ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden">
                            <Image
                              src={item.photos[0].url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-[#f7f7f8] dark:bg-[#1a1a1c] flex items-center justify-center">
                            <span className="text-xs text-[#6f6f73] dark:text-[#9a9a9d]">N/A</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                          {item.title}
                        </p>
                      </td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {item.category}
                        </p>
                      </td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {item.owner?.displayName || 'N/A'}
                        </p>
                      </td>
                      <td className="px-4">{getStatusBadge(item.status)}</td>
                      <td className="px-4">
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
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
                            <Link href={`/${ADMIN_BASE_PATH}/items/${item.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => handleArchive(item.id)}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
    </div>
  );
}


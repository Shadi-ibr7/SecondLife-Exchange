/**
 * FICHIER: exchanges/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des échanges pour l'admin.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ArrowLeftRight, Filter, Eye, Trash2, MessageSquare, Download, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminExchangesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exchanges', page, statusFilter],
    queryFn: () =>
      adminApi.getExchanges(page, 20, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const { data: exchangeAnalytics } = useQuery({
    queryKey: ['admin-exchange-analytics'],
    queryFn: () => adminApi.getExchangeAnalytics(),
    retry: 1,
  });

  const handleDelete = async (exchangeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet échange ?')) return;
    try {
      await adminApi.deleteExchange(exchangeId);
      toast.success('Échange supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-exchanges'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(45,90,69,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:text-[#2d5a45]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Complété
        </span>
      );
    }
    if (status === 'PENDING' || status === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.1)] dark:bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:text-[#d9a055]">
          <Clock className="w-3.5 h-3.5" />
          En attente
        </span>
      );
    }
    if (status === 'CANCELLED' || status === 'DECLINED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(239,68,68,0.1)] dark:bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:text-[#ef4444]">
          <XCircle className="w-3.5 h-3.5" />
          {status === 'CANCELLED' ? 'Annulé' : 'Refusé'}
        </span>
      );
    }
    // Pour les litiges (DISPUTE) - selon Figma
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(239,68,68,0.1)] dark:bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:text-[#ef4444]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Litige
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Gestion des échanges</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="admin-page-title">Gestion des échanges</h1>
        <p className="admin-page-description">Suivi et administration des transactions entre utilisateurs</p>
      </div>

      {/* Stats Cards - 5 cartes selon Figma (grille 2x3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="h-[74px]">
          <CardContent className="pt-[13px] px-[13px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4">
              Total échanges
            </p>
            <p className="text-xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7">
              {exchangeAnalytics?.total?.toLocaleString() || data?.total?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[74px]">
          <CardContent className="pt-[13px] px-[13px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4">
              Complétés
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7">
                {(() => {
                  const completed = exchangeAnalytics?.byStatus?.find(
                    (s: any) => s.status === 'COMPLETED'
                  );
                  return (
                    completed?.count?.toLocaleString() ||
                    data?.exchanges?.filter((e: any) => e.status === 'COMPLETED').length ||
                    0
                  );
                })()}
              </p>
              <p className="text-xs text-[#096] dark:text-[#096] leading-4">
                {(() => {
                  const total = exchangeAnalytics?.total || data?.total || 0;
                  const completed =
                    exchangeAnalytics?.byStatus?.find((s: any) => s.status === 'COMPLETED')
                      ?.count ||
                    data?.exchanges?.filter((e: any) => e.status === 'COMPLETED').length ||
                    0;
                  return total > 0 ? Math.round((completed / total) * 100) : 0;
                })()}
                %
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="h-[74px]">
          <CardContent className="pt-[13px] px-[13px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4">
              En attente
            </p>
            <p className="text-xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7">
              {(() => {
                const pending = exchangeAnalytics?.byStatus?.find(
                  (s: any) => s.status === 'PENDING' || s.status === 'ACCEPTED'
                );
                return (
                  pending?.count?.toLocaleString() ||
                  data?.exchanges?.filter(
                    (e: any) => e.status === 'PENDING' || e.status === 'ACCEPTED'
                  ).length ||
                  0
                );
              })()}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[74px]">
          <CardContent className="pt-[13px] px-[13px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4">
              Litiges
            </p>
            <p className="text-xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7">
              {data?.exchanges?.filter((e: any) => e.status === 'DISPUTE').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="h-[74px]">
          <CardContent className="pt-[13px] px-[13px] pb-[1px] h-full flex flex-col gap-1">
            <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4">
              Valeur totale
            </p>
            <p className="text-xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7">
              {(() => {
                // Calculer la valeur totale des échanges complétés
                const completedExchanges =
                  data?.exchanges?.filter((e: any) => e.status === 'COMPLETED') || [];
                const totalValue = completedExchanges.reduce((sum: number, e: any) => {
                  // Estimer la valeur (à adapter selon votre modèle de données)
                  return sum + (e.estimatedValue || 0);
                }, 0);
                return totalValue > 0 ? `${totalValue.toLocaleString()}€` : '0€';
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar avec Filtres - selon Figma */}
      <Card>
        <CardContent className="pt-[25px] px-[25px] pb-[1px]">
          <div className="flex flex-col gap-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f6f73] dark:text-[#9a9a9d]" />
              <Input
                placeholder="Rechercher un échange..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-[#1a1a1c] dark:bg-[#1a1a1c] border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#1e1e20] dark:text-[#ececed] h-[40px] rounded-md"
              />
            </div>
            {/* Filtres boutons */}
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={
                  statusFilter === 'all'
                    ? 'bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#ececed] dark:text-[#ececed] border-0 h-8 px-3 rounded-md'
                    : 'border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#ececed] dark:text-[#ececed] h-8 px-3 rounded-md'
                }
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('COMPLETED')}
                className={
                  statusFilter === 'COMPLETED'
                    ? 'bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#ececed] dark:text-[#ececed] border-0 h-8 px-3 rounded-md'
                    : 'border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#ececed] dark:text-[#ececed] h-8 px-3 rounded-md'
                }
              >
                Complétés
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
                className={
                  statusFilter === 'PENDING'
                    ? 'bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#ececed] dark:text-[#ececed] border-0 h-8 px-3 rounded-md'
                    : 'border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#ececed] dark:text-[#ececed] h-8 px-3 rounded-md'
                }
              >
                En attente
              </Button>
              <Button
                variant={statusFilter === 'DISPUTE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('DISPUTE')}
                className={
                  statusFilter === 'DISPUTE'
                    ? 'bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#ececed] dark:text-[#ececed] border-0 h-8 px-3 rounded-md'
                    : 'border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#ececed] dark:text-[#ececed] h-8 px-3 rounded-md'
                }
              >
                Litiges
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[rgba(255,255,255,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#ececed] dark:text-[#ececed] h-8 px-3 rounded-md"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exchanges Table - selon Figma */}
      <Card>
        <CardContent className="pt-[25px] px-[25px] pb-[1px]">
          <div className="mb-4">
            <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] leading-6 mb-1">
              Liste des échanges
            </h3>
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              {data?.total || 0} échange{data?.total !== 1 ? 's' : ''} trouvé{data?.total !== 1 ? 's' : ''}
            </p>
          </div>
          {data?.exchanges?.length === 0 ? (
            <div className="text-center py-8 text-[#6f6f73] dark:text-[#9a9a9d]">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun échange trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[44.5px]">
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">De</p>
                    </th>
                    <th className="text-left px-4 py-3 w-[65px]">
                      {/* Icône flèche */}
                    </th>
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Vers</p>
                    </th>
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                        Objets échangés
                      </p>
                    </th>
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Statut</p>
                    </th>
                    <th className="text-right px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Actions</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.exchanges?.map((exchange: any, index: number) => {
                    const isLast = index === (data?.exchanges?.length || 0) - 1;
                    return (
                      <tr
                        key={exchange.id}
                        className={`${
                          !isLast
                            ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]'
                            : ''
                        } h-[77px]`}
                      >
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 bg-[#1a1a1c] dark:bg-[#1a1a1c]">
                              <AvatarImage src={exchange.requester?.avatarUrl || undefined} />
                              <AvatarFallback className="text-[#9a9a9d] text-xs">
                                {exchange.requester?.displayName
                                  ?.split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                              {exchange.requester?.displayName || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a1a1c] dark:bg-[#1a1a1c]">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-[#9a9a9d] dark:text-[#9a9a9d]" />
                          </div>
                        </td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 bg-[#1a1a1c] dark:bg-[#1a1a1c]">
                              <AvatarImage src={exchange.responder?.avatarUrl || undefined} />
                              <AvatarFallback className="text-[#9a9a9d] text-xs">
                                {exchange.responder?.displayName
                                  ?.split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                              {exchange.responder?.displayName || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                              {exchange.requestedItem?.title || exchange.requestedItemTitle || '-'}
                            </p>
                            <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                              ↔ {exchange.offeredItem?.title || exchange.offeredItemTitle || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4">{getStatusBadge(exchange.status)}</td>
                        <td className="px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            asChild
                          >
                            <Link href={`/${ADMIN_BASE_PATH}/exchanges/${exchange.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
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


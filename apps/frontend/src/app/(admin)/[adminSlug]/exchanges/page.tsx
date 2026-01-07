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
import { Search, ArrowLeftRight, Filter, Eye, Trash2, MessageSquare } from 'lucide-react';
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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exchanges', page, statusFilter],
    queryFn: () =>
      adminApi.getExchanges(page, 20, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
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
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      PENDING: { variant: 'default', label: 'En attente' },
      ACCEPTED: { variant: 'default', label: 'Accepté' },
      COMPLETED: { variant: 'secondary', label: 'Complété' },
      CANCELLED: { variant: 'destructive', label: 'Annulé' },
      DECLINED: { variant: 'destructive', label: 'Refusé' },
    };
    const config = variants[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Gestion des échanges</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium mb-1">Gestion des échanges</h1>
        <p className="text-muted-foreground">Gérer les échanges entre utilisateurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total échanges</CardDescription>
            <CardTitle className="text-2xl">{data?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>En attente</CardDescription>
            <CardTitle className="text-2xl">
              {data?.exchanges?.filter((e: any) => e.status === 'PENDING').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Complétés</CardDescription>
            <CardTitle className="text-2xl">
              {data?.exchanges?.filter((e: any) => e.status === 'COMPLETED').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Page actuelle</CardDescription>
            <CardTitle className="text-2xl">{page}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="ACCEPTED">Accepté</SelectItem>
                <SelectItem value="COMPLETED">Complété</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="DECLINED">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exchanges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des échanges</CardTitle>
          <CardDescription>
            {data?.total || 0} échange{data?.total !== 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.exchanges?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun échange trouvé</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Demandeur</TableHead>
                    <TableHead>Objet demandé</TableHead>
                    <TableHead>Répondeur</TableHead>
                    <TableHead>Objet offert</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.exchanges?.map((exchange: any) => (
                    <TableRow key={exchange.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={exchange.requester?.avatarUrl || undefined} />
                            <AvatarFallback>
                              {exchange.requester?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {exchange.requester?.displayName || '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {exchange.requester?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{exchange.requestedItemTitle}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={exchange.responder?.avatarUrl || undefined} />
                            <AvatarFallback>
                              {exchange.responder?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {exchange.responder?.displayName || '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {exchange.responder?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{exchange.offeredItemTitle}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(exchange.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          {exchange._count?.messages || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(exchange.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        {exchange.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Complété: {new Date(exchange.completedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/${ADMIN_BASE_PATH}/exchanges/${exchange.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(exchange.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


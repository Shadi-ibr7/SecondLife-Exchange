/**
 * FICHIER: exchanges/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des échanges pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeftRight, Filter } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
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

export default function AdminExchangesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Note: Cette page nécessiterait un endpoint spécifique pour les échanges
  // Pour l'instant, on affiche une page de base
  const { data, isLoading } = useQuery({
    queryKey: ['admin-exchanges', page, statusFilter],
    queryFn: async () => {
      // TODO: Créer l'endpoint admin pour les échanges
      return { exchanges: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    },
  });

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
            <CardTitle className="text-2xl">-</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Complétés</CardDescription>
            <CardTitle className="text-2xl">-</CardTitle>
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
              <p className="text-sm mt-2">
                Cette fonctionnalité nécessite l'implémentation de l'endpoint admin pour les échanges
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Objet demandé</TableHead>
                  <TableHead>Répondeur</TableHead>
                  <TableHead>Objet offert</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.exchanges?.map((exchange: any) => (
                  <TableRow key={exchange.id}>
                    <TableCell>{exchange.requester?.displayName || '-'}</TableCell>
                    <TableCell>{exchange.requestedItemTitle}</TableCell>
                    <TableCell>{exchange.responder?.displayName || '-'}</TableCell>
                    <TableCell>{exchange.offeredItemTitle}</TableCell>
                    <TableCell>{getStatusBadge(exchange.status)}</TableCell>
                    <TableCell>
                      {new Date(exchange.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


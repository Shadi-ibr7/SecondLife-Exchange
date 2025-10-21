'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExchangeList } from '@/components/exchanges/ExchangeList';
import { exchangesApi } from '@/lib/exchanges.api';
import { ExchangeStatus, ListExchangesParams } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { usePagination } from '@/hooks/usePagination';
import { useQueryParams } from '@/hooks/useQueryParams';
import { Filter, RefreshCw } from 'lucide-react';
import ProtectedRoute from '../(auth)/protected';

const STATUS_OPTIONS: { value: ExchangeStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'DECLINED', label: 'Refusé' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
];

function ExchangesPageContent() {
  const { params, updateParams, resetParams } = useQueryParams();
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus | ''>('');
  const [sortBy, setSortBy] = useState(params.sort || '-createdAt');

  const queryParams = {
    page:
      typeof params.page === 'number'
        ? params.page
        : parseInt(String(params.page)) || 1,
    limit:
      typeof params.limit === 'number'
        ? params.limit
        : parseInt(String(params.limit)) || 20,
    status: statusFilter || undefined,
    sort: sortBy,
  };

  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
  } = usePagination({
    total: 0,
    limit: queryParams.limit,
    initialPage: queryParams.page,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exchanges', queryParams],
    queryFn: () => exchangesApi.listMyExchanges(queryParams),
    placeholderData: (previousData) => previousData,
  });

  const handleStatusChange = (status: ExchangeStatus | '') => {
    setStatusFilter(status);
    updateParams({ page: 1 } as any);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateParams({ sort, page: 1 } as any);
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage } as any);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setSortBy('-createdAt');
    resetParams();
  };

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        <div className="text-center">
          <p className="mb-4">Erreur lors du chargement des échanges</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Mes échanges</h1>
              <p className="text-muted-foreground">
                Gérez vos propositions d'échange et suivez leur progression
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
              <CardDescription>
                Affinez votre recherche d'échanges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Filtre par statut */}
                <div className="min-w-48 flex-1">
                  <label className="mb-2 block text-sm font-medium">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as ExchangeStatus | '')
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tri */}
                <div className="min-w-48 flex-1">
                  <label className="mb-2 block text-sm font-medium">
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="-createdAt">Plus récent</option>
                    <option value="createdAt">Plus ancien</option>
                    <option value="status">Statut</option>
                  </select>
                </div>

                {/* Bouton reset */}
                <div className="flex items-end">
                  <Button onClick={handleResetFilters} variant="outline">
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Résultats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {data && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total} échange{data.total > 1 ? 's' : ''} trouvé
                {data.total > 1 ? 's' : ''}
              </p>
              {data.total > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} sur {data.totalPages}
                  </span>
                </div>
              )}
            </div>
          )}

          <ExchangeList exchanges={data?.items || []} isLoading={isLoading} />

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex justify-center space-x-2"
            >
              <Button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
                variant="outline"
              >
                Précédent
              </Button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    variant={page === data.page ? 'default' : 'outline'}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages}
                variant="outline"
              >
                Suivant
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ExchangesPage() {
  return (
    <ProtectedRoute>
      <ExchangesPageContent />
    </ProtectedRoute>
  );
}

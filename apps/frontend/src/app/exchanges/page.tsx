'use client';

/**
 * FICHIER: app/exchanges/page.tsx
 *
 * DESCRIPTION:
 * Tableau de bord "Mes échanges". Cette page permet de suivre et filtrer
 * l'ensemble des échanges initiés ou reçus par l'utilisateur.
 *
 * FONCTIONNALITÉS:
 * - Chargement paginé des échanges via exchangesApi.listMyExchanges
 * - Filtres (statut + tri) synchronisés avec l'URL (useQueryParams)
 * - Statistiques rapides (en cours, terminés, total affiché)
 * - Composant ExchangeList pour le rendu détaillé
 * - Pagination contrôlée par boutons Précédent/Suivant
 *
 * UX:
 * - Section hero présentant l'espace d'échanges
 * - Cartes statistiques animées (Framer Motion)
 * - Carte de filtres avec bouton Réinitialiser
 * - ProtectedRoute pour restreindre l'accès aux utilisateurs connectés
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExchangeList } from '@/components/exchanges/ExchangeList';
import { exchangesApi } from '@/lib/exchanges.api';
import { ExchangeStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useQueryParams } from '@/hooks/useQueryParams';
import {
  CheckCircle,
  Filter,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted text-destructive">
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

  const stats = useMemo(() => {
    const items = data?.items || [];
    return [
      {
        label: 'Échanges en cours',
        value: items.filter((exchange) => exchange.status === 'PENDING').length,
        tone: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        icon: MessageCircle,
      },
      {
        label: 'Échanges terminés',
        value: items.filter((exchange) => exchange.status === 'COMPLETED')
          .length,
        tone: 'border-green-500/30 bg-green-500/10 text-green-500',
        icon: CheckCircle,
      },
      {
        label: 'Total affiché',
        value: items.length,
        tone: 'border-primary/30 bg-primary/10 text-primary',
        icon: Sparkles,
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary/15 via-background to-background">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-5xl flex-col gap-6 text-center"
          >
            <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Espace échanges
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold md:text-5xl">Mes échanges</h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Retrouvez vos propositions, suivez les discussions et complétez
                vos échanges en toute simplicité.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="outline" className="rounded-full px-4 py-1">
                {data?.total || 0} échange{data && data.total > 1 ? 's' : ''}
              </Badge>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Statistiques rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="border-border/40 bg-card/60 backdrop-blur-sm"
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm ${stat.tone}`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-10"
        >
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Filter className="h-5 w-5 text-primary" />
                    Filtrer vos échanges
                  </CardTitle>
                  <CardDescription>
                    Affinez la liste selon le statut ou la date
                  </CardDescription>
                </div>
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                >
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as ExchangeStatus | '')
                    }
                    className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="-createdAt">Plus récent</option>
                    <option value="createdAt">Plus ancien</option>
                    <option value="status">Statut</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Résultats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {data?.total || 0} échange{data && data.total > 1 ? 's' : ''}{' '}
              trouvé{data && data.total > 1 ? 's' : ''}
            </p>
            {data?.totalPages && data.totalPages > 0 && (
              <span className="text-sm text-muted-foreground">
                Page {data.page} sur {data.totalPages}
              </span>
            )}
          </div>

          <ExchangeList exchanges={data?.items || []} isLoading={isLoading} />

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-10 flex flex-wrap justify-center gap-3"
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

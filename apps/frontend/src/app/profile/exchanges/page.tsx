'use client';

/**
 * FICHIER: app/profile/exchanges/page.tsx
 *
 * DESCRIPTION:
 * Page "Historique des échanges" accessible depuis le profil utilisateur.
 * Affiche tous les échanges de l'utilisateur avec filtres par statut et type.
 *
 * FONCTIONNALITÉS:
 * - Tabs pour filtrer: Tous / En cours / Terminés / Annulés
 * - Filtre par type: Proposés / Reçus / Tous
 * - Liste paginée avec composant ExchangeList
 * - Mobile-first, PWA-ready
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExchangeList } from '@/components/exchanges/ExchangeList';
import { exchangesApi } from '@/lib/exchanges.api';
import { ExchangeStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Filter,
  History,
  RefreshCw,
  Send,
  Inbox,
  XCircle,
} from 'lucide-react';
import ProtectedRoute from '../../(auth)/protected';

/** Options de filtre par statut */
const STATUS_TABS = [
  { value: '', label: 'Tous', icon: History },
  { value: 'PENDING', label: 'En cours', icon: Clock },
  { value: 'COMPLETED', label: 'Terminés', icon: CheckCircle },
  { value: 'CANCELLED,DECLINED', label: 'Annulés', icon: XCircle },
] as const;

/** Options de filtre par type */
const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous', icon: History },
  { value: 'sent', label: 'Proposés', icon: Send },
  { value: 'received', label: 'Reçus', icon: Inbox },
] as const;

function ExchangeHistoryContent() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'sent' | 'received' | 'all'>(
    'all'
  );
  const [page, setPage] = useState(1);
  const limit = 10;

  // Construire les paramètres de requête
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit,
      sort: '-createdAt',
      type: typeFilter,
    };

    // Gérer le cas des statuts multiples (CANCELLED,DECLINED)
    if (statusFilter && !statusFilter.includes(',')) {
      params.status = statusFilter;
    }

    return params;
  }, [page, statusFilter, typeFilter]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exchange-history', queryParams],
    queryFn: () => exchangesApi.listMyExchanges(queryParams),
    placeholderData: (previousData) => previousData,
  });

  // Filtrer côté client pour les statuts multiples (CANCELLED + DECLINED)
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (statusFilter.includes(',')) {
      const statuses = statusFilter.split(',') as ExchangeStatus[];
      return data.items.filter((item) => statuses.includes(item.status));
    }
    return data.items;
  }, [data?.items, statusFilter]);

  // Statistiques rapides
  const stats = useMemo(() => {
    const items = data?.items || [];
    return {
      total: data?.total || 0,
      pending: items.filter((e) => e.status === 'PENDING').length,
      completed: items.filter((e) => e.status === 'COMPLETED').length,
      cancelled: items.filter(
        (e) => e.status === 'CANCELLED' || e.status === 'DECLINED'
      ).length,
    };
  }, [data]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleTypeChange = (value: 'sent' | 'received' | 'all') => {
    setTypeFilter(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-destructive">
            Erreur lors du chargement de l'historique
          </p>
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
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
          {/* Bouton retour */}
          <Link href="/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Historique des échanges
              </h1>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Retrouvez tous vos échanges passés et en cours
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="w-fit"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </motion.div>

        {/* Stats rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En cours</p>
                <p className="text-xl font-semibold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-500">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terminés</p>
                <p className="text-xl font-semibold">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annulés</p>
                <p className="text-xl font-semibold">{stats.cancelled}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tabs de statut */}
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Statut
                </label>
                <Tabs
                  value={statusFilter}
                  onValueChange={handleStatusChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    {STATUS_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="gap-1.5 text-xs md:text-sm"
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">
                          {tab.label.substring(0, 6)}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Filtre par type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Type d'échange
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={typeFilter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        handleTypeChange(
                          option.value as 'sent' | 'received' | 'all'
                        )
                      }
                      className="gap-1.5"
                    >
                      <option.icon className="h-3.5 w-3.5" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Résultats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} échange
              {filteredItems.length > 1 ? 's' : ''} trouvé
              {filteredItems.length > 1 ? 's' : ''}
            </p>
            {data?.totalPages && data.totalPages > 1 && (
              <span className="text-sm text-muted-foreground">
                Page {data.page} sur {data.totalPages}
              </span>
            )}
          </div>

          <ExchangeList exchanges={filteredItems} isLoading={isLoading} />

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap justify-center gap-2"
            >
              <Button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
                variant="outline"
                size="sm"
              >
                Précédent
              </Button>
              {/* Afficher max 5 pages autour de la page courante */}
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === data.totalPages ||
                    Math.abs(p - data.page) <= 2
                )
                .map((pageNum, idx, arr) => {
                  // Ajouter "..." si il y a un gap
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <span key={pageNum} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        onClick={() => handlePageChange(pageNum)}
                        variant={pageNum === data.page ? 'default' : 'outline'}
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    </span>
                  );
                })}
              <Button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages}
                variant="outline"
                size="sm"
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

export default function ExchangeHistoryPage() {
  return (
    <ProtectedRoute>
      <ExchangeHistoryContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ItemFilters } from '@/components/items/ItemFilters';
import { ItemGrid } from '@/components/items/ItemGrid';
import { itemsApi } from '@/lib/items.api';
import { useQueryParams } from '@/hooks/useQueryParams';
import { usePagination } from '@/hooks/usePagination';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';

function ExplorePageContent() {
  const { params, updateParams, resetParams } = useQueryParams();
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
  } = usePagination({
    total: 0, // Sera mis à jour par la requête
    limit: params.limit || 20,
    initialPage: params.page || 1,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', params],
    queryFn: () => itemsApi.listItems(params),
    placeholderData: (previousData) => previousData,
  });

  // Mettre à jour la pagination quand les données changent
  useEffect(() => {
    if (data) {
      // La pagination sera gérée par les paramètres URL
    }
  }, [data]);

  const handleParamsChange = (newParams: any) => {
    updateParams(newParams);
  };

  const handleReset = () => {
    resetParams();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-2xl font-semibold">Erreur de chargement</h2>
          <p className="text-muted-foreground">
            Impossible de charger les objets. Veuillez réessayer.
          </p>
        </div>
      </div>
    );
  }

  return (
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
            <h1 className="mb-4 text-3xl font-bold">Explorer les objets</h1>
            <p className="mb-6 text-muted-foreground">
              Découvrez des objets intéressants à échanger dans votre communauté
            </p>
          </div>
          <Button asChild>
            <Link href="/item/new">
              <Plus className="mr-2 h-4 w-4" />
              Publier un objet
            </Link>
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
        <ItemFilters
          params={params}
          onParamsChange={handleParamsChange}
          onReset={handleReset}
        />
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
              {data.total} objet{data.total > 1 ? 's' : ''} trouvé
              {data.total > 1 ? 's' : ''}
            </p>
            {data.total > 0 && (
              <p className="text-sm text-muted-foreground">
                Page {data.page} sur {data.totalPages}
              </p>
            )}
          </div>
        )}

        <ItemGrid items={data?.items || []} loading={isLoading} />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={goToPreviousPage}
              disabled={!hasPreviousPage}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateParams({ page })}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={!hasNextPage}
            >
              Suivant
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      }
    >
      <ExplorePageContent />
    </Suspense>
  );
}

'use client';

/**
 * FICHIER: app/discover/page.tsx
 *
 * DESCRIPTION:
 * Page publique "Découvrir" dédiée au contenu éco-éducatif.
 * Elle permet de filtrer les ressources (articles, vidéos, tutos) issues
 * du module Eco (backend) et d'afficher des statistiques/tags populaires.
 *
 * FONCTIONNALITÉS:
 * - Filtres dynamiques (type de contenu, tags, période, langues…)
 * - Liste paginée des contenus avec EcoContentGrid
 * - Statistiques et tags populaires affichés dans la colonne de gauche
 * - Rafraîchissement manuel + enrichissement (désactivé côté public)
 *
 * DONNÉES:
 * - React Query pour récupérer contenus, stats et tags (ecoApi)
 * - State local pour mémoriser les filtres (page, limit, etc.)
 *
 * UX:
 * - Animations Framer Motion (entrée des panneaux)
 * - Layout responsive (filtres colonne gauche, contenu colonne droite)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/common/Container';
import { EcoContentFilters } from '@/components/eco/EcoContentFilters';
import { EcoContentGrid } from '@/components/eco/EcoContentGrid';
import { ecoApi } from '@/lib/eco.api';
import { ListEcoContentParams } from '@/types';
import { toast } from 'react-hot-toast';
import { Leaf, Search, Filter } from 'lucide-react';

export default function DiscoverPage() {
  const [filters, setFilters] = useState<ListEcoContentParams>({
    page: 1,
    limit: 20,
  });

  const queryClient = useQueryClient();

  // Récupérer les contenus éco
  const {
    data: contentsData,
    isLoading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useQuery({
    queryKey: ['eco-content', filters],
    queryFn: () => ecoApi.listEcoContent(filters),
    retry: false,
  });

  // Récupérer les statistiques
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['eco-content-stats'],
    queryFn: () => ecoApi.getEcoContentStats(),
    retry: false,
  });

  // Récupérer les tags populaires
  const { data: popularTags, isLoading: tagsLoading } = useQuery({
    queryKey: ['eco-content-tags'],
    queryFn: () => ecoApi.getPopularTags(20),
    retry: false,
  });

  const handleFiltersChange = (newFilters: ListEcoContentParams) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetchContents();
  };

  const handleEnrich = async (id: string) => {
    try {
      await ecoApi.enrichEcoContent(id);
      toast.success('Contenu enrichi avec succès !');
      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['eco-content'] });
    } catch (error: any) {
      toast.error(`Erreur lors de l'enrichissement: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Container>
        <div className="py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Découvrir
                </h1>
                <p className="text-muted-foreground">
                  Explorez du contenu éco-éducatif pour apprendre et agir
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Filtres */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <EcoContentFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  popularTags={popularTags || []}
                  stats={statsData || { total: 0, byKind: {}, byLocale: {} }}
                />
              </motion.div>
            </div>

            {/* Contenu principal */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <EcoContentGrid
                  contents={contentsData?.items || []}
                  isLoading={contentsLoading}
                  onRefresh={handleRefresh}
                  showEnrichButton={false} // Pas d'enrichissement sur la page publique
                />
              </motion.div>
            </div>
          </div>

          {/* Pagination */}
          {contentsData && contentsData.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex justify-center"
            >
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: (filters.page || 1) - 1 })
                  }
                  disabled={filters.page === 1}
                  className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Précédent
                </button>

                <div className="flex items-center gap-2">
                  {Array.from(
                    { length: Math.min(5, contentsData.totalPages) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setFilters({ ...filters, page })}
                          className={`rounded-lg px-3 py-2 transition-colors ${
                            filters.page === page
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card hover:bg-muted'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() =>
                    setFilters({ ...filters, page: (filters.page || 1) + 1 })
                  }
                  disabled={filters.page === contentsData.totalPages}
                  className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  );
}

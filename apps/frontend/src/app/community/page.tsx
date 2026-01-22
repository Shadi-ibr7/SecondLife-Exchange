/**
 * FICHIER: app/community/page.tsx
 *
 * DESCRIPTION:
 * Page principale de la communauté selon le design Figma.
 * Affiche la liste des discussions avec filtres, catégories et recherche.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/common/Container';
import { ThreadCard } from '@/components/community/ThreadCard';
import { CategoryList } from '@/components/community/CategoryList';
import { communityApi } from '@/lib/community.api';
import { ListThreadsParams, ThreadCategory, ThreadSortBy } from '@/types';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  TrendingUp,
  Clock,
  Heart,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { THREAD_SORT_OPTIONS } from '@/lib/constants';

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState<ListThreadsParams>({
    scope: 'GENERAL',
    page: 1,
    limit: 20,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    ThreadCategory | null
  >(null);
  const [sortBy, setSortBy] = useState<ThreadSortBy>('trending');

  // Récupérer les threads
  const {
    data: threadsData,
    isLoading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
  } = useQuery({
    queryKey: ['community-threads', filters],
    queryFn: () => communityApi.listThreads(filters),
    retry: false,
  });

  // Calculer les compteurs de catégories
  const categoryCounts: Record<string, number> = {};
  if (threadsData) {
    threadsData.items.forEach((thread) => {
      if (thread.category) {
        categoryCounts[thread.category] =
          (categoryCounts[thread.category] || 0) + 1;
      }
    });
  }

  const handleCategorySelect = (category: ThreadCategory | null) => {
    setSelectedCategory(category);
    setFilters({
      ...filters,
      category: category || undefined,
      page: 1,
    });
  };

  const handleSortChange = (newSortBy: ThreadSortBy) => {
    setSortBy(newSortBy);
    setFilters({
      ...filters,
      sortBy: newSortBy,
      page: 1,
    });
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      q: searchQuery.trim() || undefined,
      page: 1,
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCreateNew = () => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour créer une discussion');
      router.push('/login?next=/community/new');
      return;
    }
    router.push('/community/new');
  };

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Communauté</h1>
              <p className="text-muted-foreground">
                Partagez conseils, astuces et histoires d'échange
              </p>
            </div>
            <Button onClick={handleCreateNew} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle discussion
            </Button>
          </div>

          {/* Barre de recherche */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une discussion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Rechercher</Button>
          </div>

          {/* Filtres de tri */}
          <div className="flex gap-2">
            {THREAD_SORT_OPTIONS.map((option) => {
              const Icon =
                option.icon === 'TrendingUp'
                  ? TrendingUp
                  : option.icon === 'Clock'
                    ? Clock
                    : Heart;
              const isActive = sortBy === option.value;

              return (
                <Button
                  key={option.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange(option.value as ThreadSortBy)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Catégories */}
          <div className="lg:col-span-1">
            <CategoryList
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              categoryCounts={categoryCounts}
              totalCount={threadsData?.total || 0}
            />
          </div>

          {/* Liste des discussions */}
          <div className="lg:col-span-3">
            {threadsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {threadsError && (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">
                  Erreur lors du chargement des discussions
                </p>
                <Button onClick={() => refetchThreads()}>Réessayer</Button>
              </div>
            )}

            {!threadsLoading && !threadsError && threadsData && (
              <>
                {threadsData.items.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      Aucune discussion trouvée
                    </p>
                    {isAuthenticated && (
                      <Button onClick={handleCreateNew}>
                        Créer la première discussion
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {threadsData.items.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {threadsData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={filters.page === 1}
                      onClick={() =>
                        setFilters({ ...filters, page: (filters.page || 1) - 1 })
                      }
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {filters.page} sur {threadsData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={filters.page === threadsData.totalPages}
                      onClick={() =>
                        setFilters({ ...filters, page: (filters.page || 1) + 1 })
                      }
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

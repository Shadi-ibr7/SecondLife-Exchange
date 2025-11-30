'use client';

/**
 * FICHIER: app/community/page.tsx
 *
 * DESCRIPTION:
 * Page principale de la communauté. Elle affiche la liste des discussions
 * (threads) et permet de filtrer/rechercher selon différents scopes.
 *
 * FONCTIONNALITÉS:
 * - Filtrer par scope (GENERAL, THEME, CATEGORY, ITEM)
 * - Recherche textuelle dans les titres/contenus
 * - Rafraîchissement manuel de la liste
 * - Pagination client simple (affiche 5 pages max)
 * - Bouton pour initier la création d'un thread (à implémenter)
 *
 * DONNÉES:
 * - useQuery (React Query) pour récupérer les threads via communityApi
 * - State local pour gérer les filtres, la recherche et la pagination
 *
 * UX:
 * - Animations d'apparition via Framer Motion
 * - Badges affichant les filtres actifs
 * - Boutons Précédent/Suivant pour la pagination
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/common/Container';
import { ThreadList } from '@/components/community/ThreadList';
import { communityApi } from '@/lib/community.api';
import { ListThreadsParams } from '@/types';
import { toast } from 'react-hot-toast';
import { MessageSquare, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CommunityPage() {
  const [filters, setFilters] = useState<ListThreadsParams>({
    scope: 'GENERAL',
    page: 1,
    limit: 20,
  });
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleScopeChange = (scope: string) => {
    setFilters({
      ...filters,
      scope: scope as any,
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

  const handleRefresh = () => {
    refetchThreads();
  };

  const handleCreateNew = () => {
    // TODO: Implémenter la création de thread
    toast.success('Fonctionnalité de création de thread à venir !');
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
              <div className="rounded-lg bg-blue-500/10 p-2">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Communauté
                </h1>
                <p className="text-muted-foreground">
                  Participez aux discussions de la communauté SecondLife
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filtres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Recherche */}
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Rechercher dans les discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Filtres */}
              <div className="flex gap-2">
                <Select
                  value={filters.scope || 'GENERAL'}
                  onValueChange={handleScopeChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type de discussion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">Général</SelectItem>
                    <SelectItem value="THEME">Thèmes</SelectItem>
                    <SelectItem value="CATEGORY">Catégories</SelectItem>
                    <SelectItem value="ITEM">Objets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtres actifs */}
            {(filters.scope !== 'GENERAL' || filters.q) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.scope && filters.scope !== 'GENERAL' && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-3 w-3" />
                    {filters.scope}
                    <button
                      onClick={() => handleScopeChange('GENERAL')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.q && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    {filters.q}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({ ...filters, q: undefined, page: 1 });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </motion.div>

          {/* Liste des threads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ThreadList
              threads={threadsData?.items || []}
              isLoading={threadsLoading}
              onRefresh={handleRefresh}
              onCreateNew={handleCreateNew}
              showCreateButton={true}
            />
          </motion.div>

          {/* Pagination */}
          {threadsData && threadsData.totalPages > 1 && (
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
                    { length: Math.min(5, threadsData.totalPages) },
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
                  disabled={filters.page === threadsData.totalPages}
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

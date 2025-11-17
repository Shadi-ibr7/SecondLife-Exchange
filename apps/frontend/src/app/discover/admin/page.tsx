'use client';

/**
 * FICHIER: app/discover/admin/page.tsx
 *
 * DESCRIPTION:
 * Interface d'administration dédiée au contenu éco-éducatif.
 * Réservée aux utilisateurs ADMIN, elle permet de créer, modifier, supprimer
 * et enrichir les contenus visibles sur la page publique Discover.
 *
 * FONCTIONNALITÉS:
 * - Accès sécurisé (vérifie authentification + rôle admin)
 * - Liste paginée des contenus (EcoContentGrid) avec bouton d'enrichissement IA
 * - Filtres identiques à la page publique (EcoContentFilters)
 * - Création/édition via formulaires modaux (EcoContentForm)
 * - Suppression avec confirmation et toast de retour utilisateur
 *
 * DONNÉES:
 * - React Query pour contenus, stats et tags (désactivé tant que non admin)
 * - Invalidation du cache après chaque mutation (create/update/delete/enrich)
 * - State local pour gérer les formulaires et l'ID en cours d'enrichissement
 *
 * UX:
 * - Messages dédiés si non connecté ou non admin
 * - Animations Framer Motion pour fluidifier l'expérience
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/common/Container';
import { EcoContentFilters } from '@/components/eco/EcoContentFilters';
import { EcoContentGrid } from '@/components/eco/EcoContentGrid';
import { EcoContentForm } from '@/components/eco/EcoContentForm';
import { ecoApi } from '@/lib/eco.api';
import { useAuthStore } from '@/store/auth';
import {
  ListEcoContentParams,
  CreateEcoContentDto,
  UpdateEcoContentDto,
  EcoContent,
} from '@/types';
import { toast } from 'react-hot-toast';
import { Shield, Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminDiscoverPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [filters, setFilters] = useState<ListEcoContentParams>({
    page: 1,
    limit: 20,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState<EcoContent | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.roles === 'ADMIN';

  // Récupérer les contenus éco
  const {
    data: contentsData,
    isLoading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useQuery({
    queryKey: ['eco-content', filters],
    queryFn: () => ecoApi.listEcoContent(filters),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Récupérer les statistiques
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['eco-content-stats'],
    queryFn: () => ecoApi.getEcoContentStats(),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Récupérer les tags populaires
  const { data: popularTags, isLoading: tagsLoading } = useQuery({
    queryKey: ['eco-content-tags'],
    queryFn: () => ecoApi.getPopularTags(20),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const handleFiltersChange = (newFilters: ListEcoContentParams) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetchContents();
  };

  const handleCreate = async (
    data: CreateEcoContentDto | UpdateEcoContentDto
  ) => {
    await ecoApi.createEcoContent(data as CreateEcoContentDto);
    setShowCreateForm(false);
    queryClient.invalidateQueries({ queryKey: ['eco-content'] });
  };

  const handleUpdate = async (
    data: CreateEcoContentDto | UpdateEcoContentDto
  ) => {
    if (!editingContent) return;
    await ecoApi.updateEcoContent(
      editingContent.id,
      data as UpdateEcoContentDto
    );
    setEditingContent(null);
    queryClient.invalidateQueries({ queryKey: ['eco-content'] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return;

    try {
      await ecoApi.deleteEcoContent(id);
      toast.success('Contenu supprimé !');
      queryClient.invalidateQueries({ queryKey: ['eco-content'] });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleEnrich = async (id: string) => {
    setEnrichingId(id);
    try {
      await ecoApi.enrichEcoContent(id);
      toast.success('Contenu enrichi avec succès !');
      queryClient.invalidateQueries({ queryKey: ['eco-content'] });
    } catch (error: any) {
      toast.error(`Erreur lors de l'enrichissement: ${error.message}`);
    } finally {
      setEnrichingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Container>
          <div className="flex min-h-screen items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Shield className="mx-auto mb-4 h-16 w-16 text-primary" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Connexion requise
              </h1>
              <p className="mb-6 text-muted-foreground">
                Connectez-vous pour accéder à l'administration
              </p>
              <Button asChild>
                <a href="/login">Se connecter</a>
              </Button>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Container>
          <div className="flex min-h-screen items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Shield className="mx-auto mb-4 h-16 w-16 text-destructive" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Accès non autorisé
              </h1>
              <p className="mb-6 text-muted-foreground">
                Vous devez être administrateur pour accéder à cette page
              </p>
              <Button asChild variant="outline">
                <a href="/discover">Retour à la découverte</a>
              </Button>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

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
              <div className="rounded-lg bg-red-500/10 p-2">
                <Shield className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Administration - Contenu Éco
                </h1>
                <p className="text-muted-foreground">
                  Gérez le contenu éco-éducatif de la plateforme
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
                  showEnrichButton={true}
                  onEnrich={handleEnrich}
                  enrichingId={enrichingId || undefined}
                  showCreateButton={true}
                  onCreateNew={() => setShowCreateForm(true)}
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

      {/* Dialog pour créer un nouveau contenu */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau contenu éco-éducatif</DialogTitle>
          </DialogHeader>
          <EcoContentForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un contenu */}
      <Dialog
        open={!!editingContent}
        onOpenChange={() => setEditingContent(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le contenu</DialogTitle>
          </DialogHeader>
          {editingContent && (
            <EcoContentForm
              initialData={editingContent}
              onSubmit={handleUpdate}
              onCancel={() => setEditingContent(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

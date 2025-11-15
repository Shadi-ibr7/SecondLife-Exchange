/**
 * FICHIER: page.tsx (Page d'exploration)
 *
 * DESCRIPTION:
 * Ce fichier définit la page d'exploration des items (objets).
 * Elle permet de rechercher, filtrer et parcourir tous les items disponibles.
 *
 * FONCTIONNALITÉS:
 * - Liste paginée d'items avec filtres
 * - Filtres par catégorie, condition, statut, recherche textuelle
 * - Pagination avec navigation
 * - Gestion des erreurs avec messages informatifs
 * - Mode développement avec items mock
 * - Suspense pour la gestion du SSR avec useQueryParams
 *
 * FILTRES:
 * - Recherche textuelle (q)
 * - Catégorie (category)
 * - Condition (condition)
 * - Statut (status)
 * - Propriétaire (ownerId)
 * - Tri (sort)
 *
 * NOTE:
 * En mode développement, affiche des items mock si le backend n'est pas disponible.
 */

'use client';

// Import de React
import { useEffect, Suspense } from 'react';

// Import de React Query
import { useQuery } from '@tanstack/react-query';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import des composants d'items
import { ItemFilters } from '@/components/items/ItemFilters';
import { ItemGrid } from '@/components/items/ItemGrid';

// Import de la galerie Unsplash (optionnel)
import UnsplashGallery from '@/components/gallery/UnsplashGallery';

// Import de l'API
import { itemsApi } from '@/lib/items.api';

// Import des hooks personnalisés
import { useQueryParams } from '@/hooks/useQueryParams';
import { usePagination } from '@/hooks/usePagination';

// Import des icônes
import { Search, Plus } from 'lucide-react';

// Import de Next.js
import Link from 'next/link';

// Import des types
import { Item } from '@/types';

/**
 * COMPOSANT: ExplorePageContent
 *
 * Contenu principal de la page d'exploration.
 * Enveloppé dans Suspense pour gérer useQueryParams avec SSR.
 */
function ExplorePageContent() {
  // ============================================
  // RÉCUPÉRATION DES HOOKS
  // ============================================

  /**
   * Hook pour gérer les paramètres de requête (filtres, pagination).
   */
  const { params, updateParams, resetParams } = useQueryParams();

  /**
   * Hook pour gérer la pagination.
   * Le total sera mis à jour par la requête.
   */
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

  // ============================================
  // REQUÊTE REACT QUERY
  // ============================================

  /**
   * Requête React Query pour récupérer la liste des items.
   *
   * CONFIGURATION:
   * - queryKey: ['items', params] - Clé unique incluant les paramètres
   * - placeholderData: Garde les données précédentes pendant le chargement
   * - retry: 2 tentatives en cas d'échec
   * - retryDelay: 1 seconde entre les tentatives
   */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['items', params],
    queryFn: () => itemsApi.listItems(params),
    placeholderData: (previousData) => previousData, // Garder les données précédentes
    retry: 2, // Réessayer 2 fois en cas d'échec
    retryDelay: 1000, // Attendre 1 seconde entre les tentatives
  });

  // Mock d'annonces pour aperçu du design (affiché si aucune donnée réelle)
  const MOCK_ITEMS: Item[] = [
    {
      id: 'mock-1',
      ownerId: 'u1',
      title: 'Chaise vintage en bois',
      description:
        'Chaise en bois massif restaurée, idéale pour un intérieur rétro.',
      category: 'HOME',
      condition: 'GOOD',
      status: 'AVAILABLE',
      tags: ['vintage', 'bois', 'restauré'],
      aiSummary: undefined,
      aiRepairTip: undefined,
      popularityScore: 0,
      photos: [
        {
          id: 'p1',
          itemId: 'mock-1',
          url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1200&auto=format&fit=crop',
          publicId: 'mock',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: 'u1',
        email: 'user1@example.com',
        displayName: 'Alice',
        avatarUrl: undefined,
        bio: 'Passionnée de déco',
        location: 'Paris',
        roles: 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'mock-2',
      ownerId: 'u2',
      title: 'Roman policier - état neuf',
      description:
        'Livre lu une fois, comme neuf. Échange contre livre de science-fiction.',
      category: 'BOOKS',
      condition: 'NEW',
      status: 'AVAILABLE',
      tags: ['livre', 'roman', 'policier'],
      aiSummary: undefined,
      aiRepairTip: undefined,
      popularityScore: 0,
      photos: [
        {
          id: 'p2',
          itemId: 'mock-2',
          url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0ea?q=80&w=1200&auto=format&fit=crop',
          publicId: 'mock',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: 'u2',
        email: 'user2@example.com',
        displayName: 'Karim',
        avatarUrl: undefined,
        bio: 'Lecteur avide',
        location: 'Lyon',
        roles: 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 'mock-3',
      ownerId: 'u3',
      title: 'Perceuse sans fil 18V',
      description:
        'Outil en bon état, batterie récente. Échange contre outils de jardinage.',
      category: 'TOOLS',
      condition: 'GOOD',
      status: 'AVAILABLE',
      tags: ['outil', 'bricolage'],
      aiSummary: undefined,
      aiRepairTip: undefined,
      popularityScore: 0,
      photos: [
        {
          id: 'p3',
          itemId: 'mock-3',
          url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=1200&auto=format&fit=crop',
          publicId: 'mock',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: 'u3',
        email: 'user3@example.com',
        displayName: 'Sophie',
        avatarUrl: undefined,
        bio: 'DIY addict',
        location: 'Marseille',
        roles: 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ];

  const itemsToShow =
    data?.items && data.items.length > 0
      ? data.items
      : process.env.NODE_ENV === 'development'
        ? MOCK_ITEMS
        : [];

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
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors du chargement des objets';
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes('Network Error') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED'));

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="mb-2 text-2xl font-semibold">
              Erreur de chargement
            </h2>
            <p className="mb-4 text-muted-foreground">
              {isNetworkError
                ? 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.'
                : 'Impossible de charger les objets. Veuillez réessayer.'}
            </p>
          </div>

          {isNetworkError && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-2 font-semibold text-primary">
                Comment démarrer le backend ?
              </h3>
              <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Ouvrez un nouveau terminal dans le dossier du projet</li>
                <li>
                  Assurez-vous que Docker est démarré (pour la base de données)
                </li>
                <li>
                  Démarrez le backend avec la commande :
                  <code className="ml-2 rounded bg-muted px-2 py-1 font-mono text-xs">
                    pnpm -C apps/backend start:dev
                  </code>
                </li>
                <li>
                  Attendez que le message{' '}
                  <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                    🚀 Backend démarré sur le port 4000
                  </code>{' '}
                  apparaisse
                </li>
                <li>Revenez ici et cliquez sur "Réessayer"</li>
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                📚 Pour plus d'informations, consultez le{' '}
                <code className="rounded bg-muted px-1 font-mono">
                  README.md
                </code>{' '}
                ou le fichier{' '}
                <code className="rounded bg-muted px-1 font-mono">
                  REDEMARRER_BACKEND.md
                </code>
              </p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <strong>Détails de l'erreur :</strong>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {errorMessage}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => refetch()} variant="default">
              Réessayer
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
            >
              Retour à l'accueil
            </Button>
          </div>
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

      {/* Section supprimée: galerie inspirante pour n'afficher que les objets utilisateurs */}

      {/* Résultats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {(data || itemsToShow.length > 0) && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.total ?? itemsToShow.length} objet
              {(data?.total ?? itemsToShow.length) > 1 ? 's' : ''} trouvé
            </p>
            {data?.total && data.total > 0 && (
              <p className="text-sm text-muted-foreground">
                Page {data.page} sur {data.totalPages}
              </p>
            )}
          </div>
        )}

        <ItemGrid
          items={data?.items?.length ? data.items : itemsToShow}
          loading={isLoading}
        />

        {/* Pagination */}
        {data?.totalPages && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={goToPreviousPage}
              disabled={!hasPreviousPage}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, data?.totalPages || 0) },
                (_, i) => {
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
                }
              )}
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

/**
 * FICHIER: dashboard/page.tsx
 *
 * DESCRIPTION:
 * Page dashboard admin avec statistiques.
 */

'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Users, Package, ArrowLeftRight, Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">{title}</p>
          <p className="text-3xl font-normal text-[#1e1e20] dark:text-[#ececed] tracking-tight">{value}</p>
          {change && (
            <p
              className={`text-xs font-normal ${
                trend === 'up'
                  ? 'text-[#1b3828] dark:text-[#2d5a45]'
                  : trend === 'down'
                    ? 'text-[#dc2626] dark:text-[#ef4444]'
                    : 'text-[#6f6f73] dark:text-[#9a9a9d]'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="text-[#6f6f73] dark:text-[#9a9a9d]">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    retry: 1,
  });

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => adminApi.getAnalyticsOverview(),
    retry: 1,
  });

  const { data: recentUsers, error: usersError } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => adminApi.getUsers(1, 5),
    retry: 1,
  });

  const { data: recentItems, error: itemsError } = useQuery({
    queryKey: ['admin-recent-items'],
    queryFn: () => adminApi.getItems(1, 5),
    retry: 1,
  });

  if (statsLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher les erreurs si elles existent
  const hasError = statsError || analyticsError || usersError || itemsError;
  if (hasError) {
    const error = statsError || analyticsError || usersError || itemsError;
    const errorMessage = error?.message || 'Une erreur est survenue';
    const isNetworkError = 
      errorMessage.includes('Network Error') || 
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed');
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-description">Erreur lors du chargement des données</p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive mb-2">
            {isNetworkError ? '⚠️ Backend non accessible' : 'Erreur de connexion'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
          {isNetworkError && (
            <div className="text-sm text-muted-foreground space-y-2 mt-4 p-3 bg-background rounded border">
              <p className="font-semibold">Solution :</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Ouvrez un terminal dans le dossier <code className="bg-muted px-1 rounded">apps/backend</code></li>
                <li>Exécutez <code className="bg-muted px-1 rounded">pnpm dev</code> pour démarrer le backend</li>
                <li>Attendez que le message "Nest application successfully started" apparaisse</li>
                <li>Rechargez cette page</li>
              </ol>
            </div>
          )}
          <div className="text-sm text-muted-foreground space-y-1 mt-4">
            <p className="font-semibold">Vérifiez aussi que :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Le backend est démarré sur <code className="bg-muted px-1 rounded">http://localhost:4000</code></li>
              <li>Les variables <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_URL</code> et <code className="bg-muted px-1 rounded">NEXT_PUBLIC_ADMIN_BASE_PATH</code> sont définies dans <code className="bg-muted px-1 rounded">apps/frontend/.env.local</code></li>
              <li>Vous êtes bien connecté en tant qu'administrateur</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-description">
          Vue d'ensemble de la plateforme SecondLife Exchange
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Utilisateurs totaux"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          change={stats?.usersGrowth ? `+${stats.usersGrowth.toFixed(1)}% ce mois` : undefined}
          trend="up"
          icon={<Users className="w-5 h-5" strokeWidth={1.5} />}
        />
        <StatsCard
          title="Objets publiés"
          value={stats?.totalItems?.toLocaleString() || '0'}
          change={stats?.itemsGrowth ? `+${stats.itemsGrowth.toFixed(1)}% ce mois` : undefined}
          trend="up"
          icon={<Package className="w-5 h-5" strokeWidth={1.5} />}
        />
        <StatsCard
          title="Échanges en cours"
          value={stats?.totalExchanges?.toLocaleString() || '0'}
          change={stats?.exchangesGrowth ? `+${stats.exchangesGrowth.toFixed(1)}% ce mois` : undefined}
          trend="up"
          icon={<ArrowLeftRight className="w-5 h-5" strokeWidth={1.5} />}
        />
        <StatsCard
          title="Signalements ouverts"
          value={stats?.openReports?.toLocaleString() || '0'}
          change={stats?.reportsGrowth ? `${stats.reportsGrowth > 0 ? '+' : ''}${stats.reportsGrowth.toFixed(1)}% ce mois` : undefined}
          trend={stats?.reportsGrowth && stats.reportsGrowth < 0 ? 'down' : 'up'}
          icon={<Flag className="w-5 h-5" strokeWidth={1.5} />}
        />
      </div>

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] mb-1">Utilisateurs récents</h3>
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">Derniers inscrits</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${ADMIN_BASE_PATH}/users`}>Voir tout</Link>
            </Button>
          </div>
          <div>
            {recentUsers?.users?.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(45,90,69,0.1)] flex items-center justify-center">
                        <span className="text-xs font-normal text-[#1b3828] dark:text-[#2d5a45]">
                          {user.displayName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed]">{user.displayName}</p>
                        <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">Aucun utilisateur récent</p>
            )}
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] mb-1">Objets récents</h3>
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">Derniers publiés</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${ADMIN_BASE_PATH}/items`}>Voir tout</Link>
            </Button>
          </div>
          <div>
            {recentItems?.items?.length > 0 ? (
              <div className="space-y-3">
                {recentItems.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#f7f7f8] dark:bg-[#1a1a1c] flex items-center justify-center">
                        <Package className="w-4 h-4 text-[#6f6f73] dark:text-[#9a9a9d]" />
                      </div>
                      <div>
                        <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] line-clamp-1">{item.title}</p>
                        <p className="text-xs text-[#6f6f73] dark:text-[#9a9a9d] font-normal">{item.category}</p>
                      </div>
                    </div>
                    <span className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">Aucun objet récent</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {analytics?.topCategories && analytics.topCategories.length > 0 && (
        <div className="bg-white dark:bg-[#141416] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
          <div className="mb-6">
            <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] mb-1">Top catégories</h3>
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">Les catégories les plus populaires</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.topCategories.slice(0, 5).map((cat: any) => (
              <div key={cat.category} className="text-center">
                <p className="text-2xl font-normal text-[#1e1e20] dark:text-[#ececed]">{cat.count}</p>
                <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">{cat.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


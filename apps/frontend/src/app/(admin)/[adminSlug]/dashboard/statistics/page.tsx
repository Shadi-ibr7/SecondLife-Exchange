/**
 * FICHIER: dashboard/statistics/page.tsx
 *
 * DESCRIPTION:
 * Page de statistiques avancées du dashboard pour l'admin.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ArrowLeftRight,
  Flag,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <CardTitle className="text-3xl tracking-tight">{value}</CardTitle>
        {subtitle && (
          <p
            className={`text-xs flex items-center gap-1 ${
              trend === 'up'
                ? 'text-primary'
                : trend === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {subtitle}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}

export default function DashboardStatisticsPage() {
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => adminApi.getAnalyticsOverview(),
  });

  const { data: userAnalytics, isLoading: userLoading } = useQuery({
    queryKey: ['admin-analytics-users'],
    queryFn: () => adminApi.getUserAnalytics(),
  });

  const { data: itemAnalytics, isLoading: itemLoading } = useQuery({
    queryKey: ['admin-analytics-items'],
    queryFn: () => adminApi.getItemAnalytics(),
  });

  const { data: exchangeAnalytics, isLoading: exchangeLoading } = useQuery({
    queryKey: ['admin-analytics-exchanges'],
    queryFn: () => adminApi.getExchangeAnalytics(),
  });

  const { data: reportsData } = useQuery({
    queryKey: ['admin-reports-stats'],
    queryFn: () => adminApi.getReports(1, 1),
  });

  const isLoading =
    statsLoading || analyticsLoading || userLoading || itemLoading || exchangeLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Statistiques avancées</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const openReports = reportsData?.reports?.filter((r: any) => !r.resolved).length || 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium mb-1">Statistiques avancées</h1>
            <p className="text-muted-foreground">
              Analyse approfondie et métriques de performance de la plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-medium mb-4">Métriques clés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utilisateurs totaux"
            value={stats?.totalUsers?.toLocaleString() || '0'}
            subtitle={
              stats?.usersGrowth
                ? `${stats.usersGrowth > 0 ? '+' : ''}${stats.usersGrowth}% cette semaine`
                : undefined
            }
            trend={stats?.usersGrowth && stats.usersGrowth > 0 ? 'up' : 'neutral'}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Objets publiés"
            value={stats?.totalItems?.toLocaleString() || '0'}
            subtitle={
              stats?.itemsGrowth
                ? `${stats.itemsGrowth > 0 ? '+' : ''}${stats.itemsGrowth}% cette semaine`
                : undefined
            }
            trend={stats?.itemsGrowth && stats.itemsGrowth > 0 ? 'up' : 'neutral'}
            icon={<Package className="w-5 h-5" />}
          />
          <StatCard
            title="Échanges totaux"
            value={stats?.totalExchanges?.toLocaleString() || '0'}
            subtitle={
              stats?.exchangesGrowth
                ? `${stats.exchangesGrowth > 0 ? '+' : ''}${stats.exchangesGrowth}% cette semaine`
                : undefined
            }
            trend={stats?.exchangesGrowth && stats.exchangesGrowth > 0 ? 'up' : 'neutral'}
            icon={<ArrowLeftRight className="w-5 h-5" />}
          />
          <StatCard
            title="Signalements ouverts"
            value={openReports}
            subtitle={
              stats?.reportsGrowth
                ? `${stats.reportsGrowth > 0 ? '+' : ''}${stats.reportsGrowth}% cette semaine`
                : undefined
            }
            trend={stats?.reportsGrowth && stats.reportsGrowth > 0 ? 'down' : 'neutral'}
            icon={<Flag className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="items">Objets</TabsTrigger>
          <TabsTrigger value="exchanges">Échanges</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Statistiques utilisateurs
                </CardTitle>
                <CardDescription>Données détaillées sur les utilisateurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{userAnalytics?.totalUsers || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bannis</div>
                    <div className="text-2xl font-bold text-destructive">
                      {userAnalytics?.bannedUsers || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avec objets</div>
                    <div className="text-2xl font-bold">{userAnalytics?.usersWithItems || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avec échanges</div>
                    <div className="text-2xl font-bold">
                      {userAnalytics?.usersWithExchanges || 0}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/users`}>
                      Voir tous les utilisateurs
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {userAnalytics?.usersByMonth && userAnalytics.usersByMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Inscriptions par mois
                  </CardTitle>
                  <CardDescription>Évolution des nouveaux utilisateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userAnalytics.usersByMonth
                      .slice(-6)
                      .map((month: any) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{month.month}</span>
                          </div>
                          <Badge variant="secondary">{month.count} utilisateurs</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Statistiques objets
                </CardTitle>
                <CardDescription>Données détaillées sur les objets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{itemAnalytics?.totalItems || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Disponibles</div>
                    <div className="text-2xl font-bold text-primary">
                      {itemAnalytics?.availableItems || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Échangés</div>
                    <div className="text-2xl font-bold text-secondary-foreground">
                      {itemAnalytics?.exchangedItems || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Archivés</div>
                    <div className="text-2xl font-bold">{itemAnalytics?.archivedItems || 0}</div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/items`}>Voir tous les objets</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {analytics?.topCategories && analytics.topCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Top catégories
                  </CardTitle>
                  <CardDescription>Catégories les plus populaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topCategories.slice(0, 5).map((cat: any, index: number) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="text-sm font-medium">{cat.category}</span>
                        </div>
                        <Badge variant="secondary">{cat.count} objets</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Exchanges Tab */}
        <TabsContent value="exchanges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5" />
                  Statistiques échanges
                </CardTitle>
                <CardDescription>Données détaillées sur les échanges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">
                      {exchangeAnalytics?.totalExchanges || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">En attente</div>
                    <div className="text-2xl font-bold text-warning">
                      {exchangeAnalytics?.pendingExchanges || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Acceptés</div>
                    <div className="text-2xl font-bold text-primary">
                      {exchangeAnalytics?.acceptedExchanges || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Complétés</div>
                    <div className="text-2xl font-bold text-secondary-foreground">
                      {exchangeAnalytics?.completedExchanges || 0}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/exchanges`}>
                      Voir tous les échanges
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {analytics?.exchangesByStatus && analytics.exchangesByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Répartition par statut
                  </CardTitle>
                  <CardDescription>Distribution des échanges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.exchangesByStatus.map((status: any) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <Badge variant="outline">{status.status}</Badge>
                        <span className="font-medium">{status.count} échanges</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activité récente
                </CardTitle>
                <CardDescription>Métriques d'activité de la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Utilisateurs actifs (30 derniers jours)
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.activeUsers?.toLocaleString() || 0}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Nouveaux utilisateurs (90 jours)
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.growth?.users?.toLocaleString() || 0}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Nouveaux objets (90 jours)
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.growth?.items?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Signalements
                </CardTitle>
                <CardDescription>Statut des signalements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Ouverts</div>
                  <div className="text-2xl font-bold text-destructive">{openReports}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Total</div>
                  <div className="text-2xl font-bold">
                    {reportsData?.total?.toLocaleString() || 0}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/reports`}>
                      Voir tous les signalements
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


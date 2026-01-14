/**
 * FICHIER: analytics/page.tsx
 *
 * DESCRIPTION:
 * Page d'analytics avancées pour l'admin.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Package, ArrowLeftRight, Activity } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
    <Card className="h-auto min-h-[120px] p-4 sm:p-6 hover:shadow-md transition-shadow">
      <CardHeader className="p-0 mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <CardDescription className="text-xs sm:text-sm text-muted-foreground font-normal">{title}</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl tracking-tight text-foreground">{value}</CardTitle>
            {change && (
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
                {change}
              </p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
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

  if (overviewLoading || userLoading || itemLoading || exchangeLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="admin-page-title">Analytics</h1>
        <p className="admin-page-description">
          Statistiques et analyse de la plateforme SecondLife Exchange
        </p>
      </div>

      {/* Vue d'ensemble */}
      <div>
        <h2 className="text-base font-normal text-foreground mb-4">Vue d'ensemble</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title="Utilisateurs totaux"
            value={overview?.totals?.users?.toLocaleString() || '0'}
            change={
              overview?.growth?.users
                ? `+${overview.growth.users.toLocaleString()} ce trimestre`
                : undefined
            }
            trend="up"
            icon={<Users className="w-5 h-5" strokeWidth={1.5} />}
          />
          <StatsCard
            title="Objets publiés"
            value={overview?.totals?.items?.toLocaleString() || '0'}
            change={
              overview?.growth?.items
                ? `+${overview.growth.items.toLocaleString()} ce trimestre`
                : undefined
            }
            trend="up"
            icon={<Package className="w-5 h-5" strokeWidth={1.5} />}
          />
          <StatsCard
            title="Échanges totaux"
            value={overview?.totals?.exchanges?.toLocaleString() || '0'}
            change={
              overview?.growth?.exchanges
                ? `+${overview.growth.exchanges.toLocaleString()} ce trimestre`
                : undefined
            }
            trend="up"
            icon={<ArrowLeftRight className="w-5 h-5" strokeWidth={1.5} />}
          />
          <StatsCard
            title="Utilisateurs actifs"
            value={overview?.activeUsers?.toLocaleString() || '0'}
            change="Ce trimestre"
            trend="neutral"
            icon={<Activity className="w-5 h-5" strokeWidth={1.5} />}
          />
        </div>
      </div>

      {/* Tabs détaillés */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="items">
            <Package className="w-4 h-4 mr-2" />
            Objets
          </TabsTrigger>
          <TabsTrigger value="exchanges">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Échanges
          </TabsTrigger>
          <TabsTrigger value="categories">
            <TrendingUp className="w-4 h-4 mr-2" />
            Catégories
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="h-auto min-h-[100px] p-4 sm:p-6">
              <CardHeader className="p-0 mb-4 sm:mb-6">
                <CardDescription className="text-xs sm:text-sm text-muted-foreground font-normal">Total utilisateurs</CardDescription>
                <CardTitle className="text-xl sm:text-2xl text-foreground">
                  {userAnalytics?.total?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="h-auto min-h-[100px] p-4 sm:p-6">
              <CardHeader className="p-0 mb-4 sm:mb-6">
                <CardDescription className="text-xs sm:text-sm text-muted-foreground font-normal">Utilisateurs actifs</CardDescription>
                <CardTitle className="text-xl sm:text-2xl text-foreground">
                  {userAnalytics?.active?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="h-auto min-h-[100px] p-4 sm:p-6">
              <CardHeader className="p-0 mb-4 sm:mb-6">
                <CardDescription className="text-xs sm:text-sm text-muted-foreground font-normal">Utilisateurs bannis</CardDescription>
                <CardTitle className="text-xl sm:text-2xl text-foreground">
                  {userAnalytics?.banned?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="h-auto min-h-[200px] p-4 sm:p-6">
              <CardHeader className="p-0 mb-4 sm:mb-6">
                <CardTitle className="text-base font-normal text-foreground">Engagement utilisateurs</CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Statistiques d'activité</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avec objets publiés</span>
                  <span className="font-medium">
                    {userAnalytics?.withItems?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avec échanges</span>
                  <span className="font-medium">
                    {userAnalytics?.withExchanges?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux d'engagement</span>
                  <span className="font-medium">
                    {userAnalytics?.total
                      ? (
                          ((userAnalytics.withItems + userAnalytics.withExchanges) /
                            userAnalytics.total /
                            2) *
                          100
                        ).toFixed(1)
                      : '0'}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-base font-normal text-foreground">Croissance mensuelle</CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Derniers 12 mois</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {userAnalytics?.byMonth && userAnalytics.byMonth.length > 0 ? (
                  <div className="space-y-2">
                    {userAnalytics.byMonth.slice(0, 6).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.month).toLocaleDateString('fr-FR', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                          {item.count} nouveaux
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardDescription className="text-sm text-muted-foreground font-normal">Total objets</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {itemAnalytics?.total?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            {itemAnalytics?.byStatus?.map((item: any) => (
              <Card key={item.status} className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
                <CardHeader className="p-0 mb-6">
                  <CardDescription className="text-sm text-muted-foreground font-normal">{item.status}</CardDescription>
                  <CardTitle className="text-2xl text-foreground">{item.count.toLocaleString()}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-base font-normal text-foreground">Par condition</CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Distribution des états</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {itemAnalytics?.byCondition?.map((item: any) => (
                    <div key={item.condition} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.condition}</span>
                      <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-base font-normal text-foreground">Moyennes</CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Statistiques globales</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Objets par utilisateur</span>
                  <span className="font-medium">
                    {itemAnalytics?.averagePerUser?.toFixed(2) || '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exchanges Tab */}
        <TabsContent value="exchanges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardDescription className="text-sm text-muted-foreground font-normal">Total échanges</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {exchangeAnalytics?.total?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardDescription className="text-sm text-muted-foreground font-normal">Taux de succès</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {exchangeAnalytics?.successRate?.toFixed(1) || '0'}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardDescription className="text-sm text-muted-foreground font-normal">Temps moyen (jours)</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {exchangeAnalytics?.averageCompletionDays?.toFixed(1) || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Par statut</CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">Distribution des échanges</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2">
                {exchangeAnalytics?.byStatus?.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">{item.count}</Badge>
                      <span className="text-xs text-muted-foreground">
                        (
                        {exchangeAnalytics.total
                          ? ((item.count / exchangeAnalytics.total) * 100).toFixed(1)
                          : '0'}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Top catégories</CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">Les catégories les plus populaires</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {overview?.topCategories?.slice(0, 10).map((item: any, index: number) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium text-foreground">{item.category}</span>
                    </div>
                    <Badge className="bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]">
                      {item.count} objets
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


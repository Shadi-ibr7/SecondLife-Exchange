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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-3xl tracking-tight">{value}</CardTitle>
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
      <div>
        <h1 className="admin-page-title">Analytics</h1>
        <p className="admin-page-description">
          Statistiques et analyse de la plateforme SecondLife Exchange
        </p>
      </div>

      {/* Vue d'ensemble */}
      <div>
        <h2 className="text-lg font-medium mb-4">Vue d'ensemble</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardDescription>Total utilisateurs</CardDescription>
                <CardTitle className="text-2xl">
                  {userAnalytics?.total?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Utilisateurs actifs</CardDescription>
                <CardTitle className="text-2xl">
                  {userAnalytics?.active?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Utilisateurs bannis</CardDescription>
                <CardTitle className="text-2xl">
                  {userAnalytics?.banned?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement utilisateurs</CardTitle>
                <CardDescription>Statistiques d'activité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

            <Card>
              <CardHeader>
                <CardTitle>Croissance mensuelle</CardTitle>
                <CardDescription>Derniers 12 mois</CardDescription>
              </CardHeader>
              <CardContent>
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
                        <Badge variant="secondary">{item.count} nouveaux</Badge>
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
            <Card>
              <CardHeader>
                <CardDescription>Total objets</CardDescription>
                <CardTitle className="text-2xl">
                  {itemAnalytics?.total?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            {itemAnalytics?.byStatus?.map((item: any) => (
              <Card key={item.status}>
                <CardHeader>
                  <CardDescription>{item.status}</CardDescription>
                  <CardTitle className="text-2xl">{item.count.toLocaleString()}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Par condition</CardTitle>
                <CardDescription>Distribution des états</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {itemAnalytics?.byCondition?.map((item: any) => (
                    <div key={item.condition} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.condition}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moyennes</CardTitle>
                <CardDescription>Statistiques globales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
            <Card>
              <CardHeader>
                <CardDescription>Total échanges</CardDescription>
                <CardTitle className="text-2xl">
                  {exchangeAnalytics?.total?.toLocaleString() || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Taux de succès</CardDescription>
                <CardTitle className="text-2xl">
                  {exchangeAnalytics?.successRate?.toFixed(1) || '0'}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Temps moyen (jours)</CardDescription>
                <CardTitle className="text-2xl">
                  {exchangeAnalytics?.averageCompletionDays?.toFixed(1) || '0'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Par statut</CardTitle>
              <CardDescription>Distribution des échanges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {exchangeAnalytics?.byStatus?.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.count}</Badge>
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
          <Card>
            <CardHeader>
              <CardTitle>Top catégories</CardTitle>
              <CardDescription>Les catégories les plus populaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview?.topCategories?.slice(0, 10).map((item: any, index: number) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <Badge variant="default">{item.count} objets</Badge>
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


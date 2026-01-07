/**
 * FICHIER: analytics/reports/page.tsx
 *
 * DESCRIPTION:
 * Page de rapports analytiques détaillés pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ArrowLeftRight,
  Activity,
  BarChart3,
  Download,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function MetricCard({
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
    <Card>
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
                {trend === 'down' && <TrendingDown className="w-3 h-3" />}
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

export default function AnalyticsReportsPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [period, setPeriod] = useState('30');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-analytics-overview', startDate, endDate],
    queryFn: () => adminApi.getAnalyticsOverview(startDate, endDate),
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

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const end = new Date();
    const start = new Date();
    switch (value) {
      case '7':
        start.setDate(start.getDate() - 7);
        break;
      case '30':
        start.setDate(start.getDate() - 30);
        break;
      case '90':
        start.setDate(start.getDate() - 90);
        break;
      case '365':
        start.setDate(start.getDate() - 365);
        break;
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const isLoading = overviewLoading || userLoading || itemLoading || exchangeLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Rapports analytiques</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="admin-page-title">Rapports analytiques</h1>
            <p className="admin-page-description">
              Analyse détaillée et rapports de la plateforme
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="period">Période</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger id="period" className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="365">12 derniers mois</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === 'custom' && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="startDate">Du</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="endDate">Au</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div>
        <h2 className="text-lg font-medium mb-4">Vue d'ensemble</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Utilisateurs totaux"
            value={overview?.totals?.users?.toLocaleString() || '0'}
            change={
              overview?.growth?.users
                ? `+${overview.growth.users.toLocaleString()} dans la période`
                : undefined
            }
            trend="up"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Objets publiés"
            value={overview?.totals?.items?.toLocaleString() || '0'}
            change={
              overview?.growth?.items
                ? `+${overview.growth.items.toLocaleString()} dans la période`
                : undefined
            }
            trend="up"
            icon={<Package className="w-5 h-5" />}
          />
          <MetricCard
            title="Échanges totaux"
            value={overview?.totals?.exchanges?.toLocaleString() || '0'}
            change={
              overview?.growth?.exchanges
                ? `+${overview.growth.exchanges.toLocaleString()} dans la période`
                : undefined
            }
            trend="up"
            icon={<ArrowLeftRight className="w-5 h-5" />}
          />
          <MetricCard
            title="Utilisateurs actifs"
            value={overview?.activeUsers?.toLocaleString() || '0'}
            change="Dans la période sélectionnée"
            trend="neutral"
            icon={<Activity className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Catégories populaires
            </CardTitle>
            <CardDescription>Top 10 des catégories d'objets</CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.topCategories && overview.topCategories.length > 0 ? (
              <div className="space-y-3">
                {overview.topCategories.map((cat: any, index: number) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{cat.category}</span>
                    </div>
                    <Badge variant="secondary">{cat.count} objets</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune donnée disponible
              </p>
            )}
          </CardContent>
        </Card>

        {/* Exchange Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Statut des échanges
            </CardTitle>
            <CardDescription>Répartition des échanges par statut</CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.exchangesByStatus && overview.exchangesByStatus.length > 0 ? (
              <div className="space-y-3">
                {overview.exchangesByStatus.map((status: any) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <Badge variant="outline">{status.status}</Badge>
                    <span className="font-medium">{status.count} échanges</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune donnée disponible
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Analytics */}
      {userAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques utilisateurs</CardTitle>
            <CardDescription>Analyse détaillée des utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total utilisateurs</div>
                <div className="text-2xl font-bold">{userAnalytics.totalUsers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Utilisateurs bannis</div>
                <div className="text-2xl font-bold">{userAnalytics.bannedUsers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avec objets</div>
                <div className="text-2xl font-bold">{userAnalytics.usersWithItems || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avec échanges</div>
                <div className="text-2xl font-bold">{userAnalytics.usersWithExchanges || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Analytics */}
      {itemAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques objets</CardTitle>
            <CardDescription>Analyse détaillée des objets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total objets</div>
                <div className="text-2xl font-bold">{itemAnalytics.totalItems || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
                <div className="text-2xl font-bold">{itemAnalytics.availableItems || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Échangés</div>
                <div className="text-2xl font-bold">{itemAnalytics.exchangedItems || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Archivés</div>
                <div className="text-2xl font-bold">{itemAnalytics.archivedItems || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exchange Analytics */}
      {exchangeAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques échanges</CardTitle>
            <CardDescription>Analyse détaillée des échanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total échanges</div>
                <div className="text-2xl font-bold">{exchangeAnalytics.totalExchanges || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">En attente</div>
                <div className="text-2xl font-bold">{exchangeAnalytics.pendingExchanges || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Acceptés</div>
                <div className="text-2xl font-bold">{exchangeAnalytics.acceptedExchanges || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Complétés</div>
                <div className="text-2xl font-bold">
                  {exchangeAnalytics.completedExchanges || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


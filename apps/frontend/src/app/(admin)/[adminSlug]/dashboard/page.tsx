/**
 * FICHIER: dashboard/page.tsx
 *
 * DESCRIPTION:
 * Page dashboard admin avec statistiques.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin.api';
import { Users, Package, ArrowLeftRight, Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
                className={`text-xs ${
                  trend === 'up'
                    ? 'text-primary'
                    : trend === 'down'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                }`}
              >
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

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la plateforme SecondLife Exchange
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
    </div>
  );
}


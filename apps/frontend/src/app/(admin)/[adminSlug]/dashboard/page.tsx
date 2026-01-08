/**
 * FICHIER: dashboard/page.tsx
 *
 * DESCRIPTION:
 * Page dashboard admin avec statistiques.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin.api';
import { Users, Package, ArrowLeftRight, Flag, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
    <Card className="h-[88px]">
      <CardContent className="pt-[25px] px-[25px] pb-0 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col gap-2 h-full">
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">{title}</p>
            <p className="text-[30px] font-normal text-[#1e1e20] dark:text-[#ececed] leading-[36px] tracking-[-0.3545px]">
              {value}
            </p>
            {change && (
              <p
                className={`text-xs font-normal leading-4 ${
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
          <div className="text-[#6f6f73] dark:text-[#9a9a9d] w-5 h-5 shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
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

  const { data: userAnalytics } = useQuery({
    queryKey: ['admin-user-analytics'],
    queryFn: () => adminApi.getUserAnalytics(),
    retry: 1,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['admin-recent-logs'],
    queryFn: () => adminApi.getLogs(1, 5),
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

      {/* KPI Cards - Grid 2x2 selon Figma */}
      <div className="grid grid-cols-2 gap-4 h-[292px]">
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

      {/* Charts Section - Grid 1x2 selon Figma */}
      <div className="grid grid-cols-1 gap-4 h-[620px]">
        {/* Graphique Utilisateurs actifs */}
        <Card className="h-[252px]">
          <CardContent className="pt-[25px] px-[25px] pb-0 h-full flex flex-col gap-4">
            <div className="flex items-center justify-between h-[44px]">
              <div className="h-full">
                <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] leading-6 mb-1">
                  Utilisateurs actifs
                </h3>
                <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
                  30 derniers jours
                </p>
              </div>
              <button className="w-5 h-5 text-[#6f6f73] dark:text-[#9a9a9d] hover:text-[#1e1e20] dark:hover:text-[#ececed] transition-colors">
                <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            {/* Graphique Utilisateurs actifs - 30 derniers jours */}
            <div className="h-[192px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(() => {
                    // Générer des données pour les 30 derniers jours
                    const days = [];
                    const today = new Date();
                    for (let i = 29; i >= 0; i--) {
                      const date = new Date(today);
                      date.setDate(date.getDate() - i);
                      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                      // Simuler des données (à remplacer par de vraies données API)
                      const value = Math.floor(Math.random() * 200) + 400;
                      days.push({ day: dayName, value });
                    }
                    return days;
                  })()}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                    className="dark:stroke-[rgba(255,255,255,0.08)]"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#6f6f73', fontSize: 12 }}
                    className="dark:[&_text]:fill-[#9a9a9d]"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6f6f73', fontSize: 12 }}
                    className="dark:[&_text]:fill-[#9a9a9d]"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 800]}
                    ticks={[0, 200, 400, 600, 800]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '6px',
                      padding: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2d5a45"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#2d5a45' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Graphique Objets par catégorie */}
        <Card className="h-[252px]">
          <CardContent className="pt-[25px] px-[25px] pb-0 h-full flex flex-col gap-4">
            <div className="h-[44px]">
              <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] leading-6 mb-1">
                Objets par catégorie
              </h3>
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
                Distribution actuelle
              </p>
            </div>
            {/* Graphique Objets par catégorie - Bar chart */}
            <div className="h-[192px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(() => {
                    // Utiliser les données de topCategories ou générer des données mockées
                    const categories = analytics?.topCategories || [
                      { category: 'Meubles', count: 2500 },
                      { category: 'Électronique', count: 1800 },
                      { category: 'Vêtements', count: 1200 },
                      { category: 'Livres', count: 800 },
                      { category: 'Déco', count: 600 },
                    ];
                    return categories.slice(0, 5).map((cat: any) => ({
                      name: cat.category,
                      value: cat.count,
                    }));
                  })()}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                    className="dark:stroke-[rgba(255,255,255,0.08)]"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6f6f73', fontSize: 11 }}
                    className="dark:[&_text]:fill-[#9a9a9d]"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6f6f73', fontSize: 12 }}
                    className="dark:[&_text]:fill-[#9a9a9d]"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 3000]}
                    ticks={[0, 750, 1500, 2250, 3000]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '6px',
                      padding: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#2d5a45" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Activité récente */}
      <Card className="h-[421.5px]">
        <CardContent className="pt-[25px] px-[25px] pb-0 h-full flex flex-col">
          <div className="h-[44px] mb-4">
            <h3 className="text-base font-normal text-[#1e1e20] dark:text-[#ececed] leading-6 mb-1">
              Activité récente
            </h3>
            <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-5">
              Dernières actions sur la plateforme
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[44.5px]">
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                        Utilisateur
                      </p>
                    </th>
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Action</p>
                    </th>
                    <th className="text-left px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Type</p>
                    </th>
                    <th className="text-right px-4 py-3">
                      <p className="text-sm font-bold text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Heure</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs?.logs && recentLogs.logs.length > 0 ? (
                    recentLogs.logs.map((log: any, index: number) => {
                      const getActionLabel = (action: string) => {
                        const actionMap: Record<string, string> = {
                          CREATE_USER: 'Nouvel utilisateur inscrit',
                          CREATE_ITEM: `Objet publié: "${log.metadata?.itemTitle || 'Nouvel objet'}"`,
                          UPDATE_ITEM: 'Objet modifié',
                          DELETE_ITEM: 'Objet supprimé',
                          CREATE_EXCHANGE: 'Échange créé',
                          UPDATE_EXCHANGE: 'Échange modifié',
                          COMPLETE_EXCHANGE: 'Échange complété',
                          CREATE_REPORT: 'Signalement créé',
                          RESOLVE_REPORT: 'Signalement résolu',
                          BAN_USER: 'Utilisateur banni',
                          UNBAN_USER: 'Utilisateur débanni',
                        };
                        return actionMap[action] || action;
                      };

                      const getTypeBadge = (action: string) => {
                        if (action.includes('USER')) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#1b3828] dark:text-[#2d5a45]">
                              Utilisateur
                            </span>
                          );
                        }
                        if (action.includes('ITEM')) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#f7f7f8] dark:bg-[#1a1a1c] text-[#6f6f73] dark:text-[#9a9a9d]">
                              Objet
                            </span>
                          );
                        }
                        if (action.includes('EXCHANGE')) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#f7f7f8] dark:bg-[#1a1a1c] text-[#6f6f73] dark:text-[#9a9a9d]">
                              Échange
                            </span>
                          );
                        }
                        if (action.includes('REPORT')) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(194,136,58,0.2)] dark:bg-[rgba(217,160,85,0.2)] text-[#c2883a] dark:text-[#d9a055]">
                              Signalement
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#f7f7f8] dark:bg-[#1a1a1c] text-[#6f6f73] dark:text-[#9a9a9d]">
                            Autre
                          </span>
                        );
                      };

                      const formatTimeAgo = (date: string) => {
                        const now = new Date();
                        const logDate = new Date(date);
                        const diffMs = now.getTime() - logDate.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);

                        if (diffMins < 60) return `Il y a ${diffMins} min`;
                        if (diffHours < 24) return `Il y a ${diffHours}h`;
                        return `Il y a ${diffDays}j`;
                      };

                      const isLast = index === recentLogs.logs.length - 1;

                      return (
                        <tr
                          key={log.id}
                          className={`${
                            !isLast ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]' : ''
                          } h-[53.5px]`}
                        >
                          <td className="px-4">
                            <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                              {log.metadata?.userName || log.metadata?.adminName || 'Système'}
                            </p>
                          </td>
                          <td className="px-4">
                            <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                              {getActionLabel(log.action)}
                            </p>
                          </td>
                          <td className="px-4">{getTypeBadge(log.action)}</td>
                          <td className="px-4 text-right">
                            <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                              {formatTimeAgo(log.createdAt)}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Fallback avec données mockées si pas de logs
                    <>
                      <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[53.5px]">
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Marie Dubois
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Nouvel utilisateur inscrit
                          </p>
                        </td>
                        <td className="px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(45,90,69,0.1)] text-[#1b3828] dark:text-[#2d5a45]">
                            Utilisateur
                          </span>
                        </td>
                        <td className="px-4 text-right">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            Il y a 5 min
                          </p>
                        </td>
                      </tr>
                      <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[53.5px]">
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Pierre Martin
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Objet publié: &quot;Table en bois&quot;
                          </p>
                        </td>
                        <td className="px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#f7f7f8] dark:bg-[#1a1a1c] text-[#6f6f73] dark:text-[#9a9a9d]">
                            Objet
                          </span>
                        </td>
                        <td className="px-4 text-right">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            Il y a 12 min
                          </p>
                        </td>
                      </tr>
                      <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[53.5px]">
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Sophie Laurent
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Échange complété
                          </p>
                        </td>
                        <td className="px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#f7f7f8] dark:bg-[#1a1a1c] text-[#6f6f73] dark:text-[#9a9a9d]">
                            Échange
                          </span>
                        </td>
                        <td className="px-4 text-right">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            Il y a 24 min
                          </p>
                        </td>
                      </tr>
                      <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] h-[53.5px]">
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Lucas Bernard
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Signalement créé
                          </p>
                        </td>
                        <td className="px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(194,136,58,0.2)] dark:bg-[rgba(217,160,85,0.2)] text-[#c2883a] dark:text-[#d9a055]">
                            Signalement
                          </span>
                        </td>
                        <td className="px-4 text-right">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Il y a 1h</p>
                        </td>
                      </tr>
                      <tr className="h-[53px]">
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Emma Petit
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            Objet publié: &quot;Vélo vintage&quot;
                          </p>
                        </td>
                        <td className="px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#f7f7f8] dark:bg-[#1a1a1c] text-[#6f6f73] dark:text-[#9a9a9d]">
                            Objet
                          </span>
                        </td>
                        <td className="px-4 text-right">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">Il y a 2h</p>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


/**
 * FICHIER: system/monitoring/page.tsx
 *
 * DESCRIPTION:
 * Page de monitoring système pour l'admin.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

function StatusCard({
  title,
  status,
  value,
  unit,
  icon,
  trend,
}: {
  title: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}) {
  const statusConfig = {
    healthy: { color: 'text-green-500', label: 'Sain' },
    warning: { color: 'text-yellow-500', label: 'Avertissement' },
    critical: { color: 'text-red-500', label: 'Critique' },
  };

  const config = statusConfig[status];

  return (
    <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm text-muted-foreground font-normal">{title}</CardDescription>
          <div className={config.color}>{icon}</div>
        </div>
        <div className="flex items-end justify-between">
          <CardTitle className="text-3xl tracking-tight text-foreground">
            {value}
            {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
          </CardTitle>
          <Badge
            className={
              status === 'healthy'
                ? 'bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]'
                : status === 'warning'
                  ? 'bg-[rgba(234,179,8,0.1)] text-[#eab308] dark:bg-[rgba(234,179,8,0.1)] dark:text-[#eab308]'
                  : 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]'
            }
          >
            {config.label}
          </Badge>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
            {trend === 'stable' && <Clock className="w-3 h-3" />}
            {trend === 'up' && 'En hausse'}
            {trend === 'down' && 'En baisse'}
            {trend === 'stable' && 'Stable'}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

export default function SystemMonitoringPage() {
  const router = useRouter();

  // Simulation de données système (à remplacer par de vraies API)
  const systemStatus = {
    server: {
      status: 'healthy' as const,
      uptime: '99.9%',
      responseTime: '45ms',
      requests: 1250,
    },
    database: {
      status: 'healthy' as const,
      connections: 45,
      maxConnections: 100,
      queryTime: '12ms',
      size: '2.4 GB',
    },
    cpu: {
      status: 'warning' as const,
      usage: 68,
      cores: 4,
      temperature: '52°C',
    },
    memory: {
      status: 'healthy' as const,
      used: 6.2,
      total: 16,
      percentage: 38.75,
    },
    disk: {
      status: 'healthy' as const,
      used: 120,
      total: 500,
      percentage: 24,
    },
    network: {
      status: 'healthy' as const,
      incoming: '125 Mbps',
      outgoing: '89 Mbps',
      latency: '8ms',
    },
  };

  const { data: logsData } = useQuery({
    queryKey: ['admin-logs-recent'],
    queryFn: () => adminApi.getLogs(1, 10),
  });

  const recentErrors = logsData?.logs?.filter((log: any) =>
    log.action.includes('ERROR') || log.action.includes('FAIL')
  ) || [];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="admin-page-title">Monitoring système</h1>
            <p className="admin-page-description">
              Surveillance en temps réel de l'infrastructure et des performances
            </p>
          </div>
        </div>
        <Button variant="outline" className="border-border">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* System Status Overview */}
      <div>
        <h2 className="text-base font-normal text-foreground mb-4">État du système</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCard
            title="Serveur"
            status={systemStatus.server.status}
            value={systemStatus.server.uptime}
            icon={<Server className="w-5 h-5" />}
            trend="stable"
          />
          <StatusCard
            title="Base de données"
            status={systemStatus.database.status}
            value={systemStatus.database.connections}
            unit={`/${systemStatus.database.maxConnections}`}
            icon={<Database className="w-5 h-5" />}
            trend="stable"
          />
          <StatusCard
            title="CPU"
            status={systemStatus.cpu.status}
            value={systemStatus.cpu.usage}
            unit="%"
            icon={<Cpu className="w-5 h-5" />}
            trend="up"
          />
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
              <HardDrive className="w-5 h-5" />
              Mémoire
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground font-normal">Utilisation de la mémoire système</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Utilisée</span>
                <span className="text-sm font-medium">
                  {systemStatus.memory.used} GB / {systemStatus.memory.total} GB
                </span>
              </div>
              <Progress value={systemStatus.memory.percentage} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {systemStatus.memory.percentage.toFixed(1)}% utilisé
                </span>
                <Badge
                  className={
                    systemStatus.memory.percentage > 80
                      ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]'
                      : 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]'
                  }
                >
                  {systemStatus.memory.percentage > 80 ? 'Élevé' : 'Normal'}
                </Badge>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Disponible</div>
                <div className="font-medium">
                  {(systemStatus.memory.total - systemStatus.memory.used).toFixed(1)} GB
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Cache</div>
                <div className="font-medium">2.1 GB</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
              <HardDrive className="w-5 h-5" />
              Stockage
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground font-normal">Utilisation de l'espace disque</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Utilisé</span>
                <span className="text-sm font-medium">
                  {systemStatus.disk.used} GB / {systemStatus.disk.total} GB
                </span>
              </div>
              <Progress value={systemStatus.disk.percentage} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {systemStatus.disk.percentage}% utilisé
                </span>
                <Badge
                  className={
                    systemStatus.disk.percentage > 80
                      ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]'
                      : 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]'
                  }
                >
                  {systemStatus.disk.percentage > 80 ? 'Élevé' : 'Normal'}
                </Badge>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Disponible</div>
                <div className="font-medium">
                  {systemStatus.disk.total - systemStatus.disk.used} GB
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Base de données</div>
                <div className="font-medium">{systemStatus.database.size}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardHeader className="p-0 mb-6">
            <CardDescription className="text-sm text-muted-foreground font-normal">Performance serveur</CardDescription>
            <CardTitle className="text-2xl text-foreground">{systemStatus.server.responseTime}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm text-muted-foreground">
              Temps de réponse moyen
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {systemStatus.server.requests} requêtes/min
            </div>
          </CardContent>
        </Card>

        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardHeader className="p-0 mb-6">
            <CardDescription className="text-sm text-muted-foreground font-normal">Performance base de données</CardDescription>
            <CardTitle className="text-2xl text-foreground">{systemStatus.database.queryTime}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm text-muted-foreground">
              Temps de requête moyen
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {systemStatus.database.connections} connexions actives
            </div>
          </CardContent>
        </Card>

        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardHeader className="p-0 mb-6">
            <CardDescription className="text-sm text-muted-foreground font-normal">Réseau</CardDescription>
            <CardTitle className="text-2xl text-foreground">{systemStatus.network.latency}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm text-muted-foreground">Latence moyenne</div>
            <div className="text-xs text-muted-foreground mt-1">
              ↓ {systemStatus.network.incoming} ↑ {systemStatus.network.outgoing}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPU Details */}
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
            <Cpu className="w-5 h-5" />
            Utilisation CPU
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-normal">Charge processeur en temps réel</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Utilisation</span>
              <span className="text-sm font-medium text-foreground">{systemStatus.cpu.usage}%</span>
            </div>
            <Progress value={systemStatus.cpu.usage} className="h-2" />
          </div>
          <Separator className="bg-border" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Cœurs</div>
              <div className="font-medium">{systemStatus.cpu.cores}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Température</div>
              <div className="font-medium">{systemStatus.cpu.temperature}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Charge moyenne</div>
              <div className="font-medium">1.2</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Erreurs récentes
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground font-normal">Dernières erreurs système détectées</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                {recentErrors.length} erreur(s) détectée(s) dans les logs récents. Vérifiez les
                logs pour plus de détails.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* System Health Summary */}
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Résumé de santé
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-foreground">Serveur opérationnel</div>
                <div className="text-sm text-muted-foreground">
                  Uptime: {systemStatus.server.uptime}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-foreground">Base de données connectée</div>
                <div className="text-sm text-muted-foreground">
                  {systemStatus.database.connections} connexions actives
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {systemStatus.cpu.status === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <div>
                <div className="font-medium text-foreground">CPU</div>
                <div className="text-sm text-muted-foreground">
                  {systemStatus.cpu.usage}% utilisé
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium">Réseau stable</div>
                <div className="text-sm text-muted-foreground">
                  Latence: {systemStatus.network.latency}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


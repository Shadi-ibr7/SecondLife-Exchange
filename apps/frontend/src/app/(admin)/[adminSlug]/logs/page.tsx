'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Shield, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/admin/ResponsiveTable';

function LogStatsCard({
  title,
  value,
  icon: Icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg?: string;
}) {
  return (
    <Card className="h-auto min-h-[88px]">
      <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div
          className={`relative rounded-md shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${
            iconBg || 'bg-[#1a1a1c]'
          }`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#9a9a9d]" />
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-4 sm:leading-5">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-normal text-foreground leading-7 sm:leading-8">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page, search, typeFilter],
    queryFn: () => adminApi.getLogs(page, 50),
  });

  // Calculate stats from logs
  const logs = data?.logs || [];
  const totalLogs = data?.total || 0;
  const securityEvents = logs.filter((log: any) =>
    log.action?.toLowerCase().includes('security') ||
    log.action?.toLowerCase().includes('login') ||
    log.action?.toLowerCase().includes('ban')
  ).length;
  const alerts = logs.filter((log: any) =>
    log.action?.toLowerCase().includes('alert') ||
    log.action?.toLowerCase().includes('warning')
  ).length;
  const errors = logs.filter((log: any) =>
    log.action?.toLowerCase().includes('error') ||
    log.action?.toLowerCase().includes('failed')
  ).length;

  const getTypeBadge = (action: string) => {
    const actionLower = action?.toLowerCase() || '';
    if (
      actionLower.includes('security') ||
      actionLower.includes('login') ||
      actionLower.includes('ban') ||
      actionLower.includes('user banned')
    ) {
      return (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#d9a055]" />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.2)] text-[#d9a055]">
            Sécurité
          </span>
        </div>
      );
    }
    if (actionLower.includes('alert') || actionLower.includes('warning')) {
      return (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#d9a055]" />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.1)] text-[#d9a055]">
            Alerte
          </span>
        </div>
      );
    }
    if (actionLower.includes('error') || actionLower.includes('failed')) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#ef4444]" />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(239,68,68,0.1)] text-[#ef4444]">
            Erreur
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-[#9a9a9d]" />
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] text-[#9a9a9d]">
          Info
        </span>
      </div>
    );
  };

  const filteredLogs = logs.filter((log: any) => {
    if (typeFilter === 'security') {
      const actionLower = log.action?.toLowerCase() || '';
      return (
        actionLower.includes('security') ||
        actionLower.includes('login') ||
        actionLower.includes('ban')
      );
    }
    if (typeFilter === 'alert') {
      const actionLower = log.action?.toLowerCase() || '';
      return actionLower.includes('alert') || actionLower.includes('warning');
    }
    if (typeFilter === 'error') {
      const actionLower = log.action?.toLowerCase() || '';
      return actionLower.includes('error') || actionLower.includes('failed');
    }
    if (search) {
      return (
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.admin?.email?.toLowerCase().includes(search.toLowerCase()) ||
        log.meta?.toString().toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Logs et sécurité</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-[3.987px]">
        <h1 className="admin-page-title">Logs et sécurité</h1>
        <p className="admin-page-description">
          Consulter l'historique des actions et événements système
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LogStatsCard
          title="Total logs"
          value={totalLogs.toLocaleString()}
          icon={Info}
          iconBg="bg-[#1a1a1c]"
        />
        <LogStatsCard
          title="Événements sécurité"
          value={securityEvents}
          icon={Shield}
          iconBg="bg-[rgba(45,90,69,0.1)]"
        />
        <LogStatsCard
          title="Alertes"
          value={alerts}
          icon={AlertTriangle}
          iconBg="bg-[rgba(217,160,85,0.1)]"
        />
        <LogStatsCard
          title="Erreurs"
          value={errors}
          icon={AlertCircle}
          iconBg="bg-[rgba(239,68,68,0.1)]"
        />
      </div>

      {/* Filters */}
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[90.293px]">
        <CardContent className="p-0 flex items-center gap-4 h-[39.996px]">
          <div className="flex-1 relative h-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-full bg-input-background border-border text-foreground"
            />
          </div>
          <div className="flex gap-2 h-[31.986px]">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
              className={typeFilter === 'all' ? 'bg-[#2d5a45] hover:bg-[#2d5a45]/90' : 'border-border'}
            >
              Tous
            </Button>
            <Button
              variant={typeFilter === 'security' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('security')}
              className={typeFilter === 'security' ? 'bg-[#2d5a45] hover:bg-[#2d5a45]/90' : 'border-border'}
            >
              Sécurité
            </Button>
            <Button
              variant={typeFilter === 'alert' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('alert')}
              className={typeFilter === 'alert' ? 'bg-[#2d5a45] hover:bg-[#2d5a45]/90' : 'border-border'}
            >
              Alertes
            </Button>
            <Button
              variant={typeFilter === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('error')}
              className={typeFilter === 'error' ? 'bg-[#2d5a45] hover:bg-[#2d5a45]/90' : 'border-border'}
            >
              Erreurs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="h-auto min-h-[400px] sm:min-h-[500px]">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 h-full flex flex-col">
          {filteredLogs.length > 0 ? (
            <ResponsiveTable
              headers={[
                { key: 'type', label: 'Type' },
                { key: 'timestamp', label: 'Horodatage' },
                { key: 'user', label: 'Utilisateur' },
                { key: 'action', label: 'Action' },
                { key: 'ip', label: 'IP' },
                { key: 'details', label: 'Détails' },
              ]}
              rows={filteredLogs.map((log: any) => ({
                key: log.id,
                cells: [
                  {
                    key: 'type',
                    content: getTypeBadge(log.action || 'Info'),
                  },
                  {
                    key: 'timestamp',
                    content: (
                      <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: fr })}
                      </p>
                    ),
                  },
                  {
                    key: 'user',
                    content: (
                      <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                        {log.admin?.email || log.adminId || 'system'}
                      </p>
                    ),
                  },
                  {
                    key: 'action',
                    content: (
                      <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                        {log.action || 'N/A'}
                      </p>
                    ),
                  },
                  {
                    key: 'ip',
                    content: (
                      <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                        {log.meta?.ip || log.meta?.ipAddress || 'localhost'}
                      </p>
                    ),
                  },
                  {
                    key: 'details',
                    content: (
                      <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                        {log.meta?.details ||
                          log.meta?.message ||
                          log.resourceId ||
                          'Admin panel access'}
                      </p>
                    ),
                  },
                ],
              }))}
            />
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-[#6f6f73] dark:text-[#9a9a9d]" />
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d]">Aucun log trouvé</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

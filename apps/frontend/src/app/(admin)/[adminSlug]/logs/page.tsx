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
    <Card className="h-[88.236px] pt-[17.138px] px-[17.138px] pb-[1.155px]">
      <CardContent className="p-0 flex items-center gap-[11.997px] h-[53.959px]">
        <div
          className={`relative rounded-[6px] shrink-0 size-[39.996px] flex items-center justify-center ${
            iconBg || 'bg-[#1a1a1c]'
          }`}
        >
          <Icon className="w-[19.989px] h-[19.989px] text-[#9a9a9d]" />
        </div>
        <div className="flex flex-col gap-[1.984px]">
          <p className="text-sm text-muted-foreground font-normal leading-[20px] tracking-[-0.1504px]">
            {title}
          </p>
          <p className="text-2xl font-normal text-foreground leading-[32px] tracking-[0.0703px]">
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
      <div className="grid grid-cols-4 gap-4 h-[88.236px]">
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
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[679.079px]">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border h-[44.56px]">
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Horodatage
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Utilisateur
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Action
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    IP
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Détails
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any, index: number) => {
                    const isLast = index === filteredLogs.length - 1;
                    return (
                      <tr
                        key={log.id}
                        className={`${
                          !isLast
                            ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]'
                            : ''
                        } h-[73.1px]`}
                      >
                        <td className="px-4">{getTypeBadge(log.action || 'Info')}</td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: fr })}
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            {log.admin?.email || log.adminId || 'system'}
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            {log.action || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {log.meta?.ip || log.meta?.ipAddress || 'localhost'}
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {log.meta?.details ||
                              log.meta?.message ||
                              log.resourceId ||
                              'Admin panel access'}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-sm text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      Aucun log trouvé.
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>
          </div>

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

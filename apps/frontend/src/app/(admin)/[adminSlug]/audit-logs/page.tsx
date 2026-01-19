'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Shield, AlertTriangle, AlertCircle, Info, Filter, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/admin/ResponsiveTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Types d'actions pour le filtre
const ACTION_TYPES = [
  { value: 'all', label: 'Toutes les actions' },
  { value: 'ADMIN_LOGIN_SUCCESS', label: 'Connexion réussie' },
  { value: 'ADMIN_LOGIN_FAIL', label: 'Connexion échouée' },
  { value: 'ADMIN_LOGIN_LOCKED', label: 'Compte bloqué' },
  { value: 'BAN_USER', label: 'Bannissement utilisateur' },
  { value: 'UNBAN_USER', label: 'Débannissement utilisateur' },
  { value: 'DELETE_ITEM', label: 'Suppression item' },
  { value: 'DELETE_EXCHANGE', label: 'Suppression échange' },
  { value: 'CREATE_ECO_CONTENT', label: 'Création contenu éco' },
  { value: 'UPDATE_ECO_CONTENT', label: 'Modification contenu éco' },
  { value: 'DELETE_ECO_CONTENT', label: 'Suppression contenu éco' },
  { value: 'ENABLE_2FA', label: 'Activation 2FA' },
  { value: 'DISABLE_2FA', label: 'Désactivation 2FA' },
];

const TARGET_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'User', label: 'Utilisateur' },
  { value: 'EcoContent', label: 'Contenu éco' },
  { value: 'Item', label: 'Item' },
  { value: 'Exchange', label: 'Échange' },
  { value: 'Auth', label: 'Authentification' },
  { value: 'System', label: 'Système' },
];

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
          <Icon className="w-5 h-5 sm:w-6 sm:w-6 text-[#9a9a9d]" />
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

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');

  const filters = {
    actionType: actionTypeFilter !== 'all' ? actionTypeFilter : undefined,
    targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    requestId: requestId || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, filters],
    queryFn: () => adminApi.getLogs(page, 50, filters),
  });

  const logs = data?.logs || [];
  const totalLogs = data?.total || 0;

  // Calculer les statistiques
  const securityEvents = logs.filter((log: any) =>
    log.action?.includes('LOGIN') || log.action?.includes('BAN') || log.action?.includes('2FA')
  ).length;

  const failedLogins = logs.filter((log: any) => log.action === 'ADMIN_LOGIN_FAIL').length;
  const lockedAccounts = logs.filter((log: any) => log.action === 'ADMIN_LOGIN_LOCKED').length;

  const getActionBadge = (action: string) => {
    const actionUpper = action?.toUpperCase() || '';
    if (actionUpper.includes('LOGIN_SUCCESS')) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          Succès
        </Badge>
      );
    }
    if (actionUpper.includes('LOGIN_FAIL') || actionUpper.includes('LOGIN_LOCKED')) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
          Échec
        </Badge>
      );
    }
    if (actionUpper.includes('BAN') || actionUpper.includes('DELETE')) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
          Critique
        </Badge>
      );
    }
    if (actionUpper.includes('2FA')) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
          Sécurité
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
        Info
      </Badge>
    );
  };

  const clearFilters = () => {
    setActionTypeFilter('all');
    setTargetTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setRequestId('');
  };

  const hasActiveFilters = actionTypeFilter !== 'all' || targetTypeFilter !== 'all' || startDate || endDate || requestId;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Logs d'audit</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="admin-page-title">Logs d'audit</h1>
          <p className="admin-page-description">Historique complet des actions administratives</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LogStatsCard
          title="Total logs"
          value={totalLogs}
          icon={Shield}
          iconBg="bg-blue-500/10"
        />
        <LogStatsCard
          title="Événements sécurité"
          value={securityEvents}
          icon={AlertTriangle}
          iconBg="bg-yellow-500/10"
        />
        <LogStatsCard
          title="Connexions échouées"
          value={failedLogins}
          icon={AlertCircle}
          iconBg="bg-red-500/10"
        />
        <LogStatsCard
          title="Comptes bloqués"
          value={lockedAccounts}
          icon={Info}
          iconBg="bg-orange-500/10"
        />
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Filtres</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto h-7 px-2 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtre par type d'action */}
            <div className="space-y-2">
              <Label htmlFor="actionType" className="text-xs text-muted-foreground">
                Type d'action
              </Label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger id="actionType" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par type de ressource */}
            <div className="space-y-2">
              <Label htmlFor="targetType" className="text-xs text-muted-foreground">
                Type de ressource
              </Label>
              <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                <SelectTrigger id="targetType" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par date de début */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                Date de début
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Filtre par date de fin */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                Date de fin
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Filtre par requestId */}
          <div className="space-y-2">
            <Label htmlFor="requestId" className="text-xs text-muted-foreground">
              Request ID (traçabilité)
            </Label>
            <Input
              id="requestId"
              placeholder="Filtrer par request ID"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table des logs */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4">
          {logs.length > 0 ? (
            <ResponsiveTable
              headers={[
                { key: 'date', label: 'Date' },
                { key: 'admin', label: 'Admin' },
                { key: 'action', label: 'Action' },
                { key: 'target', label: 'Cible' },
                { key: 'ip', label: 'IP' },
                { key: 'status', label: 'Statut' },
              ]}
              rows={logs.map((log: any) => ({
                key: log.id,
                cells: [
                  {
                    key: 'date',
                    content: (
                      <p className="text-sm font-normal text-foreground">
                        {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </p>
                    ),
                  },
                  {
                    key: 'admin',
                    content: (
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-foreground">
                          {log.admin?.displayName || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.admin?.email || ''}
                          {log.actorRole && (
                            <span className="ml-2 text-xs">
                              ({log.actorRole})
                            </span>
                          )}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'action',
                    content: (
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.resourceType}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'target',
                    content: (
                      <p className="text-sm text-muted-foreground">
                        {log.resourceId ? `ID: ${log.resourceId.substring(0, 8)}...` : 'N/A'}
                      </p>
                    ),
                  },
                  {
                    key: 'ip',
                    content: (
                      <p className="text-sm text-muted-foreground font-mono text-xs">
                        {log.ip || 'N/A'}
                      </p>
                    ),
                  },
                  {
                    key: 'status',
                    content: getActionBadge(log.action),
                  },
                ],
              }))}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Aucun log trouvé</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {data.totalPages} ({totalLogs} logs)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
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

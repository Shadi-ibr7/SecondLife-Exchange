/**
 * FICHIER: logs/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un log admin.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Shield,
  Activity,
  Monitor,
  Globe,
  Code,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CREATE_USER: { label: 'Création utilisateur', variant: 'default' },
  UPDATE_USER: { label: 'Mise à jour utilisateur', variant: 'secondary' },
  DELETE_USER: { label: 'Suppression utilisateur', variant: 'destructive' },
  BAN_USER: { label: 'Bannissement utilisateur', variant: 'destructive' },
  UNBAN_USER: { label: 'Déban utilisateur', variant: 'secondary' },
  CREATE_ITEM: { label: 'Création objet', variant: 'default' },
  UPDATE_ITEM: { label: 'Mise à jour objet', variant: 'secondary' },
  DELETE_ITEM: { label: 'Suppression objet', variant: 'destructive' },
  ARCHIVE_ITEM: { label: 'Archivage objet', variant: 'secondary' },
  CREATE_EXCHANGE: { label: 'Création échange', variant: 'default' },
  DELETE_EXCHANGE: { label: 'Suppression échange', variant: 'destructive' },
  CREATE_THEME: { label: 'Création thème', variant: 'default' },
  UPDATE_THEME: { label: 'Mise à jour thème', variant: 'secondary' },
  DELETE_THEME: { label: 'Suppression thème', variant: 'destructive' },
  CREATE_ECO_CONTENT: { label: 'Création contenu éco', variant: 'default' },
  UPDATE_ECO_CONTENT: { label: 'Mise à jour contenu éco', variant: 'secondary' },
  DELETE_ECO_CONTENT: { label: 'Suppression contenu éco', variant: 'destructive' },
  DELETE_THREAD: { label: 'Suppression thread', variant: 'destructive' },
  DELETE_POST: { label: 'Suppression post', variant: 'destructive' },
  RESOLVE_REPORT: { label: 'Résolution signalement', variant: 'secondary' },
  DELETE_REPORT: { label: 'Suppression signalement', variant: 'destructive' },
};

export default function LogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: log, isLoading } = useQuery({
    queryKey: ['admin-log-detail', id],
    queryFn: () => adminApi.getLogById(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails du log</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Log non trouvé</h1>
          <p className="text-muted-foreground">Le log demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/logs`)} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const actionConfig = ACTION_LABELS[log.action] || {
    label: log.action,
    variant: 'outline' as const,
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="admin-page-title">Détails du log</h1>
              <Badge
                className={
                  actionConfig.variant === 'destructive'
                    ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]'
                    : actionConfig.variant === 'default'
                      ? 'bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]'
                      : 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]'
                }
              >
                {actionConfig.label}
              </Badge>
            </div>
            <p className="admin-page-description">
              {format(new Date(log.createdAt), 'PPpp', { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Details */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <Activity className="w-5 h-5" />
                Action effectuée
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Détails de l'action administrateur
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Action</h3>
                  <Badge
                    className={`text-base px-3 py-1 ${
                      actionConfig.variant === 'destructive'
                        ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]'
                        : actionConfig.variant === 'default'
                          ? 'bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]'
                          : 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]'
                    }`}
                  >
                    {actionConfig.label}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Type de ressource</h3>
                  <Badge variant="outline" className="text-base px-3 py-1 border-border text-muted-foreground">
                    {log.resourceType || 'N/A'}
                  </Badge>
                </div>
              </div>

              {log.resourceId && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">ID de la ressource</h3>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-3 py-2 rounded-md font-mono">
                        {log.resourceId}
                      </code>
                    </div>
                  </div>
                </>
              )}

              {log.meta && Object.keys(log.meta).length > 0 && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Métadonnées</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <Monitor className="w-5 h-5" />
                Informations techniques
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Détails de la requête et de l'environnement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {log.ip && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Adresse IP
                  </span>
                  <code className="text-sm font-mono">{log.ip}</code>
                </div>
              )}

              {log.userAgent && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">User Agent</h3>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {log.userAgent}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <Shield className="w-5 h-5" />
                Administrateur
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Utilisateur qui a effectué l'action
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {log.admin ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={log.admin.avatarUrl || undefined} />
                      <AvatarFallback>
                        {log.admin.displayName?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{log.admin.displayName}</div>
                      <div className="text-sm text-muted-foreground">{log.admin.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-border" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/users/${log.admin.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le profil
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Admin inconnu</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Informations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs text-foreground">{log.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">
                  {format(new Date(log.createdAt), 'PP', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Heure</span>
                <span className="text-foreground">
                  {format(new Date(log.createdAt), 'HH:mm:ss', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {log.resourceType || 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


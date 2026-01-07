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
          <h1 className="text-2xl font-medium mb-1">Détails du log</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Log non trouvé</h1>
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
              <h1 className="text-2xl font-medium mb-1">Détails du log</h1>
              <Badge variant={actionConfig.variant}>{actionConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {format(new Date(log.createdAt), 'PPpp', { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Action effectuée
              </CardTitle>
              <CardDescription>Détails de l'action administrateur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Action</h3>
                  <Badge variant={actionConfig.variant} className="text-base px-3 py-1">
                    {actionConfig.label}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Type de ressource</h3>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {log.resourceType || 'N/A'}
                  </Badge>
                </div>
              </div>

              {log.resourceId && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">ID de la ressource</h3>
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
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Métadonnées</h3>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Informations techniques
              </CardTitle>
              <CardDescription>Détails de la requête et de l'environnement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">User Agent</h3>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Administrateur
              </CardTitle>
              <CardDescription>Utilisateur qui a effectué l'action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <div className="font-medium">{log.admin.displayName}</div>
                      <div className="text-sm text-muted-foreground">{log.admin.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
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
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{log.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{format(new Date(log.createdAt), 'PP', { locale: fr })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Heure</span>
                <span>{format(new Date(log.createdAt), 'HH:mm:ss', { locale: fr })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">{log.resourceType || 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


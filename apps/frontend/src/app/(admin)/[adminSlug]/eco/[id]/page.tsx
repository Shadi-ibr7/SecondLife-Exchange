/**
 * FICHIER: eco/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un contenu écologique pour l'admin.
 */

'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Tag,
  FileText,
  Loader2,
  Save,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EcoContentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    url: '',
    summary: '',
    kind: '',
    locale: '',
    tags: '',
    source: '',
    published: false,
  });

  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-eco-detail', id],
    queryFn: () => adminApi.getEcoContentById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof editForm) =>
      adminApi.updateEcoContent(id, {
        title: data.title,
        url: data.url,
        summary: data.summary,
        kind: data.kind,
        locale: data.locale,
        source: data.source,
        published: data.published,
        tags: data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Contenu mis à jour');
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-eco-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-eco'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteEcoContent(id),
    onSuccess: () => {
      toast.success('Contenu supprimé');
      router.push(`/${ADMIN_BASE_PATH}/eco`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const isPublished = !!content?.publishedAt;

  const togglePublishMutation = useMutation({
    mutationFn: () => adminApi.updateEcoContent(id, { published: !isPublished }),
    onSuccess: () => {
      toast.success(isPublished ? 'Contenu dépublié' : 'Contenu publié');
      queryClient.invalidateQueries({ queryKey: ['admin-eco-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-eco'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur');
    },
  });

  const openEditDialog = () => {
    if (content) {
      setEditForm({
        title: content.title || '',
        url: content.url || '',
        summary: content.summary || '',
        kind: content.kind || '',
        locale: content.locale || 'fr',
        tags: content.tags?.join(', ') || '',
        source: content.source || '',
        published: !!content.publishedAt,
      });
      setEditDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Détails du contenu</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Contenu non trouvé</h1>
          <p className="text-muted-foreground">Le contenu demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/eco`)} className="mt-4">
            Retour à la liste
          </Button>
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium mb-1">{content.title}</h1>
              {isPublished ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Publié
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Brouillon
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Créé le {format(new Date(content.createdAt), 'PPpp', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => togglePublishMutation.mutate()}
            disabled={togglePublishMutation.isPending}
          >
            {togglePublishMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isPublished ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {isPublished ? 'Dépublier' : 'Publier'}
          </Button>
          <Button variant="outline" onClick={openEditDialog}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Alert si brouillon */}
      {!isPublished && (
        <Alert>
          <EyeOff className="h-4 w-4" />
          <AlertTitle>Brouillon</AlertTitle>
          <AlertDescription>
            Ce contenu n'est pas encore publié. Il ne sera pas visible par les utilisateurs.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* URL */}
          {content.url && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {content.url}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contenu
              </CardTitle>
              <CardDescription>Article éco-éducatif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.summary && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Résumé</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{content.summary}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Type</h3>
                  <Badge variant="secondary">{content.kind}</Badge>
                </div>
                {content.source && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Source</h3>
                    <span className="text-sm text-muted-foreground">{content.source}</span>
                  </div>
                )}
              </div>

              {content.tags && content.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {content.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Publication</span>
                {isPublished ? (
                  <Badge variant="default">Publié</Badge>
                ) : (
                  <Badge variant="secondary">Brouillon</Badge>
                )}
              </div>
              {content.kind && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{content.kind}</Badge>
                </div>
              )}
              {content.locale && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Locale</span>
                  <Badge variant="outline">{content.locale}</Badge>
                </div>
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
                <span className="font-mono text-xs">{content.id}</span>
              </div>
              {content.publishedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Publié le</span>
                  <span>{format(new Date(content.publishedAt), 'PP', { locale: fr })}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Créé le</span>
                <span>{format(new Date(content.createdAt), 'PP', { locale: fr })}</span>
              </div>
              {content.updatedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mis à jour</span>
                  <span>{format(new Date(content.updatedAt), 'PP', { locale: fr })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => togglePublishMutation.mutate()}
                disabled={togglePublishMutation.isPending}
              >
                {togglePublishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isPublished ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {isPublished ? 'Dépublier' : 'Publier'}
              </Button>
              <Button variant="outline" className="w-full" onClick={openEditDialog}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le contenu</DialogTitle>
            <DialogDescription>Modifiez les informations du contenu écologique</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kind">Type</Label>
                <Input
                  id="kind"
                  value={editForm.kind}
                  onChange={(e) => setEditForm({ ...editForm, kind: e.target.value })}
                  placeholder="article, video, infographic..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Résumé</Label>
              <Textarea
                id="summary"
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locale">Locale</Label>
                <Input
                  id="locale"
                  value={editForm.locale}
                  onChange={(e) => setEditForm({ ...editForm, locale: e.target.value })}
                  placeholder="fr, en, ma..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="recyclage, économie, durable"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="published">Publié</Label>
              <Switch
                id="published"
                checked={editForm.published}
                onCheckedChange={(checked) => setEditForm({ ...editForm, published: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => updateMutation.mutate(editForm)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le contenu</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce contenu ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{content.title}</strong> sera supprimé de manière permanente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


/**
 * FICHIER: themes/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un thème IA pour l'admin.
 */

'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Globe,
  MessageSquare,
  Lightbulb,
  RefreshCw,
  Loader2,
  Play,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
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

export default function ThemeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const [localesInput, setLocalesInput] = useState('FR,MA,JP,US,BR');
  const [suggestionsPage, setSuggestionsPage] = useState(1);

  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    impactText: '',
    isActive: false,
  });

  const { data: theme, isLoading } = useQuery({
    queryKey: ['admin-theme-detail', id],
    queryFn: () => adminApi.getThemeById(id),
  });

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['admin-theme-suggestions', id, suggestionsPage],
    queryFn: () => adminApi.getThemeSuggestions(id, suggestionsPage, 10, '-createdAt'),
    enabled: suggestionsDialogOpen,
  });

  const { data: suggestionsStats } = useQuery({
    queryKey: ['admin-theme-suggestions-stats', id],
    queryFn: () => adminApi.getThemeSuggestionStats(id),
    enabled: suggestionsDialogOpen,
  });

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateTheme(id),
    onSuccess: () => {
      toast.success('Thème activé');
      queryClient.invalidateQueries({ queryKey: ['admin-theme-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Impossible d\'activer le thème');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof editForm) => adminApi.updateTheme(id, data),
    onSuccess: () => {
      toast.success('Thème mis à jour');
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-theme-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteTheme(id),
    onSuccess: () => {
      toast.success('Thème supprimé');
      router.push(`/${ADMIN_BASE_PATH}/themes`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: () => {
      const locales = localesInput
        .split(',')
        .map((l) => l.trim().toUpperCase())
        .filter(Boolean);
      return adminApi.generateThemeSuggestions(id, locales);
    },
    onSuccess: (data) => {
      toast.success(`${data.length} suggestion(s) générée(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-theme-suggestions', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-theme-suggestions-stats', id] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la génération');
    },
  });

  const openEditDialog = () => {
    if (theme) {
      setEditForm({
        title: theme.title,
        slug: theme.slug,
        impactText: theme.impactText || '',
        isActive: theme.isActive,
      });
      setEditDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Détails thème</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Thème non trouvé</h1>
          <p className="text-muted-foreground">Le thème demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/themes`)} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const weekStart = new Date(theme.startOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

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
              <h1 className="text-2xl font-medium mb-1">{theme.title}</h1>
              {theme.isActive ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Actif
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Inactif
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Semaine du {format(weekStart, 'PP', { locale: fr })} au{' '}
              {format(weekEnd, 'PP', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!theme.isActive && (
            <Button
              variant="default"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Activer
            </Button>
          )}
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

      {/* Alert si actif */}
      {theme.isActive && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Thème actif</AlertTitle>
          <AlertDescription>
            Ce thème est actuellement actif et visible par tous les utilisateurs de la plateforme.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions IA</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Theme Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Informations du thème
                  </CardTitle>
                  <CardDescription>Détails et contenu du thème</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Titre</h3>
                    <p className="text-lg font-semibold">{theme.title}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Slug</h3>
                    <Badge variant="outline" className="font-mono">
                      {theme.slug}
                    </Badge>
                  </div>

                  <Separator />

                  {theme.description && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Description</h3>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{theme.description}</p>
                      </div>
                    </div>
                  )}

                  {theme.impactText && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Texte d'impact</h3>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{theme.impactText}</p>
                      </div>
                    </div>
                  )}

                  {theme.examples && theme.examples.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Exemples</h3>
                      <div className="space-y-2">
                        {theme.examples.map((example: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500" />
                            <span className="text-sm">{example}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Période
                  </CardTitle>
                  <CardDescription>Dates de validité du thème</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Début</div>
                      <div className="font-semibold">
                        {format(weekStart, 'PPP', { locale: fr })}
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Fin</div>
                      <div className="font-semibold">{format(weekEnd, 'PPP', { locale: fr })}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Suggestions générées</span>
                    <Badge variant="secondary">{theme._count?.suggestions || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    {theme.isActive ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
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
                    <span className="font-mono text-xs">{theme.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>{format(new Date(theme.createdAt), 'PP', { locale: fr })}</span>
                  </div>
                  {theme.updatedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mis à jour</span>
                      <span>{format(new Date(theme.updatedAt), 'PP', { locale: fr })}</span>
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
                  {!theme.isActive && (
                    <Button
                      className="w-full"
                      onClick={() => activateMutation.mutate()}
                      disabled={activateMutation.isPending}
                    >
                      {activateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Activer ce thème
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={openEditDialog}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSuggestionsDialogOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Voir les suggestions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Suggestions IA
                  </CardTitle>
                  <CardDescription>
                    Suggestions d'objets générées par l'IA pour ce thème
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Locales (FR,MA,JP...)"
                    value={localesInput}
                    onChange={(e) => setLocalesInput(e.target.value)}
                    className="w-40"
                  />
                  <Button
                    onClick={() => generateSuggestionsMutation.mutate()}
                    disabled={generateSuggestionsMutation.isPending}
                  >
                    {generateSuggestionsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Générer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestionsData.suggestions.map((suggestion: any) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <Badge variant="outline">{suggestion.locale}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(suggestion.createdAt), 'PPp', { locale: fr })}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      {suggestion.examples && suggestion.examples.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {suggestion.examples.map((ex: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {ex}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {suggestionsData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {suggestionsPage} sur {suggestionsData.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSuggestionsPage((p) => Math.max(1, p - 1))}
                          disabled={suggestionsPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSuggestionsPage((p) => Math.min(suggestionsData.totalPages, p + 1))
                          }
                          disabled={suggestionsPage === suggestionsData.totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune suggestion générée pour ce thème</p>
                  <Button
                    className="mt-4"
                    onClick={() => generateSuggestionsMutation.mutate()}
                    disabled={generateSuggestionsMutation.isPending}
                  >
                    {generateSuggestionsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Générer des suggestions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le thème</DialogTitle>
            <DialogDescription>Modifiez les informations du thème</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impactText">Texte d'impact</Label>
              <Textarea
                id="impactText"
                value={editForm.impactText}
                onChange={(e) => setEditForm({ ...editForm, impactText: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Actif</Label>
              <Switch
                id="isActive"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
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
                <Edit className="w-4 h-4 mr-2" />
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
            <DialogTitle>Supprimer le thème</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce thème ? Cette action est
              irréversible et supprimera également toutes les suggestions associées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{theme.title}</strong> sera supprimé de manière permanente.
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


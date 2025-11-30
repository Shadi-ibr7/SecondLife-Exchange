'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Calendar,
  Plus,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { adminApi } from '@/lib/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ThemeFormValues = {
  title: string;
  slug: string;
  startOfWeek: string;
  impactText: string;
  isActive: boolean;
};

const getDefaultWeekDate = () => {
  const now = new Date();
  const day = now.getDay() || 7;
  if (day !== 1) {
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - (day - 1));
  }
  return now.toISOString().split('T')[0];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

export default function AdminThemesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedThemeForDetails, setSelectedThemeForDetails] = useState<any | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [localesInput, setLocalesInput] = useState('FR,MA,JP,US,BR');
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const [formValues, setFormValues] = useState<ThemeFormValues>({
    title: '',
    slug: '',
    startOfWeek: getDefaultWeekDate(),
    impactText: '',
    isActive: false,
  });

  const { data: themes, isLoading, error } = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => {
      try {
        const data = await adminApi.getThemes();
        console.log('📊 Thèmes récupérés:', data);
        return data;
      } catch (err) {
        console.error('❌ Erreur récupération thèmes:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const selectedTheme = useMemo(() => {
    const themesList = Array.isArray(themes) ? themes : [];
    if (!selectedThemeId) return null;
    return themesList.find((theme: any) => theme.id === selectedThemeId) || null;
  }, [themes, selectedThemeId]);

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['admin-theme-suggestions', selectedThemeId, suggestionsPage],
    queryFn: () =>
      adminApi.getThemeSuggestions(selectedThemeId!, suggestionsPage, 10, '-createdAt'),
    enabled: !!selectedThemeId && isSuggestionsOpen,
  });

  const { data: suggestionsStats } = useQuery({
    queryKey: ['admin-theme-suggestions-stats', selectedThemeId],
    queryFn: () => adminApi.getThemeSuggestionStats(selectedThemeId!),
    enabled: !!selectedThemeId && isSuggestionsOpen,
  });

  const resetForm = () => {
    setFormValues({
      title: '',
      slug: '',
      startOfWeek: getDefaultWeekDate(),
      impactText: '',
      isActive: false,
    });
    setSlugTouched(false);
    setEditingThemeId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openDetailsDialog = (theme: any) => {
    setSelectedThemeForDetails(theme);
    setIsDetailsOpen(true);
  };

  const openEditDialog = (theme: any) => {
    setFormValues({
      title: theme.title,
      slug: theme.slug,
      startOfWeek: new Date(theme.startOfWeek).toISOString().split('T')[0],
      impactText: theme.impactText || '',
      isActive: theme.isActive,
    });
    setSlugTouched(true);
    setEditingThemeId(theme.id);
    setIsFormOpen(true);
  };

  const upsertThemeMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formValues.title.trim(),
        slug: formValues.slug.trim(),
        startOfWeek: new Date(formValues.startOfWeek).toISOString(),
        impactText: formValues.impactText?.trim() || undefined,
        isActive: formValues.isActive,
      };

      if (!payload.title || !payload.slug) {
        throw new Error('Le titre et le slug sont obligatoires');
      }

      if (editingThemeId) {
        return adminApi.updateTheme(editingThemeId, payload);
      }
      return adminApi.createTheme(payload);
    },
    onSuccess: () => {
      toast.success(editingThemeId ? 'Thème mis à jour' : 'Thème créé');
      setIsFormOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Erreur sauvegarde thème');
    },
  });

  const activateThemeMutation = useMutation({
    mutationFn: (themeId: string) => adminApi.activateTheme(themeId),
    onSuccess: () => {
      toast.success('Thème activé');
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Impossible d’activer le thème');
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: (themeId: string) => adminApi.deleteTheme(themeId),
    onSuccess: () => {
      toast.success('Thème supprimé');
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Suppression impossible');
    },
  });

  const generateThemeMutation = useMutation({
    mutationFn: () => adminApi.generateTheme(),
    onSuccess: () => {
      toast.success('Thème généré avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Échec de la génération du thème');
    },
  });

  const generateMonthlyThemesMutation = useMutation({
    mutationFn: () => adminApi.generateMonthlyThemes(),
    onSuccess: (themes) => {
      toast.success(`${themes.length} thème(s) généré(s) pour le mois`);
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Échec de la génération des thèmes mensuels');
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: ({ themeId, locales }: { themeId: string; locales: string[] }) =>
      adminApi.generateThemeSuggestions(themeId, locales),
    onSuccess: (stats) => {
      toast.success(`${stats.created} suggestion(s) générée(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-theme-suggestions', selectedThemeId] });
      queryClient.invalidateQueries({ queryKey: ['admin-theme-suggestions-stats', selectedThemeId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Échec de la génération');
    },
  });

  const handleSubmitTheme = (event: React.FormEvent) => {
    event.preventDefault();
    upsertThemeMutation.mutate();
  };

  const handleGenerateSuggestions = () => {
    if (!selectedThemeId) return;
    const locales = localesInput
      .split(',')
      .map((loc) => loc.trim().toUpperCase())
      .filter(Boolean);
    generateSuggestionsMutation.mutate({ themeId: selectedThemeId, locales });
  };

  const handleOpenSuggestions = (themeId: string) => {
    setSelectedThemeId(themeId);
    setSuggestionsPage(1);
    setIsSuggestionsOpen(true);
  };

  const handleCloseSuggestions = () => {
    setIsSuggestionsOpen(false);
    setSelectedThemeId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Gestion des thèmes IA</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Gestion des thèmes IA</h1>
          <p className="text-destructive">
            Erreur lors du chargement des thèmes :{' '}
            {error instanceof Error ? error.message : 'Erreur inconnue'}
          </p>
        </div>
      </div>
    );
  }

  // S'assurer que themes est un tableau
  const themesList = Array.isArray(themes) ? themes : [];
  const totalThemes = themesList.length;
  const activeThemes = themesList.filter((t: any) => t.isActive).length;
  const totalSuggestions =
    themesList.reduce((acc: number, t: any) => acc + (t._count?.suggestions || 0), 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium mb-1">Gestion des thèmes IA</h1>
          <p className="text-muted-foreground">
            Surveillez et modérez les thèmes hebdomadaires générés automatiquement par l'IA.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:self-start">
          <Button
            onClick={() => generateThemeMutation.mutate()}
            disabled={generateThemeMutation.isLoading}
            variant="outline"
          >
            {generateThemeMutation.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer un thème
              </>
            )}
          </Button>
          <Button
            onClick={() => generateMonthlyThemesMutation.mutate()}
            disabled={generateMonthlyThemesMutation.isLoading}
          >
            {generateMonthlyThemesMutation.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Générer les 4 thèmes du mois
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Total thèmes</CardDescription>
              <CardTitle className="text-2xl">{totalThemes}</CardTitle>
            </div>
            <Sparkles className="w-5 h-5 text-primary" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Thèmes actifs</CardDescription>
              <CardTitle className="text-2xl">{activeThemes}</CardTitle>
            </div>
            <RefreshCw className="w-5 h-5 text-primary" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Suggestions totales</CardDescription>
              <CardTitle className="text-2xl">{totalSuggestions}</CardTitle>
            </div>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des thèmes</CardTitle>
          <CardDescription>
            {totalThemes} thème{totalThemes !== 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thème</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Date de début</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Suggestions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themesList.map((theme: any) => (
                <TableRow key={theme.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      {theme.photoUrl && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border">
                          <img
                            src={theme.photoUrl}
                            alt={theme.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-1">{theme.title}</div>
                        {theme.impactText && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {theme.impactText}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{theme.slug}</code>
                  </TableCell>
                  <TableCell>
                    {new Date(theme.startOfWeek).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    {theme.isActive ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell>{theme._count?.suggestions || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDetailsDialog(theme)}
                      aria-label="Voir détails"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenSuggestions(theme.id)}
                      aria-label="Suggestions"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    {!theme.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => activateThemeMutation.mutate(theme.id)}
                        disabled={activateThemeMutation.isLoading}
                        aria-label="Activer"
                      >
                        {activateThemeMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('Supprimer ce thème ?')) {
                          deleteThemeMutation.mutate(theme.id);
                        }
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {totalThemes === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                      <p className="font-medium">Aucun thème pour le moment</p>
                      <p className="text-sm">
                        Les thèmes sont générés automatiquement par l'IA chaque semaine
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingThemeId ? 'Modifier le thème' : 'Nouveau thème IA'}</DialogTitle>
            <DialogDescription>
              Définissez le titre, le slug et la description d’impact. La date correspond au lundi de
              la semaine ciblée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTheme} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme-title">Titre</Label>
                <Input
                  id="theme-title"
                  value={formValues.title}
                  onChange={(e) => {
                    setFormValues((prev) => ({
                      ...prev,
                      title: e.target.value,
                      slug:
                        !slugTouched && e.target.value
                          ? slugify(e.target.value)
                          : prev.slug,
                    }));
                  }}
                  placeholder="Thème de la semaine..."
                  required
                />
              </div>
              <div>
                <Label className="flex items-center justify-between" htmlFor="theme-slug">
                  Slug
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setFormValues((prev) => ({
                        ...prev,
                        slug: slugify(prev.title || prev.slug),
                      }))
                    }
                  >
                    Générer
                  </Button>
                </Label>
                <Input
                  id="theme-slug"
                  value={formValues.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setFormValues((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                  }}
                  placeholder="theme-hebdo"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme-date">Début de semaine</Label>
                <Input
                  id="theme-date"
                  type="date"
                  value={formValues.startOfWeek}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, startOfWeek: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <Label className="mb-1">Activer immédiatement</Label>
                  <p className="text-xs text-muted-foreground">
                    Ce thème remplacera l’actuel.
                  </p>
                </div>
                <Switch
                  checked={formValues.isActive}
                  onCheckedChange={(checked) =>
                    setFormValues((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="theme-impact">Texte d’impact</Label>
              <Textarea
                id="theme-impact"
                rows={4}
                placeholder="Pourquoi ce thème ? Quel impact sur la communauté ?"
                value={formValues.impactText}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, impactText: e.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={upsertThemeMutation.isLoading}>
                {upsertThemeMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingThemeId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSuggestionsOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseSuggestions();
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Suggestions IA · {selectedTheme?.title || 'Thème sélectionné'}
            </DialogTitle>
            <DialogDescription>
              Visualisez les idées générées et relancez l’IA pour rafraîchir la sélection.
            </DialogDescription>
          </DialogHeader>
          {!selectedTheme && (
            <p className="text-center text-muted-foreground py-8">
              Sélectionnez un thème pour voir les suggestions.
            </p>
          )}
          {selectedTheme && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Suggestions totales</CardDescription>
                    <CardTitle className="text-2xl">
                      {suggestionsStats?.total ?? selectedTheme._count?.suggestions ?? 0}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pays couverts</CardDescription>
                    <CardTitle className="text-2xl">
                      {suggestionsStats
                        ? Object.keys(suggestionsStats.byCountry || {}).length
                        : 0}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Catégories</CardDescription>
                    <CardTitle className="text-2xl">
                      {suggestionsStats
                        ? Object.keys(suggestionsStats.byCategory || {}).length
                        : 0}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Locales ciblées</p>
                    <p className="text-xs text-muted-foreground">
                      Utilisez des codes pays (FR, MA, JP...) séparés par une virgule.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Input
                      value={localesInput}
                      onChange={(e) => setLocalesInput(e.target.value)}
                      placeholder="FR,MA,JP..."
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateSuggestions}
                      disabled={generateSuggestionsMutation.isLoading}
                    >
                      {generateSuggestionsMutation.isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Relancer l’IA
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Objet</TableHead>
                        <TableHead>Pays</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Époque</TableHead>
                        <TableHead>Popularité</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suggestionsLoading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                          </TableCell>
                        </TableRow>
                      )}
                      {!suggestionsLoading &&
                        (suggestionsData?.suggestions?.length ? (
                          suggestionsData.suggestions.map((suggestion: any) => (
                            <TableRow key={suggestion.id}>
                              <TableCell>
                                <div className="font-medium">{suggestion.name}</div>
                                {suggestion.ecoReason && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {suggestion.ecoReason}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>{suggestion.country}</TableCell>
                              <TableCell>{suggestion.category}</TableCell>
                              <TableCell>{suggestion.era || '-'}</TableCell>
                              <TableCell>{suggestion.popularity ?? '-'}</TableCell>
                              <TableCell>
                                {new Date(suggestion.createdAt).toLocaleDateString('fr-FR')}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              <div className="flex flex-col items-center gap-2">
                                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                                <p className="font-medium">Aucune suggestion pour le moment</p>
                                <p className="text-sm">
                                  Cliquez sur "Relancer l'IA" pour générer des suggestions d'objets
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                {suggestionsData && suggestionsData.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {suggestionsPage} sur {suggestionsData.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSuggestionsPage((prev) => Math.max(1, prev - 1))}
                        disabled={suggestionsPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSuggestionsPage((prev) =>
                            Math.min(suggestionsData.totalPages, prev + 1)
                          )
                        }
                        disabled={suggestionsPage === suggestionsData.totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleCloseSuggestions}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de détails du thème */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du thème</DialogTitle>
            <DialogDescription>
              Informations complètes sur le thème généré par l'IA
            </DialogDescription>
          </DialogHeader>
          {selectedThemeForDetails && (
            <div className="space-y-6">
              {/* Photo du thème */}
              {selectedThemeForDetails.photoUrl && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                  <img
                    src={selectedThemeForDetails.photoUrl}
                    alt={selectedThemeForDetails.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedThemeForDetails.title}
                    </h3>
                    {selectedThemeForDetails.isActive && (
                      <Badge className="bg-primary text-white">
                        Thème actif
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Titre
                    </Label>
                    <p className="text-lg font-semibold mt-1">
                      {selectedThemeForDetails.title}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Slug
                    </Label>
                    <code className="block mt-1 text-sm bg-muted px-3 py-2 rounded">
                      {selectedThemeForDetails.slug}
                    </code>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Date de début
                    </Label>
                    <p className="mt-1">
                      {new Date(selectedThemeForDetails.startOfWeek).toLocaleDateString(
                        'fr-FR',
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Statut
                    </Label>
                    <div className="mt-1">
                      {selectedThemeForDetails.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Suggestions
                    </Label>
                    <p className="text-2xl font-bold mt-1">
                      {selectedThemeForDetails._count?.suggestions || 0}
                    </p>
                  </div>

                  {selectedThemeForDetails.createdAt && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Créé le
                      </Label>
                      <p className="mt-1">
                        {new Date(selectedThemeForDetails.createdAt).toLocaleDateString(
                          'fr-FR',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  )}

                  {selectedThemeForDetails.updatedAt && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Modifié le
                      </Label>
                      <p className="mt-1">
                        {new Date(selectedThemeForDetails.updatedAt).toLocaleDateString(
                          'fr-FR',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  )}

                  {selectedThemeForDetails.photoUnsplashId && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Photo Unsplash ID
                      </Label>
                      <code className="block mt-1 text-xs bg-muted px-2 py-1 rounded">
                        {selectedThemeForDetails.photoUnsplashId}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Texte d'impact */}
              {selectedThemeForDetails.impactText && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Texte d'impact
                  </Label>
                  <p className="mt-2 p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {selectedThemeForDetails.impactText}
                  </p>
                </div>
              )}

              {/* Actions */}
              <DialogFooter className="flex flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openEditDialog(selectedThemeForDetails);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenSuggestions(selectedThemeForDetails.id);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Voir les suggestions
                </Button>
                <Button onClick={() => setIsDetailsOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import Link from 'next/link';
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
  Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function ThemeStatsCard({
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
            iconBg || 'bg-[rgba(45,90,69,0.1)]'
          }`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#2d5a45]" />
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

export default function AdminThemesPage() {
  const queryClient = useQueryClient();
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const { data: themes, isLoading, error } = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => {
      try {
        const data = await adminApi.getThemes();
        return data;
      } catch (err) {
        console.error('❌ Erreur récupération thèmes:', err);
        throw err;
      }
    },
    retry: 1,
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
      toast.success(`${themes.length || 4} thème(s) généré(s) pour le mois`);
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Échec de la génération des thèmes mensuels');
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: ({ themeId }: { themeId: string }) =>
      adminApi.generateThemeSuggestions(themeId, ['FR', 'MA', 'JP', 'US', 'BR']),
    onSuccess: (stats) => {
      toast.success(`${stats.created || 3} suggestion(s) générée(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Échec de la génération');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Thèmes hebdomadaires IA</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Thèmes hebdomadaires IA</h1>
          <p className="text-destructive">
            Erreur lors du chargement des thèmes :{' '}
            {error instanceof Error ? error.message : 'Erreur inconnue'}
          </p>
        </div>
      </div>
    );
  }

  const themesList = Array.isArray(themes) ? themes : [];
  const activeTheme = themesList.find((t: any) => t.isActive);
  const activeThemesCount = themesList.filter((t: any) => t.isActive).length;
  const totalThemes = themesList.length;
  // Calculate total participants from real stats
  const totalParticipants = themesList.reduce(
    (acc: number, t: any) => acc + (t.stats?.participants || 0),
    0
  );

  const getStatusBadge = (theme: any) => {
    if (theme.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(45,90,69,0.1)] text-[#2d5a45]">
          Actif
        </span>
      );
    }
    const startDate = new Date(theme.startOfWeek);
    const now = new Date();
    if (startDate > now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.1)] text-[#d9a055]">
          À venir
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] text-[#9a9a9d]">
        Terminé
      </span>
    );
  };

  const getWeekRange = (startOfWeek: string) => {
    const start = new Date(startOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      start: format(start, 'dd MMM yyyy', { locale: fr }),
      end: format(end, 'dd MMM yyyy', { locale: fr }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[3.987px]">
          <h1 className="admin-page-title">Thèmes hebdomadaires IA</h1>
          <p className="admin-page-description">Gérer les thèmes proposés par l'IA Gemini</p>
        </div>
        <Button
          onClick={() => generateThemeMutation.mutate()}
          disabled={generateThemeMutation.isPending}
          className="bg-[#2d5a45] hover:bg-[#2d5a45]/90 h-[39.996px] px-[15.98px] rounded-[6px]"
        >
          {generateThemeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer avec IA
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ThemeStatsCard
          title="Thèmes actifs"
          value={activeThemesCount}
          icon={RefreshCw}
          iconBg="bg-[rgba(45,90,69,0.1)]"
        />
        <ThemeStatsCard
          title="Participants total"
          value={totalParticipants}
          icon={Users}
          iconBg="bg-[rgba(217,160,85,0.1)]"
        />
        <ThemeStatsCard
          title="Thèmes créés"
          value={totalThemes}
          icon={Calendar}
          iconBg="bg-[#1a1a1c]"
        />
      </div>

      {/* Active Theme Card */}
      {activeTheme && (
        <Card
          className="border-[rgba(45,90,69,0.2)]"
          style={{
            backgroundImage:
              'linear-gradient(167.72deg, rgba(45, 90, 69, 0.05) 0%, rgba(45, 90, 69, 0.1) 100%), linear-gradient(90deg, rgba(20, 20, 22, 1) 0%, rgba(20, 20, 22, 1) 100%)',
          }}
        >
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="bg-[#2d5a45] rounded-lg w-12 h-12 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-base font-normal text-foreground leading-6">
                    Thème actif de la semaine
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(45,90,69,0.1)] text-[#2d5a45] shrink-0">
                    Actif
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-normal leading-5">
                  {(() => {
                    const range = getWeekRange(activeTheme.startOfWeek);
                    return `Du ${range.start} au ${range.end}`;
                  })()}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-base font-normal text-foreground leading-6">
                {activeTheme.title}
              </h4>
              <p className="text-sm text-muted-foreground font-normal leading-5 line-clamp-3 break-words">
                {activeTheme.impactText ||
                  "Donnez une nouvelle vie à vos livres en les échangeant avec d'autres passionnés de lecture. Partagez vos coups de cœur et découvrez de nouvelles lectures."}
              </p>
            </div>
            <div className="flex gap-6 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-normal">
                  Participants:
                </span>
                <span className="text-sm text-foreground font-normal">
                  {activeTheme.stats?.participants || activeTheme._count?.suggestions || 0} utilisateurs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-normal">
                  Objets échangés:
                </span>
                <span className="text-sm text-foreground font-normal">
                  {activeTheme.stats?.exchanges || 0} échanges
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Themes */}
      <div className="flex flex-col gap-[15.984px]">
        <h3 className="text-base font-normal text-foreground leading-[24px] tracking-[-0.3125px]">
          Tous les thèmes
        </h3>
        <div className="flex flex-col gap-4">
          {themesList.map((theme: any) => {
            const range = getWeekRange(theme.startOfWeek);
            return (
              <Card key={theme.id}>
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-base font-normal text-foreground leading-6 truncate">
                        {theme.title}
                      </h4>
                      {getStatusBadge(theme)}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal leading-5 line-clamp-2 break-words">
                      {theme.impactText ||
                        "Donnez une nouvelle vie à vos livres en les échangeant avec d'autres passionnés de lecture."}
                    </p>
                    <div className="flex gap-6 items-center flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground font-normal">
                          {range.start} - {range.end}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground font-normal">
                          {theme.stats?.participants || theme._count?.suggestions || 0} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-md"
                      asChild
                    >
                      <Link href={`/${ADMIN_BASE_PATH}/themes/${theme.id}`}>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-md"
                      onClick={() => {
                        setSelectedThemeId(theme.id);
                        setIsSuggestionsOpen(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {themesList.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-normal">
                  Aucun thème pour le moment
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Suggestions IA Card */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <div className="bg-[#2d5a45] rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <h4 className="text-base font-normal text-foreground leading-6">
                Suggestions IA (Gemini)
              </h4>
              <p className="text-sm text-muted-foreground font-normal leading-5 break-words">
                L'IA peut générer automatiquement des thèmes hebdomadaires basés sur les tendances, les saisons et les comportements des utilisateurs.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              if (selectedThemeId) {
                generateSuggestionsMutation.mutate({ themeId: selectedThemeId });
              } else if (activeTheme) {
                generateSuggestionsMutation.mutate({ themeId: activeTheme.id });
              }
            }}
            disabled={generateSuggestionsMutation.isPending || !activeTheme}
            className="bg-[#2d5a45] hover:bg-[#2d5a45]/90 h-10 w-fit rounded-md"
          >
            {generateSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer 3 suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer des suggestions</DialogTitle>
            <DialogDescription>
              Générer des suggestions pour le thème sélectionné
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuggestionsOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedThemeId) {
                  generateSuggestionsMutation.mutate({ themeId: selectedThemeId });
                  setIsSuggestionsOpen(false);
                }
              }}
              disabled={!selectedThemeId || generateSuggestionsMutation.isPending}
            >
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

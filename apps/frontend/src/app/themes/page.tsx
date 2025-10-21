'use client';

import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeCalendar } from '@/components/themes/ThemeCalendar';
import { CalendarGrid } from '@/components/themes/CalendarGrid';
import { NotificationBanner } from '@/components/common/NotificationBanner';
import { themesApi } from '@/lib/themes.api';
import { getThemeDateRange } from '@/lib/date';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Grid3X3,
} from 'lucide-react';
import Link from 'next/link';
import { WeeklyTheme } from '@/types';
import { useState } from 'react';

export default function ThemesPage() {
  const dateRange = getThemeDateRange();
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('grid');

  const {
    data: themes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['themes', dateRange],
    queryFn: () => themesApi.listThemes(dateRange),
    retry: false, // Ne pas réessayer automatiquement
    refetchOnWindowFocus: false, // Ne pas refetch au focus
  });

  const {
    data: calendarData,
    isLoading: isCalendarLoading,
    error: calendarError,
  } = useQuery({
    queryKey: ['themes-calendar'],
    queryFn: () => themesApi.getCalendar(12),
    retry: false,
  });

  // Utiliser les données mockées si l'API échoue
  const displayThemes = themes || [];

  // Détecter si on utilise des données mockées en vérifiant les IDs
  const isUsingMockData = displayThemes.some(
    (theme) =>
      theme.id === 'theme-1' || theme.id === 'theme-2' || theme.id === 'theme-3'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Accueil
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Calendar className="h-8 w-8" />
                Thèmes hebdomadaires
              </h1>
              <p className="text-muted-foreground">
                Découvrez les thèmes passés et à venir avec leurs suggestions IA
              </p>
            </div>
          </div>

          {/* Bannière d'information si données mockées */}
          {isUsingMockData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Mode démonstration
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Le backend n'est pas disponible. Affichage des données
                      d'exemple.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Bannière de notifications */}
        <NotificationBanner className="mb-6" />

        {/* Sélecteur de vue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {viewMode === 'grid'
                  ? 'Calendrier des Thèmes'
                  : 'Vue Calendrier'}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Grille
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Calendrier
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Contenu selon la vue */}
        {viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {calendarData ? (
              <CalendarGrid
                weeks={calendarData.weeks}
                currentWeek={calendarData.currentWeek}
                isLoading={isCalendarLoading}
              />
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Erreur de chargement
                </h3>
                <p className="text-muted-foreground">
                  Impossible de charger le calendrier des thèmes
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ThemeCalendar themes={displayThemes} isLoading={isLoading} />
          </motion.div>
        )}

        {/* Thème actif */}
        {displayThemes.find((t) => t.isActive) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Thème actuel
                </CardTitle>
                <CardDescription>
                  Le thème de cette semaine avec ses suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h3 className="mb-2 text-2xl font-bold">
                    {displayThemes.find((t) => t.isActive)?.title}
                  </h3>
                  {displayThemes.find((t) => t.isActive)?.impactText && (
                    <p className="mb-4 text-muted-foreground">
                      {displayThemes.find((t) => t.isActive)?.impactText}
                    </p>
                  )}
                  <Button asChild>
                    <Link href="/">Voir sur la page d'accueil</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Calendrier des thèmes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ThemeCalendar themes={displayThemes} isLoading={isLoading} />
        </motion.div>

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h4 className="mb-2 font-semibold">Thème hebdomadaire</h4>
                  <p className="text-sm text-muted-foreground">
                    Chaque semaine, un nouveau thème est proposé pour inspirer
                    vos échanges
                  </p>
                </div>

                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h4 className="mb-2 font-semibold">Suggestions IA</h4>
                  <p className="text-sm text-muted-foreground">
                    Notre IA génère des suggestions d'objets pertinents pour
                    chaque thème
                  </p>
                </div>

                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xl text-primary">🤝</span>
                    </div>
                  </div>
                  <h4 className="mb-2 font-semibold">Échanges ciblés</h4>
                  <p className="text-sm text-muted-foreground">
                    Trouvez des objets correspondant au thème pour des échanges
                    plus pertinents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

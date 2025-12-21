'use client';

/**
 * FICHIER: app/themes/page.tsx
 *
 * DESCRIPTION:
 * Page "Thèmes" affichant le thème actif de la semaine et le calendrier
 * des thèmes passés/futurs. Elle consomme l'API themesApi pour récupérer
 * le thème actuel et un calendrier sur plusieurs semaines.
 *
 * FONCTIONNALITÉS:
 * - Mise en avant du thème actif (Card + CTA vers /discover)
 * - Calendrier interactif (CalendarGrid) permettant de sélectionner une semaine
 * - Affichage des détails du thème sélectionné (description, impact, suggestions)
 * - Gestion d'un mode mock lorsque les données proviennent de fixtures
 *
 * UX:
 * - Animations Framer Motion sur les sections
 * - Boutons CTA pour proposer un objet ou découvrir des contenus liés
 * - Messages d'erreur si le backend n'est pas accessible
 */

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarGrid } from '@/components/themes/CalendarGrid';
import { themesApi } from '@/lib/themes.api';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles, AlertCircle, Tag } from 'lucide-react';
import Link from 'next/link';
import { useUnsplashImages } from '@/hooks/useUnsplashImages';
import { SuggestedItem } from '@/types';
import { ITEM_CATEGORY_LABELS } from '@/lib/constants';

export default function ThemesPage() {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedWeekForDetails, setSelectedWeekForDetails] = useState<string | null>(null);

  const { data: activeTheme, isLoading: isActiveLoading } = useQuery({
    queryKey: ['theme-active'],
    queryFn: () => themesApi.getActiveTheme(),
    retry: false, // Ne pas réessayer automatiquement
    refetchOnWindowFocus: false, // Ne pas refetch au focus
  });

  const {
    data: calendarData,
    isLoading: isCalendarLoading,
    error: calendarError,
  } = useQuery({
    queryKey: ['themes-month-calendar'],
    queryFn: () => themesApi.getMonthCalendar(),
    retry: false,
  });

  const isUsingMockData = useMemo(() => {
    if (!calendarData) return false;
    return calendarData.weeks.some(
      (week) => week.themeId?.startsWith('mock') || week.title === 'Mock'
    );
  }, [calendarData]);

  useEffect(() => {
    if (calendarData) {
      setSelectedWeekIndex(calendarData.currentWeek);
    }
  }, [calendarData]);

  // Pour la grille mensuelle, on affiche les 4 semaines du mois
  // Les suggestions seront chargées individuellement si nécessaire

  const { data: heroPhotos } = useUnsplashImages(
    activeTheme ? `${activeTheme.title} sustainable` : 'sustainable theme',
    1,
    1
  );
  const heroCover = heroPhotos?.[0];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Calendrier des thèmes</span>
            </div>
            <h1 className="text-4xl md:text-5xl">
              Découvrez les thèmes
              <br />
              <span className="text-primary">de la semaine</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Chaque jour, un nouveau thème pour inspirer vos échanges et
              découvertes
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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

        {/* Thème actif mis en avant */}
        {activeTheme && !isActiveLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <Card className="overflow-hidden border-2 border-primary/20">
              {heroCover && (
                <div className="relative h-64 w-full overflow-hidden rounded-b-none md:h-80">
                  <img
                    src={heroCover.urls.small}
                    alt={heroCover.alt_description || activeTheme.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardContent className="space-y-4 p-4 md:p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <span>Thème actif aujourd'hui</span>
                </div>
                <h3 className="text-2xl font-semibold md:text-3xl">
                  {activeTheme.title}
                </h3>
                {activeTheme.targetCategories && activeTheme.targetCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeTheme.targetCategories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="text-sm"
                      >
                        <Tag className="mr-1 h-3.5 w-3.5" />
                        {ITEM_CATEGORY_LABELS[category] || category}
                      </Badge>
                    ))}
                  </div>
                )}
                {activeTheme.impactText && (
                  <p className="text-muted-foreground">
                    {activeTheme.impactText}
                  </p>
                )}
                <Button asChild>
                  <Link href="/explore">Voir les suggestions</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {calendarData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {calendarData.weeks.map((week, index) => (
                <motion.div
                  key={week.weekStart}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                >
                  <CalendarGrid
                    weeks={[week]}
                    selectedWeekIndex={0}
                    onPreviousWeek={() => {}}
                    onNextWeek={() => {}}
                    isLoading={isCalendarLoading}
                    suggestions={[]}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-muted-foreground/40 p-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-60" />
              Impossible de charger le calendrier des thèmes pour le moment.
            </div>
          )}
        </motion.div>

        {/* Impact hebdomadaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center">
                Impact des thèmes hebdomadaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 text-4xl">2.5k</div>
                  <div className="text-muted-foreground">
                    Objets échangés cette semaine
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-4xl text-green-500">-85T</div>
                  <div className="text-muted-foreground">
                    CO₂ économisé cette semaine
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-4xl text-primary">340+</div>
                  <div className="text-muted-foreground">
                    Nouveaux membres cette semaine
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

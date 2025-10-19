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
import { themesApi } from '@/lib/themes.api';
import { getThemeDateRange } from '@/lib/date';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ThemesPage() {
  const dateRange = getThemeDateRange();

  const {
    data: themes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['themes', dateRange],
    queryFn: () => themesApi.listThemes(dateRange),
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        <div className="text-center">
          <p className="mb-4">Erreur lors du chargement des thèmes</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

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
        </motion.div>

        {/* Thème actif */}
        {themes && themes.find((t) => t.isActive) && (
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
                    {themes.find((t) => t.isActive)?.title}
                  </h3>
                  {themes.find((t) => t.isActive)?.impactText && (
                    <p className="mb-4 text-muted-foreground">
                      {themes.find((t) => t.isActive)?.impactText}
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
          <ThemeCalendar themes={themes || []} isLoading={isLoading} />
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

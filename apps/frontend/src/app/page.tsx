'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyTheme, SuggestedItem } from '@/types';
import { themesApi } from '@/lib/themes.api';
import { ActiveTheme } from '@/components/themes/ActiveTheme';
import { SuggestionsGrid } from '@/components/themes/SuggestionsGrid';
import { NotificationBanner } from '@/components/notifications/NotificationBanner';
import { Sparkles, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const {
    data: theme,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activeTheme'],
    queryFn: () => themesApi.getActiveTheme(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <NotificationBanner />

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
              SecondLife Exchange
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              Donnez une seconde vie à vos objets et découvrez de nouveaux
              trésors grâce à notre plateforme d'échange intelligente.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="px-8 text-lg">
                <Link href="/explore">
                  Explorer les objets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-8 text-lg"
              >
                <Link href="/register">Créer un compte</Link>
              </Button>
            </div>
          </motion.div>

          {/* Message d'erreur discret */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 text-center">
                <p className="text-yellow-800">
                  ⚠️ Le backend n'est pas encore démarré. Les fonctionnalités
                  avancées seront disponibles une fois le serveur lancé.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fonctionnalités clés */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Suggestions IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Découvrez des idées d'objets à échanger grâce à notre IA qui
                  génère des suggestions hebdomadaires personnalisées.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Échanges Faciles</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat en temps réel, suivi des échanges et système de notation
                  pour des échanges en toute confiance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Thèmes Hebdomadaires</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chaque semaine, un nouveau thème inspirant pour vous
                  encourager à échanger des objets spécifiques.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <NotificationBanner />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h1 className="mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            SecondLife Exchange
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Donnez une seconde vie à vos objets et découvrez de nouveaux trésors
            grâce à notre plateforme d'échange intelligente.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-lg">
              <Link href="/explore">
                Explorer les objets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 text-lg"
            >
              <Link href="/register">Créer un compte</Link>
            </Button>
          </div>
        </motion.div>

        {/* Weekly Theme Section */}
        {theme && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <ActiveTheme theme={theme} />

            <div className="mt-8">
              <SuggestionsGrid
                suggestions={theme.suggestions.slice(0, 6)}
                title="Suggestions du thème"
              />

              {theme.suggestions.length > 6 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" asChild>
                    <Link href="/themes">
                      Voir toutes les suggestions ({theme.suggestions.length})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Suggestions IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Découvrez des idées d'objets à échanger grâce à notre IA qui
                génère des suggestions hebdomadaires personnalisées.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Échanges Sécurisés</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat en temps réel, suivi des échanges et système de notation
                pour des échanges en toute confiance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Thèmes Hebdomadaires</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chaque semaine, un nouveau thème inspirant pour vous encourager
                à échanger des objets spécifiques.
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

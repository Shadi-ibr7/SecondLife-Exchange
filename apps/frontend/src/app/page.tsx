'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyTheme, SuggestedItem } from '@/types';
import apiClient from '@/lib/api';
import { Sparkles, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [theme, setTheme] = useState<WeeklyTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const currentTheme = await apiClient.getCurrentTheme();
        setTheme(currentTheme);
      } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            SecondLife Exchange
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Donnez une seconde vie à vos objets et découvrez de nouveaux trésors grâce à notre plateforme d'échange intelligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/explore">
                Explorer les objets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/register">
                Créer un compte
              </Link>
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
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <Badge variant="secondary" className="text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Semaine {theme.weekNumber} - {theme.year}
                  </Badge>
                </div>
                <CardTitle className="text-3xl mb-2">{theme.title}</CardTitle>
                <CardDescription className="text-lg">
                  {theme.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {theme.suggestedItems.slice(0, 6).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <Badge variant="outline" className="w-fit">
                            {item.category}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          <p className="text-xs text-primary font-medium">
                            💡 {item.reason}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {theme.suggestedItems.length > 6 && (
                  <div className="text-center mt-6">
                    <Button variant="outline" asChild>
                      <Link href="/explore">
                        Voir toutes les suggestions ({theme.suggestedItems.length})
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Suggestions IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Découvrez des idées d'objets à échanger grâce à notre IA qui génère des suggestions hebdomadaires personnalisées.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Échanges Sécurisés</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat en temps réel, suivi des échanges et système de notation pour des échanges en toute confiance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Thèmes Hebdomadaires</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chaque semaine, un nouveau thème inspirant pour vous encourager à échanger des objets spécifiques.
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

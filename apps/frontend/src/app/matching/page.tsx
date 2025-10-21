'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/common/Container';
import { PreferencesForm } from '@/components/matching/PreferencesForm';
import { RecommendationsGrid } from '@/components/matching/RecommendationsGrid';
import { matchingApi } from '@/lib/matching.api';
import { useAuthStore } from '@/store/auth';
import { SavePreferencesDto } from '@/types';
import { toast } from 'react-hot-toast';
import { Heart, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MatchingPage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('recommendations');
  const queryClient = useQueryClient();

  // Récupérer les préférences
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    error: preferencesError,
  } = useQuery({
    queryKey: ['matching-preferences'],
    queryFn: () => matchingApi.getPreferences(),
    enabled: isAuthenticated,
    retry: false,
  });

  // Récupérer les recommandations
  const {
    data: recommendationsData,
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ['matching-recommendations'],
    queryFn: () => matchingApi.getRecommendations({ limit: 20 }),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handlePreferencesSave = () => {
    // Invalider le cache des recommandations pour les recalculer
    queryClient.invalidateQueries({ queryKey: ['matching-recommendations'] });
    toast.success(
      'Préférences mises à jour ! Les recommandations vont se recalculer.'
    );
  };

  const handleRefreshRecommendations = () => {
    refetchRecommendations();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Container>
          <div className="flex min-h-screen items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Heart className="mx-auto mb-4 h-16 w-16 text-primary" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Connexion requise
              </h1>
              <p className="mb-6 text-muted-foreground">
                Connectez-vous pour accéder à vos recommandations personnalisées
              </p>
              <Button asChild>
                <a href="/login">Se connecter</a>
              </Button>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Container>
        <div className="py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Recommandations
                </h1>
                <p className="text-muted-foreground">
                  Découvrez des objets qui correspondent à vos goûts
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="recommendations"
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Recommandations
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Préférences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-6">
              <RecommendationsGrid
                recommendations={recommendationsData?.recommendations || []}
                isLoading={recommendationsLoading}
                onRefresh={handleRefreshRecommendations}
                userPreferences={recommendationsData?.userPreferences}
              />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <PreferencesForm
                initialData={preferencesData?.preferences}
                onSave={handlePreferencesSave}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </div>
  );
}

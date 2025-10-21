'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recommendation } from '@/types';
import { RecommendationCard } from './RecommendationCard';
import { Sparkles, RefreshCw, Filter } from 'lucide-react';

interface RecommendationsGridProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
  userPreferences?: {
    preferredCategories: string[];
    preferredConditions: string[];
    country?: string;
  };
}

export function RecommendationsGrid({
  recommendations,
  isLoading,
  onRefresh,
  userPreferences,
}: RecommendationsGridProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Aucune recommandation disponible
            </h3>
            <p className="mb-4 text-muted-foreground">
              Configurez vos préférences pour recevoir des recommandations
              personnalisées.
            </p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommandations
            <Badge variant="secondary" className="ml-2">
              {recommendations.length}
            </Badge>
          </CardTitle>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Aperçu des préférences */}
        {userPreferences && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Filter className="mr-1 h-3 w-3" />
              Préférences actives
            </Badge>
            {userPreferences.preferredCategories.slice(0, 3).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {userPreferences.preferredCategories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{userPreferences.preferredCategories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <RecommendationCard recommendation={recommendation} />
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}

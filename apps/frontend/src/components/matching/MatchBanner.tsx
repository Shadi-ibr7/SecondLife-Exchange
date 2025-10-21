'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types';
import { matchingApi } from '@/lib/matching.api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-hot-toast';
import { Heart, Sparkles, ArrowRight, X } from 'lucide-react';

interface MatchBannerProps {
  item: Item;
  onClose?: () => void;
}

export function MatchBanner({ item, onClose }: MatchBannerProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.id === item.ownerId) {
      return;
    }

    // Calculer un score de match basique côté client
    calculateMatchScore();
  }, [isAuthenticated, user, item]);

  const calculateMatchScore = async () => {
    setIsLoading(true);
    try {
      // Récupérer les préférences de l'utilisateur
      const preferences = await matchingApi.getPreferences();

      let score = 0;
      const reasons: string[] = [];

      // Score basé sur les catégories préférées
      if (preferences.preferences.preferredCategories.includes(item.category)) {
        score += 30;
        reasons.push('Catégorie préférée');
      }

      // Score basé sur les conditions préférées
      if (
        preferences.preferences.preferredConditions.includes(item.condition)
      ) {
        score += 20;
        reasons.push('Condition préférée');
      }

      // Score basé sur les tags communs
      const commonTags = item.tags.filter((tag) =>
        preferences.preferences.preferredCategories.some(
          (cat) =>
            cat.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(cat.toLowerCase())
        )
      );
      if (commonTags.length > 0) {
        score += Math.min(commonTags.length * 10, 20);
        reasons.push(`${commonTags.length} tag(s) commun(s)`);
      }

      // Score basé sur la popularité
      if (item.popularityScore > 50) {
        score += 15;
        reasons.push('Objet populaire');
      }

      // Score basé sur la proximité géographique (simulation)
      if (preferences.preferences.country) {
        score += 10;
        reasons.push('Même région');
      }

      setMatchScore(Math.min(score, 100));
    } catch (error) {
      console.error('Erreur lors du calcul du score de match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isAuthenticated || !user || user.id === item.ownerId || !isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
              <div className="flex-1">
                <div className="mb-2 h-4 animate-pulse rounded bg-primary/20" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-primary/10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!matchScore || matchScore < 70) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getScoreText = (score: number) => {
    if (score >= 90) return 'Match parfait !';
    if (score >= 80) return 'Excellent match';
    return 'Bon match';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-full ${getScoreColor(matchScore)} flex items-center justify-center text-white shadow-lg`}
              >
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {getScoreText(matchScore)}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {matchScore}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cet objet correspond parfaitement à vos préférences !
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Sparkles className="mr-2 h-4 w-4" />
                Proposer un échange
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

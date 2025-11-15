/**
 * FICHIER: RecommendationCard.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une carte de recommandation d'item personnalisée.
 * Il présente l'item avec son score de correspondance, les raisons de la recommandation,
 * et les informations essentielles (catégorie, condition, propriétaire).
 *
 * FONCTIONNALITÉS:
 * - Affichage du score de correspondance avec code couleur
 * - Tooltip détaillé avec les raisons du score
 * - Informations de l'item (titre, description, catégorie, condition)
 * - Tags et score de popularité
 * - Informations du propriétaire
 * - Lien vers la page de détail de l'item
 * - Animation au survol
 *
 * SCORE:
 * - 80-100: Excellent match (vert)
 * - 60-79: Bon match (jaune)
 * - 40-59: Match correct (orange)
 * - 0-39: Match faible (rouge)
 */

'use client';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import de Next.js pour la navigation
import Link from 'next/link';

// Import des composants UI
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Import des types
import { Recommendation } from '@/types';

// Import des constantes
import { ITEM_CATEGORY_LABELS, ITEM_CONDITION_LABELS } from '@/lib/constants';

// Import de date-fns pour le formatage des dates
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des icônes
import { Star, MapPin, Calendar, ArrowRight } from 'lucide-react';

/**
 * INTERFACE: RecommendationCardProps
 *
 * Définit les propriétés acceptées par le composant.
 */
interface RecommendationCardProps {
  recommendation: Recommendation; // La recommandation à afficher (item + score + raisons)
}

/**
 * COMPOSANT: RecommendationCard
 *
 * Affiche une carte de recommandation d'item personnalisée.
 *
 * @param recommendation - La recommandation à afficher
 */
export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  // ============================================
  // EXTRACTION DES DONNÉES
  // ============================================

  /**
   * Extraction de l'item, du score et des raisons depuis la recommandation.
   */
  const { item, score, reasons } = recommendation;

  /**
   * Récupération des labels pour la catégorie et la condition.
   */
  const categoryLabel =
    ITEM_CATEGORY_LABELS[item.category as keyof typeof ITEM_CATEGORY_LABELS] ||
    item.category;
  const conditionLabel =
    ITEM_CONDITION_LABELS[
      item.condition as keyof typeof ITEM_CONDITION_LABELS
    ] || item.condition;

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

  /**
   * Retourne la couleur CSS selon le score de correspondance.
   *
   * @param score - Score de correspondance (0-100)
   * @returns Classe CSS pour la couleur
   */
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'; // Excellent: vert
    if (score >= 60) return 'bg-yellow-500'; // Bon: jaune
    if (score >= 40) return 'bg-orange-500'; // Correct: orange
    return 'bg-red-500'; // Faible: rouge
  };

  /**
   * Retourne le texte descriptif selon le score de correspondance.
   *
   * @param score - Score de correspondance (0-100)
   * @returns Texte descriptif
   */
  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Bon match';
    if (score >= 40) return 'Match correct';
    return 'Match faible';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>

            {/* Score Badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`ml-3 flex h-12 w-12 items-center justify-center rounded-full ${getScoreColor(score)} text-white shadow-lg`}
                  >
                    <span className="text-sm font-bold">{score}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">{getScoreText(score)}</p>
                    <div className="space-y-1">
                      {reasons.map((reason, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium">+{reason.score}:</span>{' '}
                          {reason.description}
                        </div>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tags et métadonnées */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {conditionLabel}
            </Badge>
            {item.popularityScore > 0 && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <Star className="h-3 w-3" />
                {item.popularityScore}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Propriétaire */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={item.owner.avatarUrl}
                alt={item.owner.displayName}
              />
              <AvatarFallback className="text-xs">
                {item.owner.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {item.owner.displayName}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1" size="sm">
              <Link href={`/item/${item.id}`}>
                Voir l'objet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="px-3">
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

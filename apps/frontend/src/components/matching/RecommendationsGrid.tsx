/**
 * FICHIER: components/matching/RecommendationsGrid.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une grille de recommandations d'items personnalisées.
 * Il gère les états de chargement, les cas vides, et affiche un aperçu des préférences
 * utilisateur actives. Il utilise le composant RecommendationCard pour afficher chaque
 * recommandation individuelle.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage en grille responsive (1 colonne mobile, 2 tablette, 3 desktop)
 * - État de chargement avec skeleton (6 cartes animées)
 * - État vide avec message et bouton d'actualisation
 * - Aperçu des préférences utilisateur actives
 * - Bouton d'actualisation pour recharger les recommandations
 * - Animations d'apparition pour chaque carte (stagger effect)
 * - Compteur du nombre de recommandations
 *
 * UX:
 * - Feedback visuel clair pour chaque état (chargement, vide, avec données)
 * - Animations fluides pour améliorer l'expérience utilisateur
 * - Message encourageant si aucune recommandation n'est disponible
 * - Possibilité de rafraîchir manuellement les recommandations
 */

'use client';

// Import de Framer Motion pour les animations fluides
import { motion } from 'framer-motion';
// Import des composants UI réutilisables
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import des types TypeScript pour garantir la sécurité des types
import { Recommendation } from '@/types';
// Import du composant RecommendationCard pour afficher chaque recommandation
import { RecommendationCard } from './RecommendationCard';
// Import des icônes Lucide React
import { Sparkles, RefreshCw, Filter } from 'lucide-react';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface RecommendationsGridProps {
  recommendations: Recommendation[]; // Liste des recommandations à afficher
  isLoading: boolean; // Indique si les recommandations sont en cours de chargement
  onRefresh: () => void; // Callback appelé quand l'utilisateur clique sur "Actualiser"
  userPreferences?: {
    // Préférences utilisateur (optionnelles) pour afficher un aperçu
    preferredCategories: string[]; // Catégories préférées par l'utilisateur
    preferredConditions: string[]; // Conditions préférées par l'utilisateur
    country?: string; // Pays de l'utilisateur (optionnel)
  };
}

/**
 * COMPOSANT PRINCIPAL: RecommendationsGrid
 *
 * Ce composant affiche une grille de recommandations d'items personnalisées.
 *
 * @param recommendations - Liste des recommandations à afficher
 * @param isLoading - Indique si les recommandations sont en cours de chargement
 * @param onRefresh - Callback appelé quand l'utilisateur clique sur "Actualiser"
 * @param userPreferences - Préférences utilisateur pour afficher un aperçu
 */
export function RecommendationsGrid({
  recommendations,
  isLoading,
  onRefresh,
  userPreferences,
}: RecommendationsGridProps) {
  // ============================================
  // ÉTAT DE CHARGEMENT (SKELETON)
  // ============================================

  /**
   * Pendant le chargement, afficher un skeleton avec 6 cartes animées
   * Cela donne un feedback visuel à l'utilisateur pendant que les données se chargent
   */
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
          {/*
            Grille responsive:
            - grid-cols-1: 1 colonne sur mobile
            - md:grid-cols-2: 2 colonnes sur tablette (≥768px)
            - lg:grid-cols-3: 3 colonnes sur desktop (≥1024px)
            gap-6: espacement de 24px entre les cartes
          */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/*
              Créer 6 cartes skeleton pour simuler le chargement
              Array.from({ length: 6 }) crée un tableau de 6 éléments
              animate-pulse: animation de pulsation pour indiquer le chargement
              bg-muted/50: fond gris avec 50% d'opacité
              h-80: hauteur fixe de 320px pour chaque carte
            */}
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

  // ============================================
  // ÉTAT VIDE (AUCUNE RECOMMANDATION)
  // ============================================

  /**
   * Si aucune recommandation n'est disponible, afficher un message encourageant
   * avec un bouton pour actualiser les recommandations
   */
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
          {/*
            Conteneur centré avec padding vertical pour l'état vide
            py-12: padding vertical de 48px
            text-center: centrer le texte
          */}
          <div className="py-12 text-center">
            {/*
              Icône grande et atténuée pour l'état vide
              mx-auto: centrer horizontalement
              mb-4: marge en bas de 16px
              h-12 w-12: taille de 48px x 48px
              text-muted-foreground: couleur atténuée
            */}
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            {/*
              Titre de l'état vide
              mb-2: marge en bas de 8px
              text-lg: texte grand
              font-semibold: police semi-grasse
            */}
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Aucune recommandation disponible
            </h3>
            {/*
              Message explicatif pour encourager l'utilisateur à configurer ses préférences
              mb-4: marge en bas de 16px
              text-muted-foreground: couleur atténuée pour le texte secondaire
            */}
            <p className="mb-4 text-muted-foreground">
              Configurez vos préférences pour recevoir des recommandations
              personnalisées.
            </p>
            {/*
              Bouton pour actualiser les recommandations
              variant="outline": style avec bordure
              onClick={onRefresh}: appeler le callback de rafraîchissement au clic
            */}
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDU AVEC RECOMMANDATIONS
  // ============================================

  /**
   * Si des recommandations sont disponibles, afficher la grille avec les cartes
   */
  return (
    <Card>
      <CardHeader>
        {/*
          En-tête avec titre, badge compteur et bouton d'actualisation
          flex items-center justify-between: aligner horizontalement avec espacement entre les éléments
        */}
        <div className="flex items-center justify-between">
          {/*
            Titre avec icône et badge compteur
            flex items-center gap-2: aligner horizontalement avec espacement
          */}
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommandations
            {/*
              Badge affichant le nombre de recommandations
              variant="secondary": style secondaire (gris)
              ml-2: marge à gauche de 8px
            */}
            <Badge variant="secondary" className="ml-2">
              {recommendations.length}
            </Badge>
          </CardTitle>
          {/*
            Bouton d'actualisation en haut à droite
            variant="outline": style avec bordure
            size="sm": petite taille
            onClick={onRefresh}: appeler le callback de rafraîchissement au clic
          */}
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* ============================================
            APERÇU DES PRÉFÉRENCES UTILISATEUR
            ============================================ */}
        {/*
          Afficher un aperçu des préférences utilisateur si elles sont fournies
          Cela permet à l'utilisateur de voir quelles préférences sont actives
        */}
        {userPreferences && (
          <div className="mt-3 flex flex-wrap gap-2">
            {/*
              Badge indiquant que les préférences sont actives
              variant="outline": style avec bordure
              text-xs: texte très petit
            */}
            <Badge variant="outline" className="text-xs">
              <Filter className="mr-1 h-3 w-3" />
              Préférences actives
            </Badge>
            {/*
              Afficher les 3 premières catégories préférées
              slice(0, 3) limite à 3 catégories pour ne pas surcharger l'UI
            */}
            {userPreferences.preferredCategories.slice(0, 3).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {/*
              Si plus de 3 catégories, afficher un badge avec le nombre restant
              Cela indique qu'il y a d'autres préférences sans tout afficher
            */}
            {userPreferences.preferredCategories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{userPreferences.preferredCategories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/*
          Grille de recommandations avec animation d'apparition
          motion.div ajoute une animation fade-in globale
          initial: état initial (invisible)
          animate: état final (visible)
          transition: durée de l'animation (0.3 secondes)
        */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/*
            Parcourir chaque recommandation et l'afficher avec une animation
            stagger effect: chaque carte apparaît avec un délai progressif
            (index * 0.1 secondes) pour un effet visuel agréable
          */}
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.item.id}
              initial={{ opacity: 0, y: 20 }} // État initial: invisible et légèrement en bas
              animate={{ opacity: 1, y: 0 }} // État final: visible et à sa position normale
              transition={{ duration: 0.3, delay: index * 0.1 }} // Délai progressif pour l'effet stagger
            >
              {/*
                Utiliser le composant RecommendationCard pour afficher chaque recommandation
                Ce composant gère l'affichage détaillé de chaque item avec son score
              */}
              <RecommendationCard recommendation={recommendation} />
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}

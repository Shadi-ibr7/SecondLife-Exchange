/**
 * FICHIER: components/matching/RecommendationCard.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une carte de recommandation d'item personnalisée.
 * Il présente l'item avec son score de correspondance, les raisons détaillées
 * de la recommandation, et toutes les informations essentielles (catégorie,
 * condition, propriétaire, tags, etc.). Ce composant est utilisé dans la grille
 * de recommandations pour afficher les items suggérés par l'IA selon les préférences
 * de l'utilisateur.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage du score de correspondance avec code couleur (badge circulaire)
 * - Tooltip détaillé avec les raisons du score (décomposition du calcul)
 * - Informations complètes de l'item (titre, description, catégorie, condition)
 * - Tags et score de popularité (affichage conditionnel)
 * - Informations du propriétaire (avatar, nom, date de création)
 * - Lien vers la page de détail de l'item
 * - Animation au survol (Framer Motion)
 * - Design responsive et moderne
 *
 * SCORE DE CORRESPONDANCE:
 * Le score est calculé côté client ou serveur selon les préférences de l'utilisateur.
 * Il représente la pertinence de l'item par rapport aux préférences (0-100).
 *
 * CODES COULEUR:
 * - 80-100: Excellent match (vert - bg-green-500)
 * - 60-79: Bon match (jaune - bg-yellow-500)
 * - 40-59: Match correct (orange - bg-orange-500)
 * - 0-39: Match faible (rouge - bg-red-500)
 *
 * RAISONS DU SCORE:
 * Chaque raison explique pourquoi l'item a reçu des points:
 * - Ex: "+20: Catégorie correspond à vos préférences"
 * - Ex: "+15: Tags similaires à vos intérêts"
 * - Les raisons sont affichées dans un tooltip au survol du badge de score
 *
 * UTILISATION:
 * ```tsx
 * <RecommendationCard
 *   recommendation={{
 *     item: {...},
 *     score: 85,
 *     reasons: [{ score: 20, description: "..." }]
 *   }}
 * />
 * ```
 *
 * @module components/matching/RecommendationCard
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
 * Affiche une carte de recommandation d'item personnalisée avec score et raisons.
 *
 * FONCTIONNEMENT:
 * 1. Extrait les données de la recommandation (item, score, reasons)
 * 2. Récupère les labels français pour catégorie et condition
 * 3. Calcule la couleur et le texte du score
 * 4. Affiche toutes les informations dans une carte animée
 * 5. Affiche un tooltip avec les raisons du score au survol
 *
 * ANIMATIONS:
 * - Initial: fade-in avec translation vers le haut (opacity: 0 -> 1, y: 20 -> 0)
 * - Hover: légère translation vers le haut (y: -4) pour effet de "lift"
 * - Transition: durée de 0.3s pour des animations fluides
 *
 * @param recommendation - La recommandation à afficher (item + score + reasons)
 */
export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  // ============================================
  // EXTRACTION DES DONNÉES
  // ============================================

  /**
   * Extraction de l'item, du score et des raisons depuis la recommandation
   *
   * STRUCTURE DE RECOMMENDATION:
   * - item: Objet Item complet avec toutes ses propriétés
   * - score: Score de correspondance (0-100, nombre)
   * - reasons: Array de raisons expliquant le score
   *   - Chaque raison: { score: number, description: string }
   *   - Ex: { score: 20, description: "Catégorie correspond à vos préférences" }
   */
  const { item, score, reasons } = recommendation;

  /**
   * Récupération des labels français pour la catégorie et la condition
   *
   * FALLBACK:
   * - Si le label n'existe pas dans les constantes, utilise la valeur brute
   * - Cela garantit qu'un label est toujours affiché (même si la constante est manquante)
   *
   * TYPE-SAFETY:
   * - as keyof typeof ITEM_CATEGORY_LABELS: cast pour TypeScript
   * - Permet d'accéder aux labels de manière type-safe
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

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

  /**
   * FONCTION: getScoreColor
   *
   * Retourne la classe CSS de couleur selon le score de correspondance.
   *
   * LOGIQUE:
   * Le score est divisé en 4 tranches avec des couleurs différentes:
   * - 80-100: Vert (excellent match, très pertinent)
   * - 60-79: Jaune (bon match, pertinent)
   * - 40-59: Orange (match correct, moyennement pertinent)
   * - 0-39: Rouge (match faible, peu pertinent)
   *
   * UTILISATION:
   * Appliqué au badge circulaire du score pour un feedback visuel immédiat.
   *
   * EXEMPLES:
   * - getScoreColor(95) -> "bg-green-500" (excellent)
   * - getScoreColor(70) -> "bg-yellow-500" (bon)
   * - getScoreColor(50) -> "bg-orange-500" (correct)
   * - getScoreColor(30) -> "bg-red-500" (faible)
   *
   * @param score - Score de correspondance (0-100)
   * @returns Classe CSS Tailwind pour la couleur de fond
   */
  const getScoreColor = (score: number) => {
    /**
     * Tranche 1: Excellent match (80-100)
     * Vert pour indiquer une très forte correspondance
     */
    if (score >= 80) return 'bg-green-500';

    /**
     * Tranche 2: Bon match (60-79)
     * Jaune pour indiquer une bonne correspondance
     */
    if (score >= 60) return 'bg-yellow-500';

    /**
     * Tranche 3: Match correct (40-59)
     * Orange pour indiquer une correspondance moyenne
     */
    if (score >= 40) return 'bg-orange-500';

    /**
     * Tranche 4: Match faible (0-39)
     * Rouge pour indiquer une faible correspondance
     */
    return 'bg-red-500';
  };

  /**
   * FONCTION: getScoreText
   *
   * Retourne le texte descriptif selon le score de correspondance.
   *
   * LOGIQUE:
   * Même logique que getScoreColor, mais retourne un texte descriptif
   * au lieu d'une classe CSS. Utilisé dans le tooltip pour expliquer
   * le score de manière textuelle.
   *
   * UTILISATION:
   * Affiché dans le tooltip au survol du badge de score.
   *
   * EXEMPLES:
   * - getScoreText(95) -> "Excellent match"
   * - getScoreText(70) -> "Bon match"
   * - getScoreText(50) -> "Match correct"
   * - getScoreText(30) -> "Match faible"
   *
   * @param score - Score de correspondance (0-100)
   * @returns Texte descriptif en français
   */
  const getScoreText = (score: number) => {
    /**
     * Tranche 1: Excellent match (80-100)
     */
    if (score >= 80) return 'Excellent match';

    /**
     * Tranche 2: Bon match (60-79)
     */
    if (score >= 60) return 'Bon match';

    /**
     * Tranche 3: Match correct (40-59)
     */
    if (score >= 40) return 'Match correct';

    /**
     * Tranche 4: Match faible (0-39)
     */
    return 'Match faible';
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu de la carte de recommandation
   *
   * STRUCTURE:
   * - motion.div: Conteneur avec animations Framer Motion
   * - Card: Carte principale avec header et content
   * - Header: Titre, description, et badge de score
   * - Content: Tags, métadonnées, propriétaire, actions
   */
  return (
    /**
     * Conteneur avec animations Framer Motion
     *
     * ANIMATIONS:
     * - initial: État initial (opacity: 0, y: 20) - invisible et décalé vers le bas
     * - animate: État final (opacity: 1, y: 0) - visible et à sa position
     * - transition: Durée de 0.3s pour une animation fluide
     * - whileHover: Animation au survol (y: -4) - légère translation vers le haut
     *
     * group: Classe Tailwind pour gérer les styles au survol du parent
     * (utilisé pour changer la couleur du titre au survol)
     */
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      {/**
       * Carte principale
       *
       * STYLE:
       * - h-full: Hauteur complète (pour uniformiser les cartes dans la grille)
       * - overflow-hidden: Cache le contenu qui dépasse
       * - border-border/50: Bordure avec opacité 50%
       * - bg-card/50: Fond avec opacité 50%
       * - backdrop-blur-sm: Effet de flou d'arrière-plan
       * - hover:border-primary/50: Bordure primaire au survol
       * - hover:shadow-lg: Ombre plus prononcée au survol
       *
       * TRANSITIONS:
       * - transition-all duration-300: Transition fluide de 0.3s pour tous les changements
       */}
      <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <CardHeader className="pb-3">
          {/**
           * Conteneur flex pour le header
           * - flex items-start: Alignement vertical en haut
           * - justify-between: Espacement horizontal entre titre et score
           */}
          <div className="flex items-start justify-between">
            {/**
             * Section titre et description
             * - flex-1: Prend tout l'espace disponible
             */}
            <div className="flex-1">
              {/**
               * Titre de l'item
               *
               * STYLE:
               * - line-clamp-2: Limite à 2 lignes avec ellipsis
               * - text-lg font-semibold: Taille et poids de police
               * - group-hover:text-primary: Change en couleur primaire au survol du parent
               *
               * TRANSITION:
               * - transition-colors: Transition fluide pour le changement de couleur
               */}
              <h3 className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {item.title}
              </h3>
              {/**
               * Description de l'item
               *
               * STYLE:
               * - line-clamp-2: Limite à 2 lignes avec ellipsis
               * - text-sm: Taille de police plus petite
               * - text-muted-foreground: Couleur atténuée
               */}
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>

            {/* ============================================
                BADGE DE SCORE AVEC TOOLTIP
                ============================================ */}
            {/**
             * Provider pour les tooltips Radix UI
             *
             * TooltipProvider:
             * - Enveloppe tous les tooltips de la carte
             * - Gère le positionnement et l'affichage
             */}
            <TooltipProvider>
              <Tooltip>
                {/**
                 * Trigger du tooltip (badge de score)
                 *
                 * asChild:
                 * - Passe les props du trigger au div enfant
                 * - Permet de styliser le div comme trigger
                 */}
                <TooltipTrigger asChild>
                  {/**
                   * Badge circulaire du score
                   *
                   * STYLE:
                   * - h-12 w-12: Taille fixe de 48px (cercle)
                   * - rounded-full: Forme circulaire
                   * - ${getScoreColor(score)}: Couleur dynamique selon le score
                   * - text-white: Texte blanc pour contraste
                   * - shadow-lg: Ombre prononcée
                   *
                   * CONTENU:
                   * - Affiche le score (0-100) en gras
                   */}
                  <div
                    className={`ml-3 flex h-12 w-12 items-center justify-center rounded-full ${getScoreColor(score)} text-white shadow-lg`}
                  >
                    <span className="text-sm font-bold">{score}</span>
                  </div>
                </TooltipTrigger>
                {/**
                 * Contenu du tooltip (raisons du score)
                 *
                 * AFFICHAGE:
                 * - side="left": Affiche à gauche du badge
                 * - max-w-xs: Largeur maximale pour éviter les tooltips trop larges
                 *
                 * CONTENU:
                 * - Titre: Texte descriptif du score (ex: "Excellent match")
                 * - Liste: Toutes les raisons avec leur score individuel
                 */}
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2">
                    {/**
                     * Titre du tooltip
                     * - Affiche le texte descriptif du score
                     * - Ex: "Excellent match", "Bon match", etc.
                     */}
                    <p className="font-semibold">{getScoreText(score)}</p>
                    {/**
                     * Liste des raisons du score
                     *
                     * STRUCTURE:
                     * - Chaque raison affiche: "+{score}: {description}"
                     * - Ex: "+20: Catégorie correspond à vos préférences"
                     *
                     * space-y-1: Espacement vertical entre les raisons
                     */}
                    <div className="space-y-1">
                      {/**
                       * Générer une ligne pour chaque raison
                       *
                       * key={index}: Clé unique pour React
                       * reason.score: Points attribués pour cette raison
                       * reason.description: Explication de la raison
                       */}
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
          {/* ============================================
              BADGES: Catégorie, Condition, Popularité
              ============================================ */}
          {/**
           * Conteneur pour les badges de métadonnées
           *
           * CONTENU:
           * - Badge catégorie (variant="secondary")
           * - Badge condition (variant="outline")
           * - Badge popularité (variant="outline", conditionnel si > 0)
           *
           * STYLE:
           * - flex flex-wrap: Affichage horizontal avec retour à la ligne
           * - gap-2: Espacement entre les badges
           */}
          <div className="flex flex-wrap gap-2">
            {/**
             * Badge de catégorie
             * - variant="secondary": Style secondaire (fond coloré)
             * - Affiche le label français de la catégorie
             */}
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
            {/**
             * Badge de condition
             * - variant="outline": Style avec bordure (pas de fond)
             * - Affiche le label français de la condition
             */}
            <Badge variant="outline" className="text-xs">
              {conditionLabel}
            </Badge>
            {/**
             * Badge de popularité (conditionnel)
             *
             * AFFICHAGE:
             * - Seulement si item.popularityScore > 0
             * - Affiche l'icône étoile + le score
             *
             * POPULARITÉ:
             * - Score calculé selon les interactions (vues, favoris, etc.)
             * - Plus le score est élevé, plus l'item est populaire
             */}
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

          {/* ============================================
              TAGS
              ============================================ */}
          {/**
           * Affichage des tags (conditionnel)
           *
           * AFFICHAGE:
           * - Seulement si item.tags.length > 0
           * - Affiche les 3 premiers tags
           * - Affiche un badge "+X" si plus de 3 tags
           *
           * LIMITE:
           * - slice(0, 3): Prend seulement les 3 premiers tags
           * - Pour éviter d'encombrer l'interface
           */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {/**
               * Générer un badge pour chaque tag (max 3)
               *
               * key={index}: Clé unique pour React
               * variant="outline": Style avec bordure
               * #{tag}: Préfixe # pour indiquer que c'est un tag
               */}
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {/**
               * Badge "+X" si plus de 3 tags
               *
               * AFFICHAGE:
               * - Seulement si item.tags.length > 3
               * - Affiche le nombre de tags restants
               * - Ex: "+2" si 5 tags au total (3 affichés + 2 restants)
               */}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* ============================================
              PROPRIÉTAIRE
              ============================================ */}
          {/**
           * Section informations du propriétaire
           *
           * CONTENU:
           * - Avatar du propriétaire (photo ou initiales)
           * - Nom d'affichage
           * - Date de création (format relatif en français)
           *
           * STYLE:
           * - flex items-center: Alignement vertical centré
           * - gap-3: Espacement entre avatar et texte
           */}
          <div className="flex items-center gap-3">
            {/**
             * Avatar du propriétaire
             *
             * COMPOSANT:
             * - Avatar: Composant Radix UI pour les avatars
             * - AvatarImage: Image de l'avatar (si disponible)
             * - AvatarFallback: Initiales si pas d'image
             *
             * STYLE:
             * - h-8 w-8: Taille de 32px (petit avatar)
             */}
            <Avatar className="h-8 w-8">
              {/**
               * Image de l'avatar
               * - src: URL de l'image (Cloudinary)
               * - alt: Texte alternatif pour l'accessibilité
               */}
              <AvatarImage
                src={item.owner.avatarUrl}
                alt={item.owner.displayName}
              />
              {/**
               * Fallback: Initiales si pas d'image
               * - Prend la première lettre du displayName
               * - Convertit en majuscule
               * - text-xs: Taille de police petite
               */}
              <AvatarFallback className="text-xs">
                {item.owner.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/**
             * Informations textuelles du propriétaire
             * - flex-1: Prend tout l'espace disponible
             */}
            <div className="flex-1">
              {/**
               * Nom d'affichage du propriétaire
               * - text-sm font-medium: Taille et poids de police
               */}
              <p className="text-sm font-medium text-foreground">
                {item.owner.displayName}
              </p>
              {/**
               * Date de création formatée
               *
               * FORMAT:
               * - formatDistanceToNow: Format relatif (ex: "il y a 2 jours")
               * - addSuffix: true -> Ajoute "il y a" ou "dans"
               * - locale: fr -> Format en français
               *
               * EXEMPLES:
               * - "il y a 2 jours"
               * - "il y a 3 heures"
               * - "à l'instant"
               */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </div>
            </div>
          </div>

          {/* ============================================
              ACTIONS
              ============================================ */}
          {/**
           * Section des boutons d'action
           *
           * ACTIONS:
           * - Bouton principal: "Voir l'objet" (lien vers la page de détail)
           * - Bouton secondaire: Favoris (étoile, à implémenter)
           *
           * STYLE:
           * - flex gap-2: Affichage horizontal avec espacement
           * - pt-2: Padding-top pour séparer des autres sections
           */}
          <div className="flex gap-2 pt-2">
            {/**
             * Bouton principal: Voir l'objet
             *
             * asChild:
             * - Passe les props du Button au Link enfant
             * - Permet d'utiliser Link comme bouton stylisé
             *
             * STYLE:
             * - flex-1: Prend tout l'espace disponible
             * - size="sm": Taille petite
             *
             * NAVIGATION:
             * - Link vers /item/[id] pour voir les détails
             * - ArrowRight: Icône flèche vers la droite
             */}
            <Button asChild className="flex-1" size="sm">
              <Link href={`/item/${item.id}`}>
                Voir l'objet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {/**
             * Bouton secondaire: Favoris
             *
             * NOTE:
             * - Actuellement juste un bouton avec icône étoile
             * - Fonctionnalité de favoris à implémenter
             *
             * STYLE:
             * - variant="outline": Style avec bordure
             * - size="sm": Taille petite
             * - px-3: Padding horizontal réduit (bouton carré)
             */}
            <Button variant="outline" size="sm" className="px-3">
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

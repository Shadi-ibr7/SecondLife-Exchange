/**
 * FICHIER: components/matching/MatchBanner.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une bannière promotionnelle lorsqu'un item correspond
 * particulièrement bien aux préférences de l'utilisateur connecté.
 * Il calcule un score de correspondance basé sur les préférences utilisateur
 * et n'affiche la bannière que si le score est suffisamment élevé (≥70%).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Calcul automatique du score de correspondance côté client
 * - Affichage conditionnel (seulement si score ≥ 70%)
 * - Animation d'apparition/disparition avec Framer Motion
 * - Bouton pour proposer un échange directement
 * - Possibilité de fermer la bannière
 * - État de chargement avec skeleton
 *
 * ALGORITHME DE SCORE:
 * Le score est calculé en additionnant plusieurs facteurs:
 * - +30 points si la catégorie de l'item est dans les préférences
 * - +20 points si la condition est préférée
 * - +10 points par tag commun (max 20 points)
 * - +15 points si l'item est populaire (popularityScore > 50)
 * - +10 points si même région (simulation)
 * - Score final plafonné à 100%
 *
 * UX:
 * - La bannière n'apparaît que pour les utilisateurs authentifiés
 * - Elle ne s'affiche pas si l'utilisateur est le propriétaire de l'item
 * - Animation fluide pour attirer l'attention sans être intrusive
 */

'use client';

// Import de React pour la gestion de l'état et des effets
import { useState, useEffect } from 'react';
// Import de Framer Motion pour les animations fluides
import { motion } from 'framer-motion';
// Import des composants UI réutilisables
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import des types TypeScript pour garantir la sécurité des types
import { Item } from '@/types';
// Import de l'API de matching pour récupérer les préférences utilisateur
import { matchingApi } from '@/lib/matching.api';
// Import du store d'authentification pour vérifier l'utilisateur connecté
import { useAuthStore } from '@/store/auth';
// Import de react-hot-toast pour afficher des notifications
import { toast } from 'react-hot-toast';
// Import des icônes Lucide React
import { Heart, Sparkles, ArrowRight, X } from 'lucide-react';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface MatchBannerProps {
  item: Item; // L'item pour lequel calculer le score de correspondance
  onClose?: () => void; // Callback optionnel appelé quand l'utilisateur ferme la bannière
}

/**
 * COMPOSANT PRINCIPAL: MatchBanner
 *
 * Ce composant affiche une bannière promotionnelle pour les items qui correspondent
 * bien aux préférences de l'utilisateur connecté.
 *
 * @param item - L'item pour lequel calculer le score de correspondance
 * @param onClose - Callback optionnel appelé quand l'utilisateur ferme la bannière
 */
export function MatchBanner({ item, onClose }: MatchBannerProps) {
  // ============================================
  // GESTION DE L'ÉTAT
  // ============================================

  /**
   * Récupération de l'état d'authentification depuis le store Zustand
   * isAuthenticated: indique si l'utilisateur est connecté
   * user: les informations de l'utilisateur connecté (ou null)
   */
  const { isAuthenticated, user } = useAuthStore();

  /**
   * État pour stocker le score de correspondance calculé
   * null signifie que le calcul n'a pas encore été effectué ou a échoué
   */
  const [matchScore, setMatchScore] = useState<number | null>(null);

  /**
   * État pour indiquer si le calcul du score est en cours
   * Utilisé pour afficher un skeleton de chargement
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * État pour contrôler la visibilité de la bannière
   * Permet de la masquer si l'utilisateur clique sur le bouton de fermeture
   */
  const [isVisible, setIsVisible] = useState(true);

  // ============================================
  // EFFET POUR CALCULER LE SCORE AU MONTAGE
  // ============================================

  /**
   * useEffect qui se déclenche quand le composant est monté ou quand
   * les dépendances changent (isAuthenticated, user, item)
   *
   * Il vérifie d'abord que:
   * - L'utilisateur est authentifié
   * - L'utilisateur existe
   * - L'utilisateur n'est pas le propriétaire de l'item
   *
   * Si toutes ces conditions sont remplies, il calcule le score de correspondance
   */
  useEffect(() => {
    // Ne pas calculer le score si l'utilisateur n'est pas authentifié
    // ou s'il est le propriétaire de l'item (on ne recommande pas ses propres items)
    if (!isAuthenticated || !user || user.id === item.ownerId) {
      return;
    }

    // Calculer un score de match basique côté client
    // Cette fonction est asynchrone et met à jour matchScore et isLoading
    calculateMatchScore();
  }, [isAuthenticated, user, item]);

  // ============================================
  // FONCTION POUR CALCULER LE SCORE DE CORRESPONDANCE
  // ============================================

  /**
   * Fonction asynchrone qui calcule le score de correspondance entre l'item
   * et les préférences de l'utilisateur connecté.
   *
   * ALGORITHME:
   * Le score est calculé en additionnant plusieurs facteurs:
   * 1. Catégorie préférée: +30 points si la catégorie de l'item est dans les préférences
   * 2. Condition préférée: +20 points si la condition est préférée
   * 3. Tags communs: +10 points par tag commun (maximum 20 points)
   * 4. Popularité: +15 points si l'item est populaire (popularityScore > 50)
   * 5. Proximité géographique: +10 points si même région (simulation)
   *
   * Le score final est plafonné à 100%.
   */
  const calculateMatchScore = async () => {
    // Activer l'état de chargement pour afficher le skeleton
    setIsLoading(true);

    try {
      // Récupérer les préférences de l'utilisateur depuis l'API
      // Cette fonction fait un appel HTTP GET /matching/preferences
      const preferences = await matchingApi.getPreferences();

      // Initialiser le score à 0
      let score = 0;
      // Tableau pour stocker les raisons du score (non utilisé actuellement mais utile pour debug)
      const reasons: string[] = [];

      // ============================================
      // FACTEUR 1: CATÉGORIE PRÉFÉRÉE (+30 points)
      // ============================================
      /**
       * Si la catégorie de l'item est dans la liste des catégories préférées
       * de l'utilisateur, on ajoute 30 points au score.
       * C'est le facteur le plus important car il indique un intérêt fort.
       */
      if (preferences.preferences.preferredCategories.includes(item.category)) {
        score += 30;
        reasons.push('Catégorie préférée');
      }

      // ============================================
      // FACTEUR 2: CONDITION PRÉFÉRÉE (+20 points)
      // ============================================
      /**
       * Si la condition de l'item (neuf, bon état, etc.) est dans la liste
       * des conditions préférées, on ajoute 20 points.
       */
      if (
        preferences.preferences.preferredConditions.includes(item.condition)
      ) {
        score += 20;
        reasons.push('Condition préférée');
      }

      // ============================================
      // FACTEUR 3: TAGS COMMUNS (+10 points par tag, max 20)
      // ============================================
      /**
       * On cherche les tags de l'item qui correspondent (même partiellement)
       * aux catégories préférées de l'utilisateur.
       *
       * Pour chaque tag commun, on ajoute 10 points, avec un maximum de 20 points
       * pour éviter que les items avec beaucoup de tags aient un avantage trop important.
       */
      const commonTags = item.tags.filter((tag) =>
        preferences.preferences.preferredCategories.some(
          (cat) =>
            // Vérification insensible à la casse avec includes()
            // Exemple: "Électronique" correspond à "électronique"
            cat.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(cat.toLowerCase())
        )
      );
      if (commonTags.length > 0) {
        // Math.min() garantit qu'on ne dépasse pas 20 points même avec beaucoup de tags
        score += Math.min(commonTags.length * 10, 20);
        reasons.push(`${commonTags.length} tag(s) commun(s)`);
      }

      // ============================================
      // FACTEUR 4: POPULARITÉ (+15 points)
      // ============================================
      /**
       * Si l'item a un score de popularité élevé (> 50), on ajoute 15 points.
       * Cela favorise les items qui intéressent déjà beaucoup d'utilisateurs.
       */
      if (item.popularityScore > 50) {
        score += 15;
        reasons.push('Objet populaire');
      }

      // ============================================
      // FACTEUR 5: PROXIMITÉ GÉOGRAPHIQUE (+10 points)
      // ============================================
      /**
       * Si l'utilisateur a renseigné un pays dans ses préférences, on ajoute 10 points.
       * Dans une vraie application, on comparerait les coordonnées GPS ou les villes.
       * Ici, c'est une simulation basique.
       */
      if (preferences.preferences.country) {
        score += 10;
        reasons.push('Même région');
      }

      // Plafonner le score à 100% (même si la somme dépasse 100)
      // Math.min() garantit que le score ne dépasse jamais 100
      setMatchScore(Math.min(score, 100));
    } catch (error) {
      // En cas d'erreur (ex: API indisponible), on log l'erreur mais on ne bloque pas l'UI
      console.error('Erreur lors du calcul du score de match:', error);
      // Le score reste à null, donc la bannière ne s'affichera pas
    } finally {
      // Toujours désactiver le chargement, même en cas d'erreur
      setIsLoading(false);
    }
  };

  // ============================================
  // GESTION DU CLIC SUR LE BOUTON DE FERMETURE
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur clique sur le bouton X pour fermer la bannière.
   * Elle masque la bannière et appelle le callback optionnel onClose.
   */
  const handleClose = () => {
    setIsVisible(false); // Masquer la bannière
    onClose?.(); // Appeler le callback si fourni (syntaxe optionnelle avec ?.)
  };

  // ============================================
  // CONDITIONS D'AFFICHAGE
  // ============================================

  /**
   * La bannière ne s'affiche que si:
   * - L'utilisateur est authentifié
   * - L'utilisateur existe
   * - L'utilisateur n'est pas le propriétaire de l'item
   * - La bannière est visible (n'a pas été fermée)
   *
   * Si une de ces conditions n'est pas remplie, on retourne null (rien ne s'affiche)
   */
  if (!isAuthenticated || !user || user.id === item.ownerId || !isVisible) {
    return null;
  }

  // ============================================
  // ÉTAT DE CHARGEMENT (SKELETON)
  // ============================================

  /**
   * Pendant le calcul du score, on affiche un skeleton (animation de chargement)
   * pour indiquer à l'utilisateur que quelque chose se passe.
   */
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

  // ============================================
  // FILTRE PAR SCORE MINIMUM
  // ============================================

  /**
   * La bannière ne s'affiche que si le score de correspondance est ≥ 70%.
   * En dessous de ce seuil, on considère que la correspondance n'est pas
   * assez forte pour justifier une bannière promotionnelle.
   */
  if (!matchScore || matchScore < 70) {
    return null;
  }

  // ============================================
  // FONCTIONS UTILITAIRES POUR LE STYLE
  // ============================================

  /**
   * Retourne la couleur de fond du badge de score selon le score obtenu.
   * - ≥ 90%: vert (match parfait)
   * - ≥ 80%: bleu (excellent match)
   * - < 80%: jaune (bon match)
   *
   * @param score - Le score de correspondance (0-100)
   * @returns Classe CSS Tailwind pour la couleur de fond
   */
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'; // Match parfait: vert
    if (score >= 80) return 'bg-blue-500'; // Excellent match: bleu
    return 'bg-yellow-500'; // Bon match: jaune
  };

  /**
   * Retourne le texte descriptif selon le score obtenu.
   *
   * @param score - Le score de correspondance (0-100)
   * @returns Texte descriptif du niveau de correspondance
   */
  const getScoreText = (score: number) => {
    if (score >= 90) return 'Match parfait !';
    if (score >= 80) return 'Excellent match';
    return 'Bon match';
  };

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  /**
   * motion.div ajoute une animation d'apparition fluide à la bannière
   * initial: état initial (invisible et légèrement en bas)
   * animate: état final (visible et à sa position normale)
   * exit: état de sortie (invisible et remonte légèrement)
   */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      {/*
        Card avec un dégradé de couleur pour attirer l'attention
        border-primary/20: bordure avec 20% d'opacité de la couleur primaire
        bg-gradient-to-r: dégradé horizontal de gauche à droite
        from-primary/5 to-primary/10: du 5% au 10% d'opacité de la couleur primaire
      */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* ============================================
                SECTION GAUCHE: Icône et texte
                ============================================ */}
            <div className="flex items-center gap-3">
              {/*
                Badge circulaire avec l'icône cœur et la couleur selon le score
                h-10 w-10: taille de 40px x 40px
                rounded-full: forme circulaire
                flex items-center justify-center: centrer l'icône
                shadow-lg: ombre portée pour donner de la profondeur
              */}
              <div
                className={`h-10 w-10 rounded-full ${getScoreColor(matchScore)} flex items-center justify-center text-white shadow-lg`}
              >
                <Heart className="h-5 w-5" />
              </div>
              <div>
                {/*
                  Ligne avec le titre et le badge de score
                  flex items-center gap-2: aligner horizontalement avec espacement
                */}
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {getScoreText(matchScore)}
                  </h3>
                  {/*
                    Badge affichant le score en pourcentage
                    variant="secondary": style secondaire (gris)
                    text-xs: texte très petit
                  */}
                  <Badge variant="secondary" className="text-xs">
                    {matchScore}%
                  </Badge>
                </div>
                {/*
                  Message explicatif pour encourager l'utilisateur
                  text-sm: texte petit
                  text-muted-foreground: couleur atténuée pour le texte secondaire
                */}
                <p className="text-sm text-muted-foreground">
                  Cet objet correspond parfaitement à vos préférences !
                </p>
              </div>
            </div>

            {/* ============================================
                SECTION DROITE: Boutons d'action
                ============================================ */}
            <div className="flex items-center gap-2">
              {/*
                Bouton principal pour proposer un échange
                size="sm": petite taille
                bg-primary hover:bg-primary/90: couleur primaire avec effet au survol
              */}
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Sparkles className="mr-2 h-4 w-4" />
                Proposer un échange
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {/*
                Bouton de fermeture (X)
                variant="ghost": style transparent
                size="sm": petite taille
                h-8 w-8 p-0: taille fixe 32px x 32px sans padding
                onClick={handleClose}: appeler la fonction de fermeture au clic
              */}
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

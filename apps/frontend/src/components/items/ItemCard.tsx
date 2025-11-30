/**
 * FICHIER: components/items/ItemCard.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une carte d'item (objet) dans une grille ou une liste.
 * Il présente les informations essentielles de l'item : photo, titre, description,
 * catégorie, condition, localisation, et tags. Il gère également les items mock
 * (aperçus) qui ne sont pas encore publiés.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage de la première photo de l'item (ou placeholder si aucune photo)
 * - Lien vers la page de détail de l'item (ou message toast pour les items mock)
 * - Animation d'apparition avec délai progressif (stagger effect)
 * - Gestion des items mock (aperçu) avec toast informatif au clic
 * - Formatage du temps relatif en français (ex: "il y a 2 jours")
 * - Affichage des badges de catégorie, condition et tags
 * - Affichage du propriétaire et de la localisation
 *
 * UX:
 * - Effet hover avec ombre pour indiquer l'interactivité
 * - Animation fluide d'apparition pour chaque carte
 * - Message clair pour les items mock (non publiés)
 * - Design responsive qui s'adapte à la taille de l'écran
 */

'use client';

// Import de Next.js pour la navigation
import Link from 'next/link';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import des types
import { Item } from '@/types';

// Import des constantes pour les labels
import { ITEM_CATEGORY_LABELS, ITEM_CONDITION_LABELS } from '@/lib/constants';

// Import des icônes
import { MapPin, Calendar } from 'lucide-react';

// Import de date-fns pour le formatage des dates
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import de react-hot-toast pour les notifications
import { toast } from 'react-hot-toast';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ItemCardProps {
  item: Item; // L'item à afficher (avec toutes ses propriétés)
  index?: number; // Index pour l'animation progressive (défaut: 0). Utilisé pour créer un effet stagger
}

/**
 * COMPOSANT PRINCIPAL: ItemCard
 *
 * Ce composant affiche une carte d'item avec toutes ses informations essentielles.
 *
 * @param item - L'item à afficher
 * @param index - Index pour l'animation progressive (défaut: 0)
 */
export function ItemCard({ item, index = 0 }: ItemCardProps) {
  // ============================================
  // FONCTION: formatRelativeTime
  // ============================================

  /**
   * Formate une date en temps relatif en français (ex: "il y a 2 jours").
   * Utilise la bibliothèque date-fns avec la locale française pour un formatage
   * naturel et lisible.
   *
   * @param date - Date à formater (string ISO, ex: "2024-01-20T10:30:00Z")
   * @returns Temps relatif formaté en français (ex: "il y a 2 jours")
   */
  const formatRelativeTime = (date: string) => {
    /**
     * formatDistanceToNow() calcule la distance entre la date donnée et maintenant
     * addSuffix: true ajoute "il y a" ou "dans" au début
     * locale: fr utilise la locale française pour les traductions
     */
    return formatDistanceToNow(new Date(date), {
      addSuffix: true, // Ajouter "il y a" ou "dans" au début
      locale: fr, // Utiliser la locale française
    });
  };

  // ============================================
  // GESTION DES ITEMS MOCK (APERÇU)
  // ============================================

  /**
   * Vérifie si l'item est un item mock (aperçu).
   * Les items mock ont un ID qui commence par "mock-".
   * Ces items sont utilisés pour prévisualiser un item avant sa publication.
   * Ils ne sont pas encore sauvegardés en base de données.
   */
  const isMock = item.id.startsWith('mock-');

  /**
   * Gestionnaire de clic pour les items mock.
   * Empêche la navigation vers la page de détail (car l'item n'existe pas encore)
   * et affiche un toast informatif pour expliquer à l'utilisateur qu'il doit
   * publier l'item pour voir la fiche détaillée.
   *
   * @param e - Événement de clic sur le lien
   */
  const handleMockClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (isMock) {
      /**
       * Empêcher la navigation par défaut
       * preventDefault() empêche le navigateur de suivre le lien
       */
      e.preventDefault();

      /**
       * Afficher un message informatif à l'utilisateur
       * toast() affiche une notification temporaire en bas de l'écran
       */
      toast("Aperçu d'annonce. Publiez un objet pour voir la fiche détaillée.");
    }
  };

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  return (
    <>
      {/*
        Conteneur avec animation Framer Motion
        initial: état initial (invisible et légèrement en bas)
        animate: état final (visible et à sa position normale)
        transition: durée de l'animation et délai progressif selon l'index
        delay: index * 0.1 crée un effet stagger (chaque carte apparaît avec un délai)
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // État initial: invisible et 20px en bas
        animate={{ opacity: 1, y: 0 }} // État final: visible et à sa position normale
        transition={{ duration: 0.4, delay: index * 0.1 }} // Délai progressif pour l'effet stagger
      >
        {/*
        Carte avec effet hover
        h-full: hauteur complète pour que toutes les cartes aient la même hauteur
        cursor-pointer: curseur pointeur pour indiquer qu'on peut cliquer
        transition-shadow: transition fluide pour l'ombre
        hover:shadow-lg: ombre plus prononcée au survol
      */}
        <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
          {/*
          Lien vers la page de détail de l'item
          href: URL vers la page de détail (ou /explore pour les items mock)
          onClick: gestionnaire de clic pour les items mock
        */}
          <Link
            href={isMock ? '/explore' : `/item/${item.id}`} // Lien vers la page de détail ou explore pour les mocks
            onClick={handleMockClick} // Gérer le clic pour les items mock
          >
            {/*
            Conteneur pour la photo de l'item
            aspect-square: format carré (1:1) pour un affichage uniforme
            bg-muted: fond gris si aucune photo
            rounded-t-lg: coins arrondis en haut seulement
          */}
            <div className="flex aspect-square items-center justify-center rounded-t-lg bg-muted">
              {/*
              Afficher la photo si disponible, sinon un placeholder
            */}
              {item.photos.length > 0 ? (
                <>
                  {/*
                  Image de l'item
                  src: URL de la première photo
                  alt: texte alternatif pour l'accessibilité
                  object-cover: l'image couvre tout l'espace en gardant ses proportions
                  rounded-t-lg: coins arrondis en haut
                */}
                  <img
                    src={item.photos[0].url}
                    alt={item.title}
                    className="h-full w-full rounded-t-lg object-cover"
                  />
                </>
              ) : (
                <>
                  {/*
                  Placeholder si aucune photo
                  text-center: centrer le texte
                  text-muted-foreground: couleur atténuée
                */}
                  <div className="text-center text-muted-foreground">
                    <div className="mb-2 text-4xl">📦</div>
                    <p>Aucune image</p>
                  </div>
                </>
              )}
            </div>

            {/*
            En-tête de la carte avec titre et localisation
            pb-2: padding en bas de 8px
          */}
            <CardHeader className="pb-2">
              {/*
              Titre de l'item
              line-clamp-2: limiter à 2 lignes avec ellipsis si trop long
              text-lg: texte large
            */}
              <CardTitle className="line-clamp-2 text-lg">
                {item.title}
              </CardTitle>
              {/*
              Localisation avec icône
              flex items-center gap-2: aligner horizontalement avec espacement
              text-sm: texte petit
              text-muted-foreground: couleur atténuée
            */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {item.owner.location || 'Localisation non précisée'}
                </span>
              </div>
            </CardHeader>

            {/*
            Contenu de la carte
          */}
            <CardContent>
              {/*
              Description de l'item
              mb-3: marge en bas de 12px
              line-clamp-2: limiter à 2 lignes avec ellipsis
              text-sm: texte petit
              text-muted-foreground: couleur atténuée
            */}
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>

              {/*
              Badges de catégorie et condition
              mb-3: marge en bas de 12px
              flex flex-wrap gap-2: affichage en ligne avec retour à la ligne si nécessaire
            */}
              <div className="mb-3 flex flex-wrap gap-2">
                {/*
                Badge de catégorie
                variant="secondary": style secondaire (gris)
                ITEM_CATEGORY_LABELS: dictionnaire des labels traduits
              */}
                <Badge variant="secondary">
                  {ITEM_CATEGORY_LABELS[item.category] || item.category}
                </Badge>
                {/*
                Badge de condition
                variant="outline": style avec bordure
                ITEM_CONDITION_LABELS: dictionnaire des labels traduits
              */}
                <Badge variant="outline">
                  {ITEM_CONDITION_LABELS[item.condition] || item.condition}
                </Badge>
              </div>

              {/*
              Informations du propriétaire et date de création
              flex items-center justify-between: aligner horizontalement avec espacement
              text-sm: texte petit
              text-muted-foreground: couleur atténuée
            */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Par {item.owner.displayName}</span>
                {/*
                Date de création avec icône calendrier
                flex items-center gap-1: aligner horizontalement avec espacement
              */}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </div>
              </div>

              {/*
              Tags de l'item (afficher seulement les 3 premiers + compteur)
              Afficher seulement si l'item a des tags
            */}
              {item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {/*
                  Afficher les 3 premiers tags
                  slice(0, 3): prendre seulement les 3 premiers éléments
                */}
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {/*
                  Afficher un badge avec le nombre de tags restants
                  Si plus de 3 tags, afficher "+X" pour indiquer qu'il y en a d'autres
                */}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Link>
        </Card>
      </motion.div>
    </>
  );
}

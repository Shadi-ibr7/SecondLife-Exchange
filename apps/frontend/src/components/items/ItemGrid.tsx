/**
 * FICHIER: components/items/ItemGrid.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une grille d'items (objets) de manière responsive.
 * Il gère les états de chargement, les cas vides, et utilise le composant ItemCard
 * pour afficher chaque item individuellement.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage en grille responsive (1 colonne mobile, 2 tablette, 3 desktop)
 * - État de chargement avec skeleton (6 cartes animées)
 * - État vide avec message encourageant
 * - Utilisation du composant ItemCard pour chaque item
 *
 * UX:
 * - Feedback visuel clair pour chaque état (chargement, vide, avec données)
 * - Message encourageant si aucun item n'est trouvé
 * - Grille responsive qui s'adapte à la taille de l'écran
 */

'use client';

// Import des types TypeScript pour garantir la sécurité des types
import { Item } from '@/types';
// Import du composant ItemCard pour afficher chaque item
import { ItemCard } from './ItemCard';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ItemGridProps {
  items: Item[]; // Liste des items à afficher
  loading?: boolean; // Indique si les items sont en cours de chargement
}

/**
 * COMPOSANT PRINCIPAL: ItemGrid
 *
 * Ce composant affiche une grille d'items de manière responsive.
 *
 * @param items - Liste des items à afficher
 * @param loading - Indique si les items sont en cours de chargement
 */
export function ItemGrid({ items, loading = false }: ItemGridProps) {
  // ============================================
  // ÉTAT DE CHARGEMENT (SKELETON)
  // ============================================

  /**
   * Pendant le chargement, afficher un skeleton avec 6 cartes animées
   * Cela donne un feedback visuel à l'utilisateur pendant que les données se chargent
   */
  if (loading) {
    return (
      <>
        {/*
          Grille responsive pour le skeleton:
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
            bg-muted: fond gris
            h-80: hauteur fixe de 320px pour chaque carte
          */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </>
    );
  }

  // ============================================
  // ÉTAT VIDE (AUCUN ITEM)
  // ============================================

  /**
   * Si aucun item n'est disponible, afficher un message encourageant
   * avec des suggestions pour modifier les critères de recherche
   */
  if (items.length === 0) {
    return (
      <>
        {/*
          Conteneur centré avec padding vertical pour l'état vide
          py-16: padding vertical de 64px
          text-center: centrer le texte
        */}
        <div className="py-16 text-center">
          {/*
            Emoji loupe pour illustrer l'absence de résultats
            text-6xl: très grande taille pour attirer l'attention
            mb-4: marge en bas de 16px
          */}
          <div className="mb-4 text-6xl">🔍</div>
          {/*
            Titre de l'état vide
            mb-2: marge en bas de 8px
            text-xl: texte extra-large
            font-semibold: police semi-grasse
          */}
          <h3 className="mb-2 text-xl font-semibold">Aucun objet trouvé</h3>
          {/*
            Message explicatif pour encourager l'utilisateur à modifier ses critères
            mb-4: marge en bas de 16px
            text-muted-foreground: couleur atténuée pour le texte secondaire
          */}
          <p className="mb-4 text-muted-foreground">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      </>
    );
  }

  // ============================================
  // RENDU AVEC ITEMS
  // ============================================

  /**
   * Si des items sont disponibles, afficher la grille avec les cartes
   */
  return (
    <>
      {/*
        Grille responsive pour afficher les items:
        - grid-cols-1: 1 colonne sur mobile
        - md:grid-cols-2: 2 colonnes sur tablette (≥768px)
        - lg:grid-cols-3: 3 colonnes sur desktop (≥1024px)
        gap-6: espacement de 24px entre les cartes
      */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/*
          Parcourir chaque item et l'afficher avec le composant ItemCard
          key={item.id}: clé unique pour React (optimisation du rendu)
          index={index}: index passé au composant pour les animations
        */}
        {items.map((item, index) => (
          <ItemCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </>
  );
}

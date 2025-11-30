/**
 * FICHIER: components/exchanges/ExchangeList.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une liste d'échanges de manière responsive.
 * Il gère les états de chargement, les cas vides, et utilise le composant ExchangeCard
 * pour afficher chaque échange individuellement.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage en grille responsive (1 colonne mobile, 2 tablette, 3 desktop)
 * - État de chargement avec skeleton (6 cartes animées)
 * - État vide avec message encourageant et bouton d'action
 * - Utilisation du composant ExchangeCard pour chaque échange
 * - Identification de l'utilisateur actuel pour personnaliser l'affichage
 *
 * UX:
 * - Feedback visuel clair pour chaque état (chargement, vide, avec données)
 * - Message encourageant avec call-to-action si aucun échange
 * - Grille responsive qui s'adapte à la taille de l'écran
 */

// Import des types TypeScript pour garantir la sécurité des types
import { Exchange } from '@/types';
// Import du composant ExchangeCard pour afficher chaque échange
import { ExchangeCard } from './ExchangeCard';
// Import du store d'authentification pour récupérer l'utilisateur connecté
import { useAuthStore } from '@/store/auth';
// Import du composant Skeleton pour l'état de chargement
import { Skeleton } from '@/components/ui/skeleton';
// Import de Next.js Link pour la navigation
import Link from 'next/link';
// Import des composants UI réutilisables
import { Button } from '@/components/ui/button';
// Import des icônes Lucide React
import { MessageCircle } from 'lucide-react';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ExchangeListProps {
  exchanges: Exchange[]; // Liste des échanges à afficher
  isLoading?: boolean; // Indique si les échanges sont en cours de chargement
}

/**
 * COMPOSANT PRINCIPAL: ExchangeList
 *
 * Ce composant affiche une liste d'échanges de manière responsive.
 *
 * @param exchanges - Liste des échanges à afficher
 * @param isLoading - Indique si les échanges sont en cours de chargement
 */
export function ExchangeList({
  exchanges,
  isLoading = false,
}: ExchangeListProps) {
  // ============================================
  // GESTION DE L'ÉTAT
  // ============================================

  /**
   * Récupération de l'utilisateur connecté depuis le store Zustand
   * user peut être null si l'utilisateur n'est pas connecté
   * On a besoin de l'ID utilisateur pour déterminer si c'est le requester ou le responder
   */
  const { user } = useAuthStore();

  // ============================================
  // ÉTAT DE CHARGEMENT (SKELETON)
  // ============================================

  /**
   * Pendant le chargement, afficher un skeleton avec 6 cartes animées
   * Cela donne un feedback visuel à l'utilisateur pendant que les données se chargent
   */
  if (isLoading) {
    return (
      <>
        {/*
          Grille responsive pour le skeleton:
          - grid-cols-1: 1 colonne sur mobile
          - md:grid-cols-2: 2 colonnes sur tablette (≥768px)
          - xl:grid-cols-3: 3 colonnes sur desktop extra-large (≥1280px)
          gap-6: espacement de 24px entre les cartes
        */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/*
            Créer 6 cartes skeleton pour simuler le chargement
            Array.from({ length: 6 }) crée un tableau de 6 éléments
            space-y-3: espacement vertical de 12px entre les éléments du skeleton
          */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              {/*
                Skeleton pour le titre (3/4 de la largeur)
                h-4: hauteur de 16px
                w-3/4: largeur de 75%
              */}
              <Skeleton className="h-4 w-3/4" />
              {/*
                Skeleton pour le sous-titre (1/2 de la largeur)
                h-4: hauteur de 16px
                w-1/2: largeur de 50%
              */}
              <Skeleton className="h-4 w-1/2" />
              {/*
                Skeleton pour le contenu principal
                h-32: hauteur de 128px
                w-full: largeur complète
              */}
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </>
    );
  }

  // ============================================
  // ÉTAT VIDE (AUCUN ÉCHANGE)
  // ============================================

  /**
   * Si aucun échange n'est disponible, afficher un message encourageant
   * avec un bouton pour explorer les objets et proposer un échange
   */
  if (exchanges.length === 0) {
    return (
      <>
        {/*
          Conteneur stylisé pour l'état vide
          rounded-3xl: coins très arrondis (24px)
          border border-dashed: bordure en pointillés
          border-border/60: bordure avec 60% d'opacité
          bg-card/40: fond avec 40% d'opacité
          backdrop-blur-sm: flou d'arrière-plan léger
          p-12: padding de 48px
          text-center: centrer le texte
        */}
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-12 text-center backdrop-blur-sm">
          {/*
            Icône dans un cercle coloré
            mx-auto: centrer horizontalement
            mb-6: marge en bas de 24px
            h-16 w-16: taille de 64px x 64px
            rounded-full: forme circulaire
            bg-primary/10: fond avec 10% d'opacité de la couleur primaire
            text-primary: couleur primaire pour l'icône
          */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="h-7 w-7" />
          </div>
          {/*
            Titre de l'état vide
            mb-2: marge en bas de 8px
            text-xl: texte extra-large
            font-semibold: police semi-grasse
          */}
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            Aucun échange en cours
          </h3>
          {/*
            Message explicatif pour encourager l'utilisateur à proposer un échange
            mb-6: marge en bas de 24px
            text-sm: texte petit
            text-muted-foreground: couleur atténuée pour le texte secondaire
          */}
          <p className="mb-6 text-sm text-muted-foreground">
            Lancez-vous en proposant un échange sur un objet qui vous inspire.
          </p>
          {/*
            Bouton d'action pour explorer les objets
            asChild: permet de rendre le bouton comme un Link
            Cela permet d'avoir un bouton stylisé qui fonctionne comme un lien
          */}
          <Button asChild>
            <Link href="/explore">Explorer les objets</Link>
          </Button>
        </div>
      </>
    );
  }

  // ============================================
  // RENDU AVEC ÉCHANGES
  // ============================================

  /**
   * Si des échanges sont disponibles, afficher la grille avec les cartes
   */
  return (
    <>
      {/*
        Grille responsive pour afficher les échanges:
        - grid-cols-1: 1 colonne sur mobile
        - md:grid-cols-2: 2 colonnes sur tablette (≥768px)
        - xl:grid-cols-3: 3 colonnes sur desktop extra-large (≥1280px)
        gap-6: espacement de 24px entre les cartes
      */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/*
          Parcourir chaque échange et l'afficher avec le composant ExchangeCard
          key={exchange.id}: clé unique pour React (optimisation du rendu)
          currentUserId: ID de l'utilisateur connecté pour personnaliser l'affichage
          (déterminer si c'est le requester ou le responder)
        */}
        {exchanges.map((exchange) => (
          <ExchangeCard
            key={exchange.id}
            exchange={exchange}
            currentUserId={user?.id || ''} // Passer l'ID utilisateur ou chaîne vide si non connecté
          />
        ))}
      </div>
    </>
  );
}

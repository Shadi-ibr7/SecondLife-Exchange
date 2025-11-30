/**
 * FICHIER: components/exchanges/StatusBadge.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche un badge (pastille) coloré pour indiquer le statut d'un échange.
 * Il associe automatiquement une couleur et un label selon le statut, mais permet
 * aussi de surcharger la variante si nécessaire.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage du statut avec label traduit en français
 * - Couleur automatique selon le statut (vert pour accepté, rouge pour refusé, etc.)
 * - Possibilité de surcharger la variante de couleur
 * - Support des classes CSS personnalisées
 *
 * STATUTS SUPPORTÉS:
 * - PENDING: En attente (outline = bordure)
 * - ACCEPTED: Accepté (default = bleu/vert)
 * - DECLINED: Refusé (destructive = rouge)
 * - COMPLETED: Terminé (secondary = gris)
 * - CANCELLED: Annulé (secondary = gris)
 *
 * UX:
 * - Couleurs intuitives (rouge = refusé, vert = accepté, etc.)
 * - Labels clairs en français
 * - Design cohérent avec le reste de l'application
 */

// Import du composant Badge réutilisable
import { Badge } from '@/components/ui/badge';
// Import de la fonction cn pour fusionner les classes CSS
import { cn } from '@/lib/utils';
// Import du type ExchangeStatus pour la sécurité des types
import { ExchangeStatus } from '@/types';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface StatusBadgeProps {
  status: ExchangeStatus; // Le statut de l'échange à afficher
  className?: string; // Classes CSS optionnelles pour personnaliser le style
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'; // Variante de couleur optionnelle (surcharge la variante par défaut)
}

/**
 * CONSTANTE: STATUS_LABELS
 *
 * Mapping des statuts vers leurs labels traduits en français.
 * Record<ExchangeStatus, string> garantit qu'on a un label pour chaque statut.
 */
const STATUS_LABELS: Record<ExchangeStatus, string> = {
  PENDING: 'En attente', // L'échange est en attente de réponse
  ACCEPTED: 'Accepté', // L'échange a été accepté
  DECLINED: 'Refusé', // L'échange a été refusé
  COMPLETED: 'Terminé', // L'échange est terminé avec succès
  CANCELLED: 'Annulé', // L'échange a été annulé
};

/**
 * CONSTANTE: STATUS_VARIANTS
 *
 * Mapping des statuts vers leurs variantes de couleur par défaut.
 * Chaque statut a une couleur associée pour une identification visuelle rapide:
 * - outline: bordure (pour les statuts neutres comme "en attente")
 * - default: couleur primaire (pour les statuts positifs comme "accepté")
 * - destructive: rouge (pour les statuts négatifs comme "refusé")
 * - secondary: gris (pour les statuts terminés/neutres)
 */
const STATUS_VARIANTS: Record<
  ExchangeStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'outline', // En attente: bordure (neutre)
  ACCEPTED: 'default', // Accepté: couleur primaire (positif)
  DECLINED: 'destructive', // Refusé: rouge (négatif)
  COMPLETED: 'secondary', // Terminé: gris (neutre/positif)
  CANCELLED: 'secondary', // Annulé: gris (neutre)
};

/**
 * COMPOSANT PRINCIPAL: StatusBadge
 *
 * Affiche un badge coloré avec le statut de l'échange.
 *
 * @param status - Le statut de l'échange à afficher
 * @param className - Classes CSS optionnelles pour personnaliser le style
 * @param variant - Variante de couleur optionnelle (surcharge la variante par défaut)
 */
export function StatusBadge({ status, className, variant }: StatusBadgeProps) {
  /**
   * Déterminer quelle variante de style appliquer:
   * - Si la prop `variant` est passée, on l'utilise (permet de surcharger le style)
   * - Sinon on retombe sur la variante par défaut définie par le statut
   */
  const resolvedVariant = variant ?? STATUS_VARIANTS[status];

  /**
   * Fusionner les classes personnalisées avec celles du composant Badge.
   * cn() gère les doublons et permet de composer des classes conditionnelles.
   */
  const mergedClassName = cn(className);

  return (
    <>
      {/* Badge coloré affichant le statut de l'échange */}
      <Badge variant={resolvedVariant} className={mergedClassName}>
        {/*
          Afficher le label traduit du statut
          STATUS_LABELS[status] récupère le libellé français correspondant
        */}
        {STATUS_LABELS[status]}
      </Badge>
    </>
  );
}

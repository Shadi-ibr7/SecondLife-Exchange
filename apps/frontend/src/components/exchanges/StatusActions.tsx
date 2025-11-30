/**
 * FICHIER: components/exchanges/StatusActions.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche les actions disponibles pour modifier le statut d'un échange.
 * Il gère les permissions selon le rôle de l'utilisateur (requester ou responder)
 * et le statut actuel de l'échange. Il affiche des boutons d'action ou des badges
 * selon l'état de l'échange.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage conditionnel des boutons selon le rôle et le statut
 * - Mise à jour du statut via l'API
 * - Gestion des permissions (qui peut faire quoi)
 * - Affichage de badges pour les statuts terminaux (COMPLETED, DECLINED, CANCELLED)
 * - Feedback visuel avec notifications toast
 * - État de chargement pendant la mise à jour
 *
 * RÈGLES DE PERMISSIONS:
 * - Accepter: seulement le responder quand le statut est PENDING
 * - Refuser: seulement le responder quand le statut est PENDING
 * - Marquer comme terminé: requester ou responder quand le statut est ACCEPTED
 * - Annuler: requester ou responder quand le statut est PENDING ou ACCEPTED
 *
 * UX:
 * - Boutons désactivés pendant la mise à jour pour éviter les doubles clics
 * - Messages de succès/erreur clairs
 * - Badges informatifs pour les statuts terminaux
 */

// Import de React pour la gestion de l'état
import { useState } from 'react';
// Import des composants UI réutilisables
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import des types TypeScript pour garantir la sécurité des types
import { Exchange, ExchangeStatus } from '@/types';
// Import de l'API exchanges pour mettre à jour le statut
import { exchangesApi } from '@/lib/exchanges.api';
// Import de react-hot-toast pour afficher des notifications
import { toast } from 'react-hot-toast';
// Import des icônes Lucide React
import { Check, X, CheckCircle, XCircle } from 'lucide-react';
// Import du store d'authentification pour récupérer l'utilisateur connecté
import { useAuthStore } from '@/store/auth';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface StatusActionsProps {
  exchange: Exchange; // L'échange pour lequel afficher les actions
  onStatusUpdate: (updatedExchange: Exchange) => void; // Callback appelé après la mise à jour du statut
}

/**
 * COMPOSANT PRINCIPAL: StatusActions
 *
 * Ce composant affiche les actions disponibles pour modifier le statut d'un échange.
 *
 * @param exchange - L'échange pour lequel afficher les actions
 * @param onStatusUpdate - Callback appelé après la mise à jour du statut
 */
export function StatusActions({
  exchange,
  onStatusUpdate,
}: StatusActionsProps) {
  // ============================================
  // GESTION DE L'ÉTAT
  // ============================================

  /**
   * État pour indiquer si une mise à jour est en cours
   * Utilisé pour désactiver les boutons pendant la requête API
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Récupération de l'utilisateur connecté depuis le store Zustand
   * user peut être null si l'utilisateur n'est pas connecté
   */
  const { user } = useAuthStore();

  // ============================================
  // DÉTERMINATION DU RÔLE DE L'UTILISATEUR
  // ============================================

  /**
   * Vérifier si l'utilisateur connecté est le demandeur (requester)
   * Le requester est celui qui a proposé l'échange
   */
  const isRequester = exchange.requesterId === user?.id;

  /**
   * Vérifier si l'utilisateur connecté est le répondant (responder)
   * Le responder est celui qui a reçu la proposition d'échange
   */
  const isResponder = exchange.responderId === user?.id;

  // ============================================
  // GESTION DE LA MISE À JOUR DU STATUT
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur clique sur un bouton d'action
   * Elle met à jour le statut de l'échange via l'API et notifie le parent
   *
   * @param newStatus - Le nouveau statut à appliquer à l'échange
   */
  const handleStatusUpdate = async (newStatus: ExchangeStatus) => {
    /**
     * Activer l'état de chargement pour désactiver les boutons
     * et afficher un feedback visuel
     */
    setIsLoading(true);

    try {
      /**
       * Appeler l'API pour mettre à jour le statut de l'échange
       * exchangesApi.updateExchangeStatus() fait un appel HTTP PATCH /exchanges/:id/status
       */
      const updatedExchange = await exchangesApi.updateExchangeStatus(
        exchange.id,
        {
          status: newStatus, // Le nouveau statut à appliquer
        }
      );

      /**
       * Notifier le parent que le statut a été mis à jour
       * Le parent peut alors mettre à jour son état local
       */
      onStatusUpdate(updatedExchange);

      /**
       * Afficher un message de succès à l'utilisateur
       * newStatus.toLowerCase() convertit le statut en minuscules pour l'affichage
       * (ex: "ACCEPTED" devient "accepté")
       */
      toast.success(`Échange ${newStatus.toLowerCase()}`);
    } catch (error) {
      /**
       * En cas d'erreur (ex: serveur indisponible, erreur réseau, etc.)
       * Afficher un message d'erreur à l'utilisateur
       */
      toast.error('Erreur lors de la mise à jour');
    } finally {
      /**
       * Toujours désactiver l'état de chargement, même en cas d'erreur
       * Cela permet de réactiver les boutons
       */
      setIsLoading(false);
    }
  };

  // ============================================
  // CALCUL DES PERMISSIONS D'ACTION
  // ============================================

  /**
   * RÈGLES D'AFFICHAGE DES BOUTONS SELON LE STATUT ET LE RÔLE
   *
   * Ces variables booléennes déterminent quels boutons doivent être affichés
   * selon le rôle de l'utilisateur et le statut actuel de l'échange
   */

  /**
   * L'utilisateur peut accepter l'échange si:
   * - Il est le responder (celui qui a reçu la proposition)
   * - ET le statut est PENDING (en attente)
   */
  const canAccept = isResponder && exchange.status === 'PENDING';

  /**
   * L'utilisateur peut refuser l'échange si:
   * - Il est le responder (celui qui a reçu la proposition)
   * - ET le statut est PENDING (en attente)
   */
  const canDecline = isResponder && exchange.status === 'PENDING';

  /**
   * L'utilisateur peut marquer l'échange comme terminé si:
   * - Il est le requester OU le responder (n'importe lequel des deux)
   * - ET le statut est ACCEPTED (accepté)
   */
  const canComplete =
    (isRequester || isResponder) && exchange.status === 'ACCEPTED';

  /**
   * L'utilisateur peut annuler l'échange si:
   * - Il est le requester OU le responder (n'importe lequel des deux)
   * - ET le statut est PENDING (en attente) OU ACCEPTED (accepté)
   */
  const canCancel =
    (isRequester || isResponder) &&
    ['PENDING', 'ACCEPTED'].includes(exchange.status);

  // ============================================
  // AFFICHAGE DES STATUTS TERMINAUX (BADGES)
  // ============================================

  /**
   * Si l'échange est terminé (COMPLETED), afficher un badge avec la date de complétion
   * Les statuts terminaux n'ont pas de boutons d'action car ils sont définitifs
   */
  if (exchange.status === 'COMPLETED') {
    return (
      <div className="flex items-center gap-2">
        {/*
          Badge indiquant que l'échange est terminé
          variant="secondary": style secondaire (gris)
          flex items-center gap-1: aligner l'icône et le texte horizontalement
        */}
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Terminé
        </Badge>
        {/*
          Afficher la date de complétion si elle existe
          toLocaleDateString('fr-FR'): formater la date en français
          (ex: "20/01/2024")
        */}
        {exchange.completedAt && (
          <span className="text-sm text-muted-foreground">
            le {new Date(exchange.completedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    );
  }

  /**
   * Si l'échange est refusé (DECLINED), afficher un badge rouge
   * Un échange refusé ne peut plus être modifié
   */
  if (exchange.status === ('DECLINED' as const)) {
    return (
      <div className="flex items-center gap-2">
        {/*
          Badge indiquant que l'échange est refusé
          variant="destructive": style destructif (rouge)
          flex items-center gap-1: aligner l'icône et le texte horizontalement
        */}
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Refusé
        </Badge>
      </div>
    );
  }

  /**
   * Si l'échange est annulé (CANCELLED), afficher un badge gris
   * Un échange annulé ne peut plus être modifié
   */
  if (exchange.status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2">
        {/*
          Badge indiquant que l'échange est annulé
          variant="secondary": style secondaire (gris)
          flex items-center gap-1: aligner l'icône et le texte horizontalement
        */}
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Annulé
        </Badge>
      </div>
    );
  }

  // ============================================
  // RENDU DES BOUTONS D'ACTION
  // ============================================

  /**
   * Si l'échange n'est pas dans un statut terminal, afficher les boutons d'action
   * selon les permissions calculées précédemment
   */
  return (
    <>
      {/*
        Conteneur flex avec wrap pour permettre le retour à la ligne
        flex-wrap: permet aux boutons de passer à la ligne si nécessaire
        gap-2: espacement de 8px entre les boutons
      */}
      <div className="flex flex-wrap gap-2">
        {/* ============================================
          BOUTON ACCEPTER
          ============================================ */}
        {/*
        Afficher le bouton "Accepter" seulement si l'utilisateur peut accepter
        (canAccept = true)
      */}
        {canAccept && (
          <Button
            onClick={() => handleStatusUpdate('ACCEPTED')} // Mettre à jour le statut à ACCEPTED
            disabled={isLoading} // Désactiver pendant la mise à jour
            className="flex items-center gap-2" // Aligner l'icône et le texte
          >
            <Check className="h-4 w-4" />
            Accepter
          </Button>
        )}

        {/* ============================================
          BOUTON REFUSER
          ============================================ */}
        {/*
        Afficher le bouton "Refuser" seulement si l'utilisateur peut refuser
        (canDecline = true)
      */}
        {canDecline && (
          <Button
            onClick={() => handleStatusUpdate('DECLINED')} // Mettre à jour le statut à DECLINED
            disabled={isLoading} // Désactiver pendant la mise à jour
            variant="destructive" // Style destructif (rouge) pour indiquer une action négative
            className="flex items-center gap-2" // Aligner l'icône et le texte
          >
            <X className="h-4 w-4" />
            Refuser
          </Button>
        )}

        {/* ============================================
          BOUTON MARQUER COMME TERMINÉ
          ============================================ */}
        {/*
        Afficher le bouton "Marquer comme terminé" seulement si l'utilisateur peut compléter
        (canComplete = true)
      */}
        {canComplete && (
          <Button
            onClick={() => handleStatusUpdate('COMPLETED')} // Mettre à jour le statut à COMPLETED
            disabled={isLoading} // Désactiver pendant la mise à jour
            variant="default" // Style par défaut (couleur primaire)
            className="flex items-center gap-2" // Aligner l'icône et le texte
          >
            <CheckCircle className="h-4 w-4" />
            Marquer comme terminé
          </Button>
        )}

        {/* ============================================
          BOUTON ANNULER
          ============================================ */}
        {/*
        Afficher le bouton "Annuler" seulement si l'utilisateur peut annuler
        (canCancel = true)
      */}
        {canCancel && (
          <Button
            onClick={() => handleStatusUpdate('CANCELLED')} // Mettre à jour le statut à CANCELLED
            disabled={isLoading} // Désactiver pendant la mise à jour
            variant="outline" // Style avec bordure (moins important que les autres actions)
            className="flex items-center gap-2" // Aligner l'icône et le texte
          >
            <X className="h-4 w-4" />
            Annuler
          </Button>
        )}
      </div>
    </>
  );
}

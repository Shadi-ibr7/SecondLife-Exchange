/**
 * FICHIER: ExchangeCard.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une carte d'échange dans une liste d'échanges.
 * Il présente les informations essentielles : l'autre utilisateur, les items échangés,
 * le statut, et un lien vers la page de détail.
 *
 * FONCTIONNALITÉS:
 * - Affichage de l'avatar et du nom de l'autre utilisateur
 * - Affichage des items proposés et demandés
 * - Badge de statut avec couleurs adaptées
 * - Message optionnel de l'échange
 * - Lien vers la page de détail de l'échange
 * - Animation d'apparition
 * - Formatage du temps relatif
 */

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import de Next.js pour la navigation
import Link from 'next/link';

// Import des icônes
import {
  ArrowRight,
  Calendar,
  Clock,
  Package,
  User,
  ArrowUpRight,
} from 'lucide-react';

// Import de date-fns pour le formatage des dates
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des composants UI
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Import des types
import { Exchange } from '@/types';

// Import du composant StatusBadge
import { StatusBadge } from './StatusBadge';

/**
 * INTERFACE: ExchangeCardProps
 *
 * Définit les propriétés acceptées par le composant.
 */
interface ExchangeCardProps {
  exchange: Exchange; // L'échange à afficher
  currentUserId: string; // ID de l'utilisateur connecté (pour déterminer le rôle)
}

/**
 * COMPOSANT: ExchangeCard
 *
 * Affiche une carte d'échange avec toutes ses informations essentielles.
 *
 * @param exchange - L'échange à afficher
 * @param currentUserId - ID de l'utilisateur connecté
 */
export function ExchangeCard({ exchange, currentUserId }: ExchangeCardProps) {
  // ============================================
  // DÉTERMINATION DU RÔLE ET DE L'AUTRE UTILISATEUR
  // ============================================

  /**
   * Détermine si l'utilisateur connecté est le demandeur (requester)
   * ou le répondant (responder) de l'échange.
   */
  const isRequester = exchange.requesterId === currentUserId;

  /**
   * Récupère l'autre utilisateur (celui avec qui on échange).
   */
  const otherUser = isRequester ? exchange.responder : exchange.requester;

  // ============================================
  // FONCTION: formatRelativeTime
  // ============================================

  /**
   * Formate une date en temps relatif en français (ex: "il y a 2 jours").
   *
   * @param date - Date à formater (string ISO)
   * @returns Temps relatif formaté en français
   */
  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true, // Ajouter "il y a" ou "dans"
      locale: fr, // Utiliser la locale française
    });
  };

  // ============================================
  // FONCTION: getStatusTone
  // ============================================

  /**
   * Retourne les classes CSS pour le style du badge de statut
   * selon le statut de l'échange.
   *
   * @param status - Statut de l'échange
   * @returns Classes CSS pour le style du badge
   */
  const getStatusTone = (status: Exchange['status']) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'ACCEPTED':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'DECLINED':
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      case 'COMPLETED':
        return 'border-green-500/30 bg-green-500/10 text-green-400';
      case 'CANCELLED':
        return 'border-muted-foreground/30 bg-muted/40 text-muted-foreground';
      default:
        return 'border-muted-foreground/30 bg-muted/40 text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
        <CardContent className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-border/40">
              <AvatarImage
                src={otherUser.avatarUrl || ''}
                alt={otherUser.displayName}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherUser.displayName?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-foreground">
                  {otherUser.displayName}
                </p>
                <StatusBadge
                  status={exchange.status}
                  variant="outline"
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusTone(exchange.status)}`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Créé {formatRelativeTime(exchange.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {isRequester
                    ? 'Vous proposez un échange'
                    : 'Proposition reçue'}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="grid gap-4 rounded-2xl border border-border/40 bg-background/50 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                {isRequester
                  ? 'Vous proposez'
                  : `${otherUser.displayName} propose`}
              </div>
              <p className="text-sm font-medium text-foreground">
                {isRequester
                  ? exchange.offeredItemTitle
                  : exchange.requestedItemTitle}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
                {isRequester ? 'Vous recevez' : 'Vous offrez'}
              </div>
              <p className="text-sm font-medium text-foreground">
                {isRequester
                  ? exchange.requestedItemTitle
                  : exchange.offeredItemTitle}
              </p>
            </div>
          </div>

          {exchange.message && (
            <div className="rounded-2xl border border-border/40 bg-background/60 p-4 text-sm text-muted-foreground">
              « {exchange.message} »
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {exchange.completedAt ? (
                <span>
                  Terminé le{' '}
                  {new Date(exchange.completedAt).toLocaleDateString('fr-FR')}
                </span>
              ) : (
                <span>Statut actuel : {exchange.status}</span>
              )}
            </div>

            <Button
              asChild
              className="group flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Link href={`/exchange/${exchange.id}`}>
                Voir l'échange
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * FICHIER: components/exchanges/ExchangeCard.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une carte d'échange dans une liste d'échanges.
 * Il présente les informations essentielles : l'autre utilisateur, les items échangés,
 * le statut, et un lien vers la page de détail. Il adapte l'affichage selon le rôle
 * de l'utilisateur connecté (requester ou responder).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage de l'avatar et du nom de l'autre utilisateur
 * - Affichage des items proposés et demandés (adapté selon le rôle)
 * - Badge de statut avec couleurs adaptées selon le statut
 * - Message optionnel de l'échange (citation stylisée)
 * - Lien vers la page de détail de l'échange
 * - Animation d'apparition fluide
 * - Formatage du temps relatif en français
 * - Affichage de la date de complétion si l'échange est terminé
 *
 * UX:
 * - Effet hover avec translation et ombre pour indiquer l'interactivité
 * - Animation fluide d'apparition
 * - Design moderne avec backdrop blur et transparence
 * - Couleurs adaptées selon le statut pour une identification visuelle rapide
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
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ExchangeCardProps {
  exchange: Exchange; // L'échange à afficher (avec toutes ses propriétés)
  currentUserId: string; // ID de l'utilisateur connecté (pour déterminer le rôle: requester ou responder)
}

/**
 * COMPOSANT PRINCIPAL: ExchangeCard
 *
 * Ce composant affiche une carte d'échange avec toutes ses informations essentielles.
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
   *
   * Le requester est celui qui a proposé l'échange.
   * Le responder est celui qui a reçu la proposition.
   */
  const isRequester = exchange.requesterId === currentUserId;

  /**
   * Récupère l'autre utilisateur (celui avec qui on échange).
   * Si on est le requester, l'autre utilisateur est le responder.
   * Si on est le responder, l'autre utilisateur est le requester.
   */
  const otherUser = isRequester ? exchange.responder : exchange.requester;

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
  // FONCTION: getStatusTone
  // ============================================

  /**
   * Retourne les classes CSS pour le style du badge de statut
   * selon le statut de l'échange.
   *
   * Chaque statut a une couleur associée pour une identification visuelle rapide:
   * - PENDING: jaune (en attente)
   * - ACCEPTED: bleu (accepté)
   * - DECLINED: rouge (refusé)
   * - COMPLETED: vert (terminé)
   * - CANCELLED: gris (annulé)
   *
   * @param status - Statut de l'échange (PENDING, ACCEPTED, DECLINED, COMPLETED, CANCELLED)
   * @returns Classes CSS Tailwind pour le style du badge
   */
  const getStatusTone = (status: Exchange['status']) => {
    switch (status) {
      case 'PENDING':
        // Jaune pour indiquer qu'on attend une action
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'ACCEPTED':
        // Bleu pour indiquer que l'échange est accepté
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'DECLINED':
        // Rouge pour indiquer que l'échange est refusé
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      case 'COMPLETED':
        // Vert pour indiquer que l'échange est terminé avec succès
        return 'border-green-500/30 bg-green-500/10 text-green-400';
      case 'CANCELLED':
        // Gris pour indiquer que l'échange est annulé
        return 'border-muted-foreground/30 bg-muted/40 text-muted-foreground';
      default:
        // Par défaut, style gris neutre
        return 'border-muted-foreground/30 bg-muted/40 text-muted-foreground';
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
        transition: durée de l'animation (0.3 secondes)
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // État initial: invisible et 20px en bas
        animate={{ opacity: 1, y: 0 }} // État final: visible et à sa position normale
        transition={{ duration: 0.3 }} // Durée de l'animation
      >
        {/*
        Carte avec effet hover moderne
        h-full: hauteur complète pour que toutes les cartes aient la même hauteur
        overflow-hidden: masquer le contenu qui dépasse
        border-border/60: bordure avec 60% d'opacité
        bg-card/60: fond avec 60% d'opacité
        backdrop-blur-sm: flou d'arrière-plan léger pour un effet glassmorphism
        transition-all duration-300: transition fluide de 300ms pour toutes les propriétés
        hover:-translate-y-1: translation vers le haut au survol (effet de levée)
        hover:border-primary/40: bordure primaire au survol
        hover:shadow-xl: ombre prononcée au survol
      */}
        <Card className="h-full overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
          <CardContent className="space-y-6 p-6">
            {/* ============================================
              EN-TÊTE (AVATAR, NOM, STATUT)
              ============================================ */}
            <div className="flex items-start gap-4">
              {/*
              Avatar de l'autre utilisateur
              h-12 w-12: taille de 48px x 48px
              border border-border/40: bordure avec 40% d'opacité
            */}
              <Avatar className="h-12 w-12 border border-border/40">
                {/*
                Image de l'avatar si disponible
                src: URL de l'avatar ou chaîne vide
                alt: texte alternatif pour l'accessibilité
              */}
                <AvatarImage
                  src={otherUser.avatarUrl || ''}
                  alt={otherUser.displayName}
                />
                {/*
                Fallback si aucune image d'avatar
                bg-primary/10: fond avec 10% d'opacité de la couleur primaire
                text-primary: couleur primaire pour le texte
                Affiche la première lettre du nom en majuscule, ou "?" si aucun nom
              */}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherUser.displayName?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              {/*
              Informations de l'utilisateur et du statut
              flex-1: prend tout l'espace disponible
              space-y-2: espacement vertical de 8px entre les éléments
            */}
              <div className="flex-1 space-y-2">
                {/*
                Nom et badge de statut
                flex flex-wrap: affichage en ligne avec retour à la ligne si nécessaire
                items-center gap-2: aligner verticalement avec espacement
              */}
                <div className="flex flex-wrap items-center gap-2">
                  {/*
                  Nom de l'autre utilisateur
                  text-lg: texte large
                  font-semibold: police semi-grasse
                */}
                  <p className="text-lg font-semibold text-foreground">
                    {otherUser.displayName}
                  </p>
                  {/*
                  Badge de statut avec style personnalisé
                  status: statut de l'échange
                  variant="outline": style avec bordure
                  className: classes personnalisées avec getStatusTone() pour les couleurs
                */}
                  <StatusBadge
                    status={exchange.status}
                    variant="outline"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusTone(exchange.status)}`}
                  />
                </div>

                {/*
                Informations supplémentaires (date de création et rôle)
                flex flex-wrap: affichage en ligne avec retour à la ligne si nécessaire
                items-center gap-4: aligner verticalement avec espacement
                text-xs: texte très petit
                text-muted-foreground: couleur atténuée
              */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {/*
                  Date de création avec icône horloge
                  inline-flex: affichage inline-flex pour aligner l'icône et le texte
                */}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Créé {formatRelativeTime(exchange.createdAt)}
                  </span>
                  {/*
                  Rôle de l'utilisateur (requester ou responder)
                  Adapte le texte selon le rôle
                */}
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {isRequester
                      ? 'Vous proposez un échange' // Si on est le requester
                      : 'Proposition reçue'}{' '}
                    {/* Si on est le responder */}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================
              ITEMS ÉCHANGÉS
              ============================================ */}
            {/*
            Grille pour afficher les items proposés et demandés
            grid gap-4: grille avec espacement de 16px
            rounded-2xl: coins très arrondis (16px)
            border border-border/40: bordure avec 40% d'opacité
            bg-background/50: fond avec 50% d'opacité
            p-4: padding de 16px
            sm:grid-cols-2: 2 colonnes sur tablette et desktop (≥640px)
          */}
            <div className="grid gap-4 rounded-2xl border border-border/40 bg-background/50 p-4 sm:grid-cols-2">
              {/*
              Item proposé (celui qu'on donne)
              space-y-2: espacement vertical de 8px entre les éléments
            */}
              <div className="space-y-2">
                {/*
                Label "Vous proposez" ou "X propose"
                Adapte le texte selon le rôle
                text-xs uppercase tracking-wide: texte très petit, majuscules, espacement large
              */}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  {isRequester
                    ? 'Vous proposez' // Si on est le requester
                    : `${otherUser.displayName} propose`}{' '}
                  {/* Si on est le responder */}
                </div>
                {/*
                Titre de l'item proposé
                Adapte selon le rôle: si requester, on montre offeredItemTitle, sinon requestedItemTitle
                text-sm font-medium: texte petit, police moyenne
              */}
                <p className="text-sm font-medium text-foreground">
                  {isRequester
                    ? exchange.offeredItemTitle // Item qu'on propose si on est requester
                    : exchange.requestedItemTitle}{' '}
                  {/* Item qu'on reçoit si on est responder */}
                </p>
              </div>
              {/*
              Item demandé (celui qu'on reçoit)
              space-y-2: espacement vertical de 8px entre les éléments
            */}
              <div className="space-y-2">
                {/*
                Label "Vous recevez" ou "Vous offrez"
                Adapte le texte selon le rôle
              */}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {isRequester ? 'Vous recevez' : 'Vous offrez'}
                </div>
                {/*
                Titre de l'item demandé
                Adapte selon le rôle: si requester, on montre requestedItemTitle, sinon offeredItemTitle
              */}
                <p className="text-sm font-medium text-foreground">
                  {isRequester
                    ? exchange.requestedItemTitle // Item qu'on reçoit si on est requester
                    : exchange.offeredItemTitle}{' '}
                  {/* Item qu'on propose si on est responder */}
                </p>
              </div>
            </div>

            {/* ============================================
              MESSAGE OPTIONNEL
              ============================================ */}
            {/*
            Afficher le message seulement s'il existe
            rounded-2xl: coins très arrondis
            border border-border/40: bordure avec 40% d'opacité
            bg-background/60: fond avec 60% d'opacité
            p-4: padding de 16px
            text-sm: texte petit
            text-muted-foreground: couleur atténuée
            Guillemets français pour styliser le message comme une citation
          */}
            {exchange.message && (
              <div className="rounded-2xl border border-border/40 bg-background/60 p-4 text-sm text-muted-foreground">
                « {exchange.message} »
              </div>
            )}

            {/* ============================================
              PIED DE PAGE (DATE, BOUTON)
              ============================================ */}
            {/*
            Footer avec date et bouton
            flex flex-col: colonne sur mobile
            sm:flex-row: ligne sur tablette et desktop (≥640px)
            sm:items-center sm:justify-between: aligner horizontalement avec espacement
            gap-3: espacement de 12px entre les éléments
          */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/*
              Date de complétion ou statut actuel
              flex items-center gap-2: aligner horizontalement avec espacement
              text-xs: texte très petit
              text-muted-foreground: couleur atténuée
            */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {/*
                Afficher la date de complétion si l'échange est terminé,
                sinon afficher le statut actuel
              */}
                {exchange.completedAt ? (
                  <span>
                    Terminé le{' '}
                    {/*
                    Formater la date en français (ex: "20/01/2024")
                    toLocaleDateString('fr-FR'): format français
                  */}
                    {new Date(exchange.completedAt).toLocaleDateString('fr-FR')}
                  </span>
                ) : (
                  <span>Statut actuel : {exchange.status}</span>
                )}
              </div>

              {/*
              Bouton pour voir les détails de l'échange
              asChild: permet de rendre le bouton comme un Link
              group: permet d'animer l'icône au survol du bouton
              flex w-full: largeur complète sur mobile
              sm:w-auto: largeur automatique sur tablette et desktop
            */}
              <Button
                asChild
                className="group flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <Link href={`/exchange/${exchange.id}`}>
                  Voir l'échange
                  {/*
                  Icône avec animation au survol
                  group-hover: animation déclenchée au survol du parent (bouton)
                  -translate-y-0.5 translate-x-0.5: translation diagonale (haut-droite)
                  transition-transform: transition fluide pour la transformation
                */}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

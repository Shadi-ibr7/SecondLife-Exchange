/**
 * FICHIER: TypingIndicator.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche un indicateur visuel quand quelqu'un est en train d'écrire un message.
 * Il montre trois petits points animés qui rebondissent, comme dans les applications de messagerie
 * modernes (WhatsApp, Messenger, etc.).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affiche l'avatar de l'utilisateur qui est en train d'écrire
 * - Affiche le nom de l'utilisateur
 * - Affiche trois points animés qui rebondissent de manière séquentielle
 * - Animation d'apparition/disparition fluide
 */

// Import de Framer Motion pour les animations fluides
import { motion } from 'framer-motion';

// Import des composants UI réutilisables
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface TypingIndicatorProps {
  user: {
    id: string; // L'identifiant unique de l'utilisateur
    displayName: string; // Le nom d'affichage de l'utilisateur
    avatarUrl?: string; // L'URL de la photo de profil (optionnelle)
  };
}

/**
 * COMPOSANT PRINCIPAL: TypingIndicator
 *
 * Ce composant affiche un indicateur "en train d'écrire" avec une animation
 */
export function TypingIndicator({ user }: TypingIndicatorProps) {
  /**
   * motion.div ajoute une animation d'apparition/disparition
   * initial: état initial (invisible et légèrement en bas)
   * animate: état visible (opacité 1 et position normale)
   * exit: état de sortie (invisible et légèrement en haut)
   * className: styles CSS pour la mise en page
   */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      {/* ============================================
          AVATAR (PHOTO DE PROFIL)
          ============================================ */}
      {/*
        Avatar de l'utilisateur qui est en train d'écrire
        h-8 w-8: taille de 32px x 32px (plus petit que dans les messages)
        flex-shrink-0: empêche l'avatar de rétrécir
      */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        {/*
          AvatarFallback: affiche la première lettre du nom si pas de photo
          charAt(0): prend la première lettre
          toUpperCase(): la met en majuscule
        */}
        <AvatarFallback>
          {user.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* ============================================
          CONTENEUR PRINCIPAL
          ============================================ */}
      <div className="flex flex-col">
        {/* Nom de l'utilisateur */}
        <p className="mb-1 px-2 text-xs text-muted-foreground">
          {user.displayName}
        </p>

        {/* ============================================
            BULLE AVEC LES POINTS ANIMÉS
            ============================================ */}
        {/*
          Bulle de style similaire aux messages, mais avec les points animés
          rounded-2xl: coins arrondis
          bg-muted: fond gris clair
          px-4 py-2: padding horizontal et vertical
        */}
        <div className="rounded-2xl bg-muted px-4 py-2">
          {/* Conteneur pour les trois points */}
          <div className="flex gap-1">
            {/*
              Premier point animé
              animate={{ scale: [1, 1.2, 1] }}: animation qui fait rebondir le point
              - scale: 1 = taille normale
              - scale: 1.2 = 20% plus grand
              - scale: 1 = retour à la taille normale
              transition: configuration de l'animation
              - duration: 0.6 secondes pour un cycle complet
              - repeat: Infinity = répéter indéfiniment
              - delay: 0 = pas de délai (commence immédiatement)
            */}
            <motion.div
              className="h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />

            {/*
              Deuxième point animé
              delay: 0.2 = commence 0.2 secondes après le premier
              Cela crée un effet de vague où les points rebondissent l'un après l'autre
            */}
            <motion.div
              className="h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />

            {/*
              Troisième point animé
              delay: 0.4 = commence 0.4 secondes après le premier
              Cela complète l'effet de vague
            */}
            <motion.div
              className="h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

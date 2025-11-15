/**
 * FICHIER: MessageBubble.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche un seul message de chat dans une bulle de conversation.
 * Il gère l'affichage du texte, des images, de l'avatar de l'expéditeur, et de l'heure.
 * Il permet aussi d'ouvrir les images en grand dans une lightbox (fenêtre popup).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affiche le message avec un style différent selon si c'est notre message ou celui de l'autre
 * - Affiche les images jointes au message
 * - Permet de cliquer sur une image pour l'ouvrir en grand avec zoom
 * - Affiche l'avatar et le nom de l'expéditeur
 * - Affiche l'heure du message
 * - Animation d'apparition du message
 */

// Import de Framer Motion pour les animations fluides
import { motion } from 'framer-motion';

// Import des types TypeScript pour garantir la sécurité des types
import { ChatMessage, User } from '@/types';

// Import de date-fns pour formater les dates en français
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des composants UI réutilisables
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Import du store d'authentification pour savoir qui est l'utilisateur connecté
import { useAuthStore } from '@/store/auth';

// Import de Next.js Image pour optimiser le chargement des images
import Image from 'next/image';

// Import de useState pour gérer l'état local (ouverture de la lightbox)
import { useState } from 'react';

// Import du composant ImageLightbox pour afficher les images en grand
import { ImageLightbox } from './ImageLightbox';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface MessageBubbleProps {
  message: ChatMessage; // Le message à afficher (texte, images, expéditeur, date, etc.)
  sender: User; // Les informations de l'expéditeur du message
  isOwn: boolean; // true si c'est notre propre message, false si c'est celui de l'autre
  isOptimistic?: boolean; // true si c'est un message optimiste (pas encore confirmé par le serveur)
}

/**
 * COMPOSANT PRINCIPAL: MessageBubble
 *
 * Ce composant affiche une bulle de message dans la conversation
 */
export function MessageBubble({
  message,
  sender,
  isOwn,
  isOptimistic = false,
}: MessageBubbleProps) {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  // Récupération de l'utilisateur connecté depuis le store
  const { user } = useAuthStore();

  // État pour savoir si la lightbox (fenêtre popup pour les images) est ouverte
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // État pour savoir quelle image est actuellement affichée dans la lightbox
  // (si le message contient plusieurs images)
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ============================================
  // FONCTION POUR FORMATER L'HEURE
  // ============================================

  /**
   * Convertit une date en format heure (ex: "14:30")
   * @param date - La date au format string ISO (ex: "2024-01-20T14:30:00.000Z")
   * @returns L'heure formatée en français (ex: "14:30")
   */
  const formatTime = (date: string) => {
    try {
      // format() de date-fns formate la date selon le pattern donné
      // 'HH:mm' signifie: heures sur 24h (HH) et minutes (mm)
      // { locale: fr } utilise la locale française
      return format(new Date(date), 'HH:mm', { locale: fr });
    } catch {
      // Si la date est invalide, retourner une chaîne vide
      return '';
    }
  };

  // ============================================
  // DÉTERMINATION DE L'EXPÉDITEUR À AFFICHER
  // ============================================

  /**
   * On détermine quel utilisateur afficher comme expéditeur:
   * - Si c'est notre message (isOwn = true), on affiche notre avatar
   * - Sinon, on affiche l'avatar de l'autre utilisateur
   */
  const displaySender = isOwn ? user : sender;

  // Récupération de l'URL de l'avatar (photo de profil)
  const avatarUrl = displaySender?.avatarUrl;

  // ============================================
  // GESTION DU CLIC SUR UNE IMAGE
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur clique sur une image
   * Elle ouvre la lightbox (fenêtre popup) pour afficher l'image en grand
   * @param index - L'index de l'image dans le tableau d'images du message
   */
  const handleImageClick = (index: number) => {
    setLightboxIndex(index); // Définir quelle image afficher
    setLightboxOpen(true); // Ouvrir la lightbox
  };

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  /**
   * motion.div ajoute une animation d'apparition au message
   * initial: état initial (invisible et légèrement en bas)
   * animate: état final (visible et à sa position normale)
   * transition: durée de l'animation (0.2 secondes)
   */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* ============================================
          AVATAR (PHOTO DE PROFIL)
          ============================================ */}
      {/*
        L'avatar s'affiche à droite si c'est notre message, à gauche sinon
        h-10 w-10: taille de 40px x 40px
        flex-shrink-0: empêche l'avatar de rétrécir
      */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        {/* Image de l'avatar si elle existe */}
        <AvatarImage src={avatarUrl} alt={displaySender?.displayName || ''} />
        {/*
          Fallback: si l'image n'existe pas, afficher la première lettre du nom
          en majuscule dans un cercle coloré
        */}
        <AvatarFallback>
          {displaySender?.displayName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      {/* ============================================
          CONTENEUR PRINCIPAL DU MESSAGE
          ============================================ */}
      <div
        className={`flex max-w-[70%] flex-col gap-1 ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* ============================================
            EN-TÊTE: Nom et heure
            ============================================ */}
        <div className="flex items-center gap-2">
          {/*
            Afficher le nom de l'expéditeur seulement si ce n'est pas notre message
            (on ne montre pas notre propre nom)
          */}
          {!isOwn && (
            <span className="text-sm text-muted-foreground">
              {sender.displayName}
            </span>
          )}
          {/* Afficher l'heure du message si elle existe */}
          {message.createdAt && (
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>

        {/* ============================================
            BULLE DE MESSAGE (TEXTE ET IMAGES)
            ============================================ */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'rounded-tr-sm bg-primary text-white' // Notre message: bleu à droite
              : 'rounded-tl-sm bg-muted text-foreground' // Message de l'autre: gris à gauche
          } ${isOptimistic ? 'opacity-70' : ''}`} // Réduire l'opacité si c'est un message optimiste
        >
          {/* ============================================
              AFFICHAGE DES IMAGES
              ============================================ */}
          {/*
            Vérifier si le message contient des images
            On utilise une fonction immédiatement invoquée (IIFE) pour créer une variable locale
            Cela permet à TypeScript de comprendre que images n'est jamais undefined dans le bloc
          */}
          {message.images &&
            message.images.length > 0 &&
            (() => {
              // Créer une variable locale pour éviter les erreurs TypeScript
              const images = message.images;
              return (
                <div
                  className={`mb-2 ${
                    // Adapter la mise en page selon le nombre d'images:
                    images.length === 1
                      ? 'w-full max-w-lg' // 1 image: pleine largeur
                      : images.length === 2
                        ? 'grid max-w-lg grid-cols-2 gap-2' // 2 images: grille 2 colonnes
                        : 'grid max-w-md grid-cols-2 gap-2' // 3+ images: grille 2 colonnes plus petite
                  }`}
                >
                  {/* Parcourir chaque image et l'afficher */}
                  {images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-90 ${
                        images.length === 1
                          ? 'aspect-video w-full' // 1 image: format vidéo (16:9)
                          : 'aspect-square' // Plusieurs images: format carré
                      }`}
                      onClick={() => handleImageClick(index)} // Ouvrir la lightbox au clic
                    >
                      {/*
                        Composant Image de Next.js pour optimiser le chargement
                        fill: l'image remplit son conteneur
                        object-cover: l'image couvre tout l'espace en gardant ses proportions
                        sizes: indique à Next.js quelle taille d'image charger selon la taille de l'écran
                      */}
                      <Image
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes={
                          images.length === 1
                            ? '(max-width: 768px) 100vw, 600px' // 1 image: grande sur mobile, 600px sur desktop
                            : '(max-width: 768px) 50vw, 300px' // Plusieurs images: 50% sur mobile, 300px sur desktop
                        }
                      />
                    </div>
                  ))}
                </div>
              );
            })()}

          {/* ============================================
              AFFICHAGE DU TEXTE
              ============================================ */}
          {/* Afficher le texte seulement s'il existe (un message peut être juste une image) */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {/*
                whitespace-pre-wrap: préserve les retours à la ligne et les espaces
                break-words: permet de couper les mots longs si nécessaire
                text-sm: taille de texte petite
                leading-relaxed: espacement entre les lignes confortable
              */}
              {message.content}
            </p>
          )}
        </div>
      </div>

      {/* ============================================
          LIGHTBOX POUR AFFICHER LES IMAGES EN GRAND
          ============================================ */}
      {/*
        Afficher la lightbox seulement si le message contient des images
        et si elle est ouverte (lightboxOpen = true)
      */}
      {message.images && message.images.length > 0 && (
        <ImageLightbox
          images={message.images} // Liste de toutes les images
          initialIndex={lightboxIndex} // Quelle image afficher en premier
          isOpen={lightboxOpen} // Est-ce que la lightbox est ouverte?
          onClose={() => setLightboxOpen(false)} // Fonction pour fermer la lightbox
        />
      )}
    </motion.div>
  );
}

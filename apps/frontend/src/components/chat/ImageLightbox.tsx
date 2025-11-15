/**
 * FICHIER: ImageLightbox.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une fenêtre popup (lightbox) pour voir les images en grand.
 * Il permet de zoomer, dézoomer, naviguer entre les images, et déplacer l'image zoomée.
 * Il fonctionne avec la souris, le clavier, et le tactile (mobile).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affiche une image en plein écran avec fond sombre
 * - Zoom/dézoom avec la molette de la souris, les boutons, ou le pincement (mobile)
 * - Navigation entre plusieurs images avec les flèches ou les boutons
 * - Déplacement de l'image zoomée en la faisant glisser
 * - Contrôles au clavier (flèches, +/-, Escape, 0)
 * - Support tactile complet pour mobile (pinch-to-zoom, drag)
 */

// Directive Next.js: indique que ce composant doit s'exécuter côté client (pas serveur)
'use client';

// Import des hooks React
// useState: pour gérer l'état local (zoom, position, index de l'image, etc.)
// useEffect: pour exécuter du code au montage/mise à jour (gestion du clavier)
import { useState, useEffect } from 'react';

// Import de Framer Motion pour les animations fluides
import { motion } from 'framer-motion';

// Import des composants UI réutilisables
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Import des icônes depuis lucide-react
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Import de Next.js Image pour optimiser le chargement des images
import Image from 'next/image';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ImageLightboxProps {
  images: string[]; // Liste des URLs des images à afficher
  initialIndex: number; // Index de l'image à afficher en premier (0 = première image)
  isOpen: boolean; // true si la lightbox est ouverte, false si elle est fermée
  onClose: () => void; // Fonction appelée pour fermer la lightbox
}

/**
 * COMPOSANT PRINCIPAL: ImageLightbox
 *
 * Ce composant crée une fenêtre popup pour afficher les images en grand avec zoom
 */
export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  // État pour savoir quelle image est actuellement affichée (0 = première, 1 = deuxième, etc.)
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // État pour le niveau de zoom (1 = taille normale, 2 = 200%, 5 = 500% maximum)
  const [scale, setScale] = useState(1);

  // État pour la position de l'image quand elle est zoomée et déplacée
  // { x: 0, y: 0 } = centré, valeurs négatives/positives = décalé
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // État pour savoir si l'utilisateur est en train de faire glisser l'image
  const [isDragging, setIsDragging] = useState(false);

  // État pour stocker la position de départ du glisser-déposer (pour calculer le déplacement)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // État pour le zoom tactile (pinch-to-zoom sur mobile)
  // null = pas de zoom tactile en cours
  // { x, y, distance } = position du centre et distance entre les deux doigts
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    distance: number;
  } | null>(null);

  // ============================================
  // EFFET POUR RÉINITIALISER QUAND LA LIGHTBOX S'OUVRE
  // ============================================

  /**
   * useEffect qui réinitialise l'état quand la lightbox s'ouvre ou change d'image
   * Cela garantit que chaque fois qu'on ouvre la lightbox, on repart à zéro:
   * - Image à l'index initial
   * - Zoom à 100% (taille normale)
   * - Position centrée
   */
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // ============================================
  // FONCTIONS DE CONTRÔLE DU ZOOM
  // ============================================

  /**
   * Fonction pour zoomer (agrandir l'image)
   * Augmente le zoom de 25% à chaque clic, jusqu'à un maximum de 500% (5x)
   */
  const handleZoomIn = () => {
    // prev est la valeur actuelle du zoom
    // Math.min() garantit qu'on ne dépasse pas 5 (500%)
    setScale((prev) => Math.min(prev + 0.25, 5));
  };

  /**
   * Fonction pour dézoomer (rétrécir l'image)
   * Réduit le zoom de 25% à chaque clic, jusqu'à un minimum de 100% (taille normale)
   * Si on revient à 100%, on recentre l'image
   */
  const handleZoomOut = () => {
    setScale((prev) => {
      // Math.max() garantit qu'on ne descend pas en dessous de 1 (100%)
      const newScale = Math.max(prev - 0.25, 1);
      // Si on revient à la taille normale, recentrer l'image
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  /**
   * Fonction pour réinitialiser le zoom à 100% et recentrer l'image
   */
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // ============================================
  // GESTION DU ZOOM AVEC LA MOULETTE DE LA SOURIS
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur utilise la molette de la souris
   * Permet de zoomer/dézoomer en faisant tourner la molette
   * Le zoom se fait vers le point où se trouve le curseur (comme dans Google Maps)
   *
   * @param e - L'événement de la molette de la souris
   */
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Empêcher le comportement par défaut (défilement de la page)
    e.preventDefault();

    // deltaY > 0 = scroll vers le bas (dézoomer)
    // deltaY < 0 = scroll vers le haut (zoomer)
    const delta = e.deltaY > 0 ? -0.15 : 0.15;

    // Calculer la position du curseur par rapport au centre de l'image
    // getBoundingClientRect() donne la position et la taille de l'élément
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    setScale((prev) => {
      // Calculer le nouveau niveau de zoom (entre 1 et 5)
      const newScale = Math.max(1, Math.min(5, prev + delta));

      // Si on revient à 100%, recentrer
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        // Ajuster la position pour zoomer vers le point de la souris
        // C'est un calcul mathématique complexe qui fait en sorte que
        // le point sous le curseur reste au même endroit pendant le zoom
        const scaleChange = newScale / prev;
        setPosition((pos) => ({
          x: x - (x - pos.x) * scaleChange,
          y: y - (y - pos.y) * scaleChange,
        }));
      }
      return newScale;
    });
  };

  // ============================================
  // GESTION DU GLISSER-DÉPOSER AVEC LA SOURIS
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur appuie sur le bouton de la souris
   * Démarre le glisser-déposer si l'image est zoomée
   *
   * @param e - L'événement de la souris
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // On ne peut déplacer que si l'image est zoomée (scale > 1)
    if (scale > 1) {
      setIsDragging(true);
      // Sauvegarder la position de départ pour calculer le déplacement
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  /**
   * Fonction appelée quand l'utilisateur déplace la souris
   * Déplace l'image si on est en train de la faire glisser
   *
   * @param e - L'événement de la souris
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    // Déplacer seulement si on est en train de glisser ET que l'image est zoomée
    if (isDragging && scale > 1) {
      // Calculer la nouvelle position en fonction de la position de la souris
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Limiter le déplacement pour que l'image ne sorte pas complètement de l'écran
      // maxOffset augmente avec le zoom pour permettre plus de mouvement quand on zoom plus
      const maxOffset = 200 * scale;
      setPosition({
        // Math.max et Math.min limitent les valeurs entre -maxOffset et +maxOffset
        x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
      });
    }
  };

  /**
   * Fonction appelée quand l'utilisateur relâche le bouton de la souris
   * Arrête le glisser-déposer
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ============================================
  // FONCTION UTILITAIRE POUR LE ZOOM TACTILE
  // ============================================

  /**
   * Calcule la distance entre deux points tactiles (pour le pinch-to-zoom)
   * Utilise le théorème de Pythagore: distance = √(dx² + dy²)
   *
   * @param touch1 - Premier point de contact
   * @param touch2 - Deuxième point de contact
   * @returns La distance en pixels entre les deux points
   */
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX; // Différence horizontale
    const dy = touch1.clientY - touch2.clientY; // Différence verticale
    return Math.sqrt(dx * dx + dy * dy); // Racine carrée de la somme des carrés
  };

  // ============================================
  // GESTION DU TOUCHER (MOBILE)
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur touche l'écran
   * Gère deux cas:
   * - 2 doigts: démarre le pinch-to-zoom (zoom avec pincement)
   * - 1 doigt: démarre le glisser-déposer (si l'image est zoomée)
   *
   * @param e - L'événement tactile
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    // Cas 1: Deux doigts = pinch-to-zoom
    if (e.touches.length === 2) {
      // Calculer la distance initiale entre les deux doigts
      const distance = getDistance(e.touches[0], e.touches[1]);

      // Calculer le centre entre les deux doigts (point de zoom)
      const rect = e.currentTarget.getBoundingClientRect();
      const x =
        (e.touches[0].clientX + e.touches[1].clientX) / 2 -
        rect.left -
        rect.width / 2;
      const y =
        (e.touches[0].clientY + e.touches[1].clientY) / 2 -
        rect.top -
        rect.height / 2;

      // Sauvegarder ces informations pour le calcul du zoom
      setTouchStart({ x, y, distance });
    }
    // Cas 2: Un doigt = glisser-déposer (seulement si zoomé)
    else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  /**
   * Fonction appelée quand l'utilisateur déplace ses doigts sur l'écran
   * Gère le zoom (pinch) et le déplacement (drag)
   *
   * @param e - L'événement tactile
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    // Empêcher le comportement par défaut (défilement de la page)
    e.preventDefault();

    // Cas 1: Deux doigts = zoom en cours
    if (e.touches.length === 2 && touchStart) {
      // Calculer la nouvelle distance entre les deux doigts
      const distance = getDistance(e.touches[0], e.touches[1]);

      // Calculer le changement de zoom en comparant avec la distance initiale
      const scaleChange = distance / touchStart.distance;
      const newScale = Math.max(1, Math.min(5, scale * scaleChange));

      // Si on revient à 100%, recentrer
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        // Ajuster la position pour zoomer vers le point entre les deux doigts
        const scaleDelta = newScale / scale;
        setPosition((pos) => ({
          x: touchStart.x - (touchStart.x - pos.x) * scaleDelta,
          y: touchStart.y - (touchStart.y - pos.y) * scaleDelta,
        }));
      }
      setScale(newScale);
    }
    // Cas 2: Un doigt = déplacement en cours
    else if (e.touches.length === 1 && isDragging && scale > 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      const maxOffset = 200 * scale;
      setPosition({
        x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
      });
    }
  };

  /**
   * Fonction appelée quand l'utilisateur retire ses doigts de l'écran
   * Arrête le zoom et le déplacement
   */
  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStart(null);
  };

  // ============================================
  // FONCTIONS DE NAVIGATION ENTRE LES IMAGES
  // ============================================

  /**
   * Fonction pour aller à l'image précédente
   * Si on est à la première image, on va à la dernière (boucle)
   * Réinitialise le zoom et la position
   */
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  /**
   * Fonction pour aller à l'image suivante
   * Si on est à la dernière image, on va à la première (boucle)
   * Réinitialise le zoom et la position
   */
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // ============================================
  // GESTION DES TOUCHES DU CLAVIER
  // ============================================

  /**
   * useEffect pour écouter les touches du clavier quand la lightbox est ouverte
   * Permet de contrôler la lightbox avec le clavier:
   * - Flèches gauche/droite: navigation
   * - Escape: fermer
   * - +/-: zoomer/dézoomer
   * - 0: réinitialiser le zoom
   */
  useEffect(() => {
    // Ne rien faire si la lightbox est fermée
    if (!isOpen) return;

    /**
     * Fonction appelée quand une touche est pressée
     * @param e - L'événement clavier
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault(); // Empêcher le défilement de la page
          handlePrev(); // Image précédente
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext(); // Image suivante
          break;
        case 'Escape':
          e.preventDefault();
          onClose(); // Fermer la lightbox
          break;
        case '+':
        case '=':
          // + ou = (avec Shift) pour zoomer
          if (e.shiftKey || e.key === '=') {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          e.preventDefault();
          handleZoomOut(); // Dézoomer
          break;
        case '0':
          e.preventDefault();
          handleResetZoom(); // Réinitialiser le zoom
          break;
      }
    };

    // Enregistrer l'écouteur d'événement sur la fenêtre
    window.addEventListener('keydown', handleKeyDown);

    // Nettoyer: retirer l'écouteur quand le composant se démonte ou quand isOpen change
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ============================================
  // VÉRIFICATION DE SÉCURITÉ
  // ============================================

  // Si aucune image n'est fournie, ne rien afficher
  if (!images.length) return null;

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  /**
   * Dialog est un composant de fenêtre modale (popup)
   * Il crée une fenêtre qui s'affiche par-dessus le reste de la page
   */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] max-w-[95vw] overflow-hidden border-none bg-black/95 p-0">
        <DialogTitle className="sr-only">
          Image {currentIndex + 1} sur {images.length}
        </DialogTitle>
        <div className="relative flex h-full min-h-[400px] w-full items-center justify-center">
          {/* Bouton fermer */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Bouton précédent */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 text-white hover:bg-white/20"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Bouton suivant */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Contrôles de zoom */}
          <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-black/50 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleZoomOut}
              disabled={scale <= 1}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="min-w-[60px] text-center text-sm text-white">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleZoomIn}
              disabled={scale >= 5}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            {scale > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-white hover:bg-white/20"
                onClick={handleResetZoom}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Indicateur d'image */}
          {images.length > 1 && (
            <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative flex h-[calc(95vh-120px)] w-full touch-none items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
            }}
          >
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <Image
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                width={1920}
                height={1920}
                className="max-h-[90vh] max-w-[90vw] select-none object-contain"
                priority
                unoptimized
                draggable={false}
              />
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

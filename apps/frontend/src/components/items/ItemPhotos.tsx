/**
 * FICHIER: components/items/ItemPhotos.tsx
 *
 * DESCRIPTION:
 * Ce composant gère l'affichage et la gestion des photos d'un item.
 * Il permet d'afficher une galerie de photos, d'ajouter de nouvelles photos (si propriétaire),
 * et de visualiser une photo en grand dans une modale.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage en grille responsive des photos de l'item
 * - Ajout de nouvelles photos via CloudinaryDropzone (propriétaire uniquement)
 * - Visualisation en grand d'une photo sélectionnée (modale)
 * - Animations d'apparition pour chaque photo (stagger effect)
 * - État vide avec message si aucune photo n'est disponible
 * - Gestion des permissions (seul le propriétaire peut ajouter des photos)
 *
 * UX:
 * - Grille responsive (2 colonnes mobile, 3 tablette, 4 desktop)
 * - Effet hover sur les photos avec bouton de visualisation
 * - Modale simple pour voir une photo en grand
 * - Feedback visuel lors de l'ajout de photos
 */

'use client';

// Import de React pour la gestion de l'état
import { useState } from 'react';
// Import de Framer Motion pour les animations fluides
import { motion, AnimatePresence } from 'framer-motion';
// Import des composants UI réutilisables
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import des types TypeScript pour garantir la sécurité des types
import { ItemPhoto } from '@/types';
// Import du composant CloudinaryDropzone pour l'upload de photos
import { CloudinaryDropzone } from '../upload/CloudinaryDropzone';
// Import de l'API items pour attacher les photos
import { itemsApi } from '@/lib/items.api';
// Import de react-hot-toast pour afficher des notifications
import { toast } from 'react-hot-toast';
// Import des icônes Lucide React
import { Plus, X, Eye } from 'lucide-react';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface ItemPhotosProps {
  photos: ItemPhoto[]; // Liste des photos de l'item à afficher
  itemId: string; // ID de l'item (nécessaire pour attacher de nouvelles photos)
  isOwner: boolean; // true si l'utilisateur connecté est le propriétaire de l'item
  onPhotosUpdate?: (photos: ItemPhoto[]) => void; // Callback optionnel appelé après l'ajout de photos
}

/**
 * COMPOSANT PRINCIPAL: ItemPhotos
 *
 * Ce composant gère l'affichage et la gestion des photos d'un item.
 *
 * @param photos - Liste des photos de l'item à afficher
 * @param itemId - ID de l'item (nécessaire pour attacher de nouvelles photos)
 * @param isOwner - true si l'utilisateur connecté est le propriétaire de l'item
 * @param onPhotosUpdate - Callback optionnel appelé après l'ajout de photos
 */
export function ItemPhotos({
  photos,
  itemId,
  isOwner,
  onPhotosUpdate,
}: ItemPhotosProps) {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour contrôler l'affichage du formulaire d'upload
   * true = afficher le formulaire d'upload
   * false = afficher le bouton "Ajouter des photos"
   */
  const [showUpload, setShowUpload] = useState(false);

  /**
   * État pour stocker l'URL de la photo sélectionnée pour visualisation en grand
   * null = aucune photo sélectionnée (modale fermée)
   * string = URL de la photo à afficher en grand
   */
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // ============================================
  // GESTION DE L'UPLOAD DE PHOTOS
  // ============================================

  /**
   * Fonction appelée quand l'upload de photos est terminé avec succès.
   * Elle attache les photos à l'item via l'API et affiche un message de succès.
   *
   * @param photoMetas - Tableau des métadonnées des photos uploadées (URL, dimensions, etc.)
   */
  const handleUploadComplete = async (photoMetas: any[]) => {
    try {
      /**
       * Appeler l'API pour attacher les photos à l'item
       * itemsApi.attachPhotos() fait un appel HTTP POST /items/:id/photos
       * avec les métadonnées des photos uploadées
       */
      await itemsApi.attachPhotos(itemId, photoMetas);

      /**
       * Afficher un message de succès à l'utilisateur
       */
      toast.success('Photos ajoutées avec succès');

      /**
       * Masquer le formulaire d'upload après succès
       */
      setShowUpload(false);

      /**
       * Appeler le callback pour notifier le parent que les photos ont été mises à jour
       * Le parent peut alors recharger les photos depuis le serveur
       * On passe un tableau vide car le parent rechargera toutes les photos
       */
      onPhotosUpdate?.([]);
    } catch (error) {
      /**
       * En cas d'erreur (ex: serveur indisponible, erreur réseau, etc.)
       * Afficher un message d'erreur à l'utilisateur
       */
      toast.error("Erreur lors de l'ajout des photos");
    }
  };

  // ============================================
  // ÉTAT VIDE (AUCUNE PHOTO ET PAS PROPRIÉTAIRE)
  // ============================================

  /**
   * Si aucune photo n'est disponible ET que l'utilisateur n'est pas le propriétaire,
   * afficher un message indiquant qu'il n'y a pas de photos.
   * Le propriétaire peut toujours ajouter des photos, donc on affiche le formulaire d'upload.
   */
  if (photos.length === 0 && !isOwner) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {/*
            Emoji caméra pour illustrer l'absence de photos
            text-6xl: très grande taille pour attirer l'attention
            mb-4: marge en bas de 16px
          */}
          <div className="mb-4 text-6xl">📷</div>
          {/*
            Message indiquant qu'il n'y a pas de photos disponibles
            text-muted-foreground: couleur atténuée pour le texte secondaire
          */}
          <p className="text-muted-foreground">Aucune photo disponible</p>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  return (
    <div className="space-y-4">
      {/* ============================================
          GALERIE DE PHOTOS
          ============================================ */}
      {/*
        Afficher la galerie seulement s'il y a des photos
      */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {/*
              Grille responsive pour afficher les photos:
              - grid-cols-2: 2 colonnes sur mobile
              - md:grid-cols-3: 3 colonnes sur tablette (≥768px)
              - lg:grid-cols-4: 4 colonnes sur desktop (≥1024px)
              gap-4: espacement de 16px entre les photos
            */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {/*
                Parcourir chaque photo et l'afficher avec une animation
                stagger effect: chaque photo apparaît avec un délai progressif
              */}
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.8 }} // État initial: invisible et légèrement réduite
                  animate={{ opacity: 1, scale: 1 }} // État final: visible et taille normale
                  transition={{ duration: 0.3, delay: index * 0.1 }} // Délai progressif pour l'effet stagger
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  {/*
                    Image de la photo
                    aspect-square: format carré (1:1)
                    cursor-pointer: curseur pointeur pour indiquer qu'on peut cliquer
                    object-cover: l'image couvre tout l'espace en gardant ses proportions
                    group-hover:scale-105: agrandir légèrement au survol (effet zoom)
                  */}
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                    onClick={() => setSelectedPhoto(photo.url)} // Ouvrir la modale au clic
                  />
                  {/*
                    Overlay sombre au survol pour améliorer la visibilité
                    bg-black/0: transparent par défaut
                    group-hover:bg-black/20: 20% d'opacité noire au survol
                  */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  {/*
                    Bouton de visualisation qui apparaît au survol
                    opacity-0: invisible par défaut
                    group-hover:opacity-100: visible au survol
                  */}
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedPhoto(photo.url)} // Ouvrir la modale au clic
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          BOUTON D'AJOUT POUR LE PROPRIÉTAIRE
          ============================================ */}
      {/*
        Afficher le formulaire d'upload seulement si l'utilisateur est le propriétaire
      */}
      {isOwner && (
        <div>
          {/*
            Si le formulaire d'upload n'est pas affiché, montrer le bouton "Ajouter des photos"
          */}
          {!showUpload ? (
            <Button
              onClick={() => setShowUpload(true)} // Afficher le formulaire d'upload au clic
              variant="outline"
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter des photos
            </Button>
          ) : (
            <>
              {/*
              Si le formulaire d'upload est affiché, montrer le formulaire avec un bouton de fermeture
            */}
              <Card>
                <CardContent className="p-6">
                  {/*
                  En-tête du formulaire avec titre et bouton de fermeture
                  flex items-center justify-between: aligner horizontalement avec espacement
                */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Ajouter des photos
                    </h3>
                    {/*
                    Bouton pour fermer le formulaire d'upload
                    variant="ghost": style transparent
                    size="sm": petite taille
                  */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUpload(false)} // Masquer le formulaire au clic
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/*
                  Composant CloudinaryDropzone pour l'upload de photos
                  Il gère le drag & drop, la sélection de fichiers, et l'upload vers Cloudinary
                */}
                  <CloudinaryDropzone
                    itemId={itemId}
                    onUploadComplete={handleUploadComplete} // Callback appelé après l'upload
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ============================================
          MODALE DE VISUALISATION
          ============================================ */}
      {/*
        AnimatePresence permet d'animer l'apparition/disparition de la modale
        Il détecte automatiquement quand selectedPhoto change de null à string (ou vice versa)
      */}
      <AnimatePresence>
        {/*
          Afficher la modale seulement si une photo est sélectionnée
        */}
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }} // État initial: invisible
            animate={{ opacity: 1 }} // État final: visible
            exit={{ opacity: 0 }} // État de sortie: invisible
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedPhoto(null)} // Fermer la modale en cliquant sur le fond
          >
            {/*
              Conteneur de l'image avec animation de scale
              stopPropagation() empêche la fermeture quand on clique sur l'image elle-même
            */}
            <motion.div
              initial={{ scale: 0.8 }} // État initial: légèrement réduite
              animate={{ scale: 1 }} // État final: taille normale
              exit={{ scale: 0.8 }} // État de sortie: légèrement réduite
              className="relative max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()} // Empêcher la fermeture au clic sur l'image
            >
              {/*
                Image en grand
                max-h-[90vh]: hauteur maximale de 90% de la hauteur de la fenêtre
                max-w-[90vw]: largeur maximale de 90% de la largeur de la fenêtre
                object-contain: l'image garde ses proportions et s'adapte à l'espace disponible
                rounded-lg: coins arrondis
              */}
              <img
                src={selectedPhoto}
                alt="Photo en grand"
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              />
              {/*
                Bouton de fermeture en haut à droite
                absolute right-4 top-4: position absolue en haut à droite
              */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setSelectedPhoto(null)} // Fermer la modale au clic
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

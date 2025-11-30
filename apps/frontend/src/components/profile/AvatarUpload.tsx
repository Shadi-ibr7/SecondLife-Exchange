/**
 * FICHIER: components/profile/AvatarUpload.tsx
 *
 * DESCRIPTION:
 * Ce composant permet à l'utilisateur de télécharger et changer sa photo de profil.
 * Il gère la sélection de fichier, la validation (type et taille), la prévisualisation,
 * l'upload sécurisé vers Cloudinary via une signature signée, et l'affichage de l'avatar.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Sélection de fichier via un input file caché
 * - Validation du type de fichier (images uniquement)
 * - Validation de la taille (max 3MB)
 * - Prévisualisation avant upload
 * - Upload sécurisé vers Cloudinary avec signature signée
 * - Affichage de l'avatar actuel ou de la prévisualisation
 * - État de chargement pendant l'upload
 * - Gestion des erreurs avec notifications toast
 * - Possibilité de désactiver le composant
 *
 * SÉCURITÉ:
 * - La signature Cloudinary est générée côté serveur pour garantir la sécurité
 * - Validation stricte du type et de la taille de fichier
 * - Upload direct vers Cloudinary (pas via notre serveur) pour optimiser les performances
 *
 * UX:
 * - Bouton caméra sur l'avatar pour un accès rapide
 * - Bouton "Changer la photo" en dessous pour une alternative
 * - Prévisualisation immédiate après sélection
 * - Feedback visuel pendant l'upload (spinner)
 * - Messages d'erreur clairs en cas de problème
 */

'use client';

// Import de React pour la gestion de l'état, des refs et des callbacks
import { useState, useRef, useCallback } from 'react';
// Import des composants UI réutilisables
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Import des icônes Lucide React
import { Camera, X, Upload } from 'lucide-react';
// Import de l'API d'upload pour gérer les uploads vers Cloudinary
import { uploadApi } from '@/lib/upload.api';
// Import de react-hot-toast pour afficher des notifications
import { toast } from 'react-hot-toast';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 */
interface AvatarUploadProps {
  currentAvatarUrl?: string; // URL de l'avatar actuel (optionnel)
  displayName: string; // Nom d'affichage de l'utilisateur (pour le fallback)
  onUploadComplete: (url: string) => void; // Callback appelé quand l'upload est terminé avec succès
  disabled?: boolean; // Si true, désactive le composant (pas de sélection de fichier)
}

/**
 * COMPOSANT PRINCIPAL: AvatarUpload
 *
 * Ce composant permet de télécharger et changer la photo de profil de l'utilisateur.
 *
 * @param currentAvatarUrl - URL de l'avatar actuel (optionnel)
 * @param displayName - Nom d'affichage de l'utilisateur (pour le fallback)
 * @param onUploadComplete - Callback appelé quand l'upload est terminé avec succès
 * @param disabled - Si true, désactive le composant
 */
export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  onUploadComplete,
  disabled = false,
}: AvatarUploadProps) {
  // ============================================
  // GESTION DE L'ÉTAT
  // ============================================

  /**
   * État pour indiquer si l'upload est en cours
   * Utilisé pour afficher un spinner et désactiver les boutons
   */
  const [isUploading, setIsUploading] = useState(false);

  /**
   * État pour stocker l'URL de prévisualisation de l'image sélectionnée
   * null signifie qu'aucune prévisualisation n'est affichée
   * Utilisé pour afficher l'image avant qu'elle ne soit uploadée
   */
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * Référence vers l'input file caché
   * Permet de déclencher le sélecteur de fichier programmatiquement
   * (quand l'utilisateur clique sur le bouton caméra ou "Changer la photo")
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // FONCTION POUR GÉRER LA SÉLECTION ET L'UPLOAD
  // ============================================

  /**
   * Fonction asynchrone qui gère la sélection d'un fichier, sa validation,
   * sa prévisualisation et son upload vers Cloudinary.
   *
   * FLUX:
   * 1. Validation du type de fichier (doit être une image)
   * 2. Validation de la taille (max 3MB)
   * 3. Création d'une prévisualisation avec FileReader
   * 4. Récupération d'une signature sécurisée depuis le serveur
   * 5. Upload direct vers Cloudinary avec la signature
   * 6. Appel du callback avec l'URL de l'image uploadée
   *
   * useCallback est utilisé pour mémoriser la fonction et éviter les re-renders inutiles
   *
   * @param file - Le fichier image sélectionné par l'utilisateur
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      // ============================================
      // VALIDATION 1: TYPE DE FICHIER
      // ============================================
      /**
       * Vérifier que le fichier est bien une image
       * file.type commence par "image/" pour les images (ex: "image/jpeg", "image/png")
       */
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return; // Arrêter le processus si ce n'est pas une image
      }

      // ============================================
      // VALIDATION 2: TAILLE DU FICHIER
      // ============================================
      /**
       * Vérifier que la taille du fichier ne dépasse pas 3MB
       * 3 * 1024 * 1024 = 3MB en octets
       * file.size est en octets
       */
      if (file.size > 3 * 1024 * 1024) {
        toast.error("L'image doit faire moins de 3MB");
        return; // Arrêter le processus si le fichier est trop gros
      }

      // ============================================
      // PRÉVISUALISATION
      // ============================================
      /**
       * Créer une prévisualisation de l'image avant l'upload
       * FileReader permet de lire le contenu d'un fichier et de le convertir en Data URL
       * (format base64 qui peut être utilisé directement dans une balise <img>)
       */
      const reader = new FileReader();
      /**
       * Quand la lecture est terminée, on met à jour l'état preview
       * avec le résultat (Data URL de l'image)
       */
      reader.onload = (e) => {
        // e.target?.result contient la Data URL de l'image
        // On la cast en string car TypeScript ne sait pas le type exact
        setPreview(e.target?.result as string);
      };
      /**
       * Lancer la lecture du fichier en tant que Data URL
       * Cela déclenchera l'événement onload une fois terminé
       */
      reader.readAsDataURL(file);

      // ============================================
      // UPLOAD VERS CLOUDINARY
      // ============================================
      /**
       * Activer l'état de chargement pour afficher le spinner
       * et désactiver les boutons pendant l'upload
       */
      setIsUploading(true);

      try {
        // ============================================
        // ÉTAPE 1: OBTENIR LA SIGNATURE SÉCURISÉE
        // ============================================
        /**
         * Récupérer une signature signée depuis notre serveur
         * Cette signature garantit que seul notre serveur peut autoriser des uploads
         * Le dossier 'profiles' indique où stocker l'image dans Cloudinary
         */
        const signature = await uploadApi.getUploadSignature({
          folder: 'profiles', // Dossier Cloudinary où stocker l'image
        });

        // ============================================
        // ÉTAPE 2: UPLOAD DIRECT VERS CLOUDINARY
        // ============================================
        /**
         * Uploader directement l'image vers Cloudinary (pas via notre serveur)
         * Cela optimise les performances car l'image ne passe pas par notre serveur
         *
         * La signature est incluse dans la requête pour prouver que l'upload est autorisé
         *
         * process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: nom du compte Cloudinary
         * (variable d'environnement publique car nécessaire côté client)
         */
        const result = await uploadApi.uploadToCloudinary(
          file, // Le fichier à uploader
          signature, // La signature sécurisée
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '' // Nom du compte Cloudinary
        );

        // ============================================
        // ÉTAPE 3: APPELER LE CALLBACK AVEC L'URL
        // ============================================
        /**
         * L'upload est réussi, on appelle le callback avec l'URL de l'image
         * Le parent (ex: page de profil) peut alors mettre à jour l'avatar de l'utilisateur
         */
        onUploadComplete(result.url);

        /**
         * Afficher un message de succès à l'utilisateur
         */
        toast.success('Photo de profil uploadée avec succès !');

        /**
         * Réinitialiser la prévisualisation car l'image est maintenant uploadée
         */
        setPreview(null);
      } catch (error) {
        /**
         * En cas d'erreur (ex: serveur indisponible, signature invalide, etc.)
         * on log l'erreur pour le debug et on affiche un message à l'utilisateur
         */
        console.error("Erreur lors de l'upload:", error);
        toast.error("Erreur lors de l'upload de la photo");

        /**
         * Réinitialiser la prévisualisation même en cas d'erreur
         */
        setPreview(null);
      } finally {
        /**
         * Toujours désactiver l'état de chargement, même en cas d'erreur
         * Cela permet de réactiver les boutons
         */
        setIsUploading(false);
      }
    },
    [onUploadComplete] // Dépendance: si onUploadComplete change, la fonction est recréée
  );

  // ============================================
  // GESTION DU CLIC SUR LES BOUTONS
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur clique sur le bouton caméra ou "Changer la photo"
   * Elle déclenche le sélecteur de fichier en cliquant programmatiquement sur l'input file caché
   */
  const handleClick = () => {
    // Ne rien faire si le composant est désactivé ou si un upload est en cours
    if (!disabled && !isUploading) {
      // Cliquer programmatiquement sur l'input file caché
      // Cela ouvre le sélecteur de fichier du navigateur
      fileInputRef.current?.click();
    }
  };

  // ============================================
  // GESTION DU CHANGEMENT DE FICHIER
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur sélectionne un fichier dans le sélecteur
   * Elle récupère le fichier sélectionné et appelle handleFileSelect
   *
   * @param e - L'événement de changement de l'input file
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    /**
     * Récupérer le premier fichier sélectionné (e.target.files est un FileList)
     * ?.[0] utilise l'optional chaining pour éviter une erreur si files est null/undefined
     */
    const file = e.target.files?.[0];

    /**
     * Si un fichier a été sélectionné, appeler handleFileSelect pour le traiter
     */
    if (file) {
      handleFileSelect(file);
    }

    /**
     * IMPORTANT: Réinitialiser la valeur de l'input
     * Cela permet de re-sélectionner le même fichier si l'utilisateur le souhaite
     * (sinon, l'événement onChange ne se déclencherait pas car la valeur n'a pas changé)
     */
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================
  // DÉTERMINATION DE L'URL DE L'AVATAR À AFFICHER
  // ============================================

  /**
   * Déterminer quelle URL utiliser pour afficher l'avatar:
   * - Si une prévisualisation existe (image récemment sélectionnée), l'utiliser
   * - Sinon, utiliser l'URL de l'avatar actuel
   * - Si aucune des deux n'existe, l'Avatar affichera le fallback (première lettre du nom)
   */
  const avatarUrl = preview || currentAvatarUrl;

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  /**
   * Le composant est organisé en colonne (flex-col) avec:
   * - L'avatar avec le bouton caméra en haut
   * - L'input file caché (invisible mais fonctionnel)
   * - Le bouton "Changer la photo" en dessous
   */
  return (
    <div className="flex flex-col items-center gap-4">
      {/* ============================================
          CONTENEUR DE L'AVATAR (POSITION RELATIVE)
          ============================================ */}
      <div className="relative">
        {/*
          Avatar de grande taille (h-24 w-24 = 96px x 96px)
          border-2 border-primary/20: bordure de 2px avec 20% d'opacité de la couleur primaire
        */}
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          {/*
            Image de l'avatar si elle existe (avatarUrl peut être undefined)
            alt={displayName}: texte alternatif pour l'accessibilité
          */}
          <AvatarImage src={avatarUrl} alt={displayName} />
          {/*
            Fallback: si l'image n'existe pas ou n'a pas chargé, afficher la première lettre
            du nom en majuscule dans un cercle coloré
            bg-primary/10: fond avec 10% d'opacité de la couleur primaire
            text-2xl: texte très grand
            font-semibold: police semi-grasse
            text-primary: couleur primaire pour le texte
          */}
          <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/*
          Bouton caméra positionné en bas à droite de l'avatar
          Seulement affiché si le composant n'est pas désactivé
        */}
        {!disabled && (
          <Button
            type="button" // type="button" empêche la soumission de formulaire si dans un form
            size="icon" // Taille adaptée pour une icône
            variant="secondary" // Style secondaire (gris)
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
            onClick={handleClick} // Déclencher le sélecteur de fichier au clic
            disabled={isUploading} // Désactiver pendant l'upload
          >
            {/*
              Afficher un spinner pendant l'upload, sinon l'icône caméra
              animate-spin: animation de rotation continue
              border-2 border-primary border-t-transparent: cercle avec bordure transparente en haut
            */}
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* ============================================
          INPUT FILE CACHÉ
          ============================================ */}
      {/*
        Input file caché (invisible) mais fonctionnel
        ref={fileInputRef}: référence pour pouvoir cliquer dessus programmatiquement
        type="file": type d'input pour sélectionner un fichier
        accept="image/*": accepter uniquement les images (tous formats)
        onChange={handleFileChange}: appeler handleFileChange quand un fichier est sélectionné
        className="hidden": masquer l'input (il est invisible)
        disabled={disabled || isUploading}: désactiver si le composant est désactivé ou si un upload est en cours
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* ============================================
          BOUTON "CHANGER LA PHOTO"
          ============================================ */}
      {/*
        Bouton alternatif pour changer la photo
        Seulement affiché si le composant n'est pas désactivé
      */}
      {!disabled && (
        <Button
          type="button" // type="button" empêche la soumission de formulaire
          variant="outline" // Style avec bordure
          size="sm" // Petite taille
          onClick={handleClick} // Déclencher le sélecteur de fichier au clic
          disabled={isUploading} // Désactiver pendant l'upload
          className="flex items-center gap-2" // Aligner l'icône et le texte horizontalement
        >
          <Upload className="h-4 w-4" />
          {/*
            Afficher "Upload en cours..." pendant l'upload, sinon "Changer la photo"
            Cela donne un feedback visuel à l'utilisateur
          */}
          {isUploading ? 'Upload en cours...' : 'Changer la photo'}
        </Button>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X, Upload } from 'lucide-react';
import { uploadApi } from '@/lib/upload.api';
import { toast } from 'react-hot-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  displayName: string;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  onUploadComplete,
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }

      // Vérifier la taille (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error("L'image doit faire moins de 3MB");
        return;
      }

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader l'image
      setIsUploading(true);
      try {
        // Obtenir la signature
        const signature = await uploadApi.getUploadSignature({
          folder: 'profiles',
        });

        // Uploader vers Cloudinary
        const result = await uploadApi.uploadToCloudinary(
          file,
          signature,
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
        );

        // Appeler le callback avec l'URL
        onUploadComplete(result.url);
        toast.success('Photo de profil uploadée avec succès !');
        setPreview(null);
      } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        toast.error("Erreur lors de l'upload de la photo");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input pour permettre le re-téléchargement du même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const avatarUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!disabled && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
            onClick={handleClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Upload en cours...' : 'Changer la photo'}
        </Button>
      )}
    </div>
  );
}


'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { uploadApi } from '@/lib/upload.api';
import { PhotoMeta } from '@/types';
import { UPLOAD_CONFIG } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import {
  Upload,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface CloudinaryDropzoneProps {
  itemId: string;
  maxFiles?: number;
  onUploadComplete?: (photos: PhotoMeta[]) => void;
  onUploadStart?: () => void;
}

interface UploadFile extends File {
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: PhotoMeta;
}

export function CloudinaryDropzone({
  itemId,
  maxFiles = UPLOAD_CONFIG.maxFiles,
  onUploadComplete,
  onUploadStart,
}: CloudinaryDropzoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map((file) => {
        const uploadFile = Object.assign(file, {
          id: Math.random().toString(36).substr(2, 9),
          preview: URL.createObjectURL(file),
          status: 'pending' as const,
          progress: 0,
        });
        return uploadFile as UploadFile; // conserve l'instance File (Blob)
      });

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: UPLOAD_CONFIG.maxFileSize,
    maxFiles: maxFiles - files.length,
    disabled: isUploading,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    // Vérifier que Cloudinary est configuré
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      console.error('Variables Cloudinary manquantes:', {
        cloudName: !!cloudName,
        apiKey: !!apiKey,
        env: {
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
            process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env
            .NEXT_PUBLIC_CLOUDINARY_API_KEY
            ? '***'
            : undefined,
        },
      });

      toast.error(
        'Configuration Cloudinary manquante. Vérifiez que NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME et NEXT_PUBLIC_CLOUDINARY_API_KEY sont définies dans .env.local et redémarrez le serveur.'
      );
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    const uploadPromises = files.map(async (file) => {
      try {
        // Mettre à jour le statut
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: 'uploading' } : f
          )
        );

        // Récupérer la signature
        const signature = await uploadApi.getUploadSignature({
          folder: `items/${itemId}`,
        });

        // Vérifier que la signature est valide
        if (!signature || !signature.signature || !signature.timestamp) {
          throw new Error('Signature invalide reçue du serveur');
        }

        // Upload vers Cloudinary
        const result = await uploadApi.uploadToCloudinary(
          file,
          signature,
          cloudName
        );

        // Mettre à jour avec le succès
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'success', progress: 100, result }
              : f
          )
        );

        return result;
      } catch (error: any) {
        // Mettre à jour avec l'erreur
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Erreur inconnue lors de l'upload";

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'error',
                  error: errorMessage,
                }
              : f
          )
        );

        console.error('Erreur upload:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(
      (result): result is PhotoMeta => result !== null
    );

    if (successfulUploads.length > 0) {
      onUploadComplete?.(successfulUploads);
      toast.success(
        `${successfulUploads.length} photo(s) uploadée(s) avec succès`
      );
    }

    if (results.some((result) => result === null)) {
      toast.error("Certaines photos n'ont pas pu être uploadées");
    }

    setIsUploading(false);
  };

  const clearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? 'Déposez les images ici'
                    : 'Glissez-déposez vos images ou cliquez pour sélectionner'}
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, WEBP jusqu'à 3MB • Maximum {maxFiles} fichiers
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-md">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.size
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Taille inconnue'}
                  </p>
                  {file.status === 'uploading' && (
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  {file.error && (
                    <p className="text-xs text-destructive">{file.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'success' && (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="mr-1 h-3 w-3" />
                      Uploadé
                    </Badge>
                  )}
                  {file.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Erreur
                    </Badge>
                  )}
                  {file.status === 'pending' && (
                    <Badge variant="secondary">
                      <ImageIcon className="mr-1 h-3 w-3" />
                      En attente
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={uploadFiles}
            disabled={isUploading || files.every((f) => f.status === 'success')}
            className="flex-1"
          >
            {isUploading ? 'Upload en cours...' : 'Uploader les photos'}
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={isUploading}>
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  );
}

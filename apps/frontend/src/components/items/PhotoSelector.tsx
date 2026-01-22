/**
 * FICHIER: components/items/PhotoSelector.tsx
 *
 * DESCRIPTION:
 * Composant pour sélectionner des photos avant la création d'un objet.
 * Stocke les fichiers localement et affiche des prévisualisations.
 * Les photos seront uploadées après la création de l'objet.
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UPLOAD_CONFIG } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoFile extends File {
  id: string;
  preview: string;
}

interface PhotoSelectorProps {
  maxFiles?: number;
  onPhotosChange: (files: File[]) => void;
  required?: boolean;
  error?: string;
}

export function PhotoSelector({
  maxFiles = UPLOAD_CONFIG.maxFiles,
  onPhotosChange,
  required = false,
  error,
}: PhotoSelectorProps) {
  const [files, setFiles] = useState<PhotoFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Vérifier la limite
      const remaining = maxFiles - files.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxFiles} photos autorisées`);
        return;
      }

      const newFiles: PhotoFile[] = acceptedFiles.slice(0, remaining).map((file) => {
        const photoFile = Object.assign(file, {
          id: Math.random().toString(36).substr(2, 9),
          preview: URL.createObjectURL(file),
        });
        return photoFile as PhotoFile;
      });

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onPhotosChange(updatedFiles);
    },
    [files, maxFiles, onPhotosChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: UPLOAD_CONFIG.maxFileSize,
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      const updated = prev.filter((f) => f.id !== fileId);
      onPhotosChange(updated);
      return updated;
    });
  };

  const clearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    onPhotosChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5',
              error && 'border-destructive'
            )}
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
                  {required && ' • Requis'}
                </p>
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Prévisualisations */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {files.length} photo{files.length > 1 ? 's' : ''} sélectionnée{files.length > 1 ? 's' : ''}
              </p>
              {files.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-destructive hover:text-destructive"
                >
                  Tout supprimer
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {file.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

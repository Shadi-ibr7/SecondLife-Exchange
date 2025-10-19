'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ItemPhoto } from '@/types';
import { CloudinaryDropzone } from '../upload/CloudinaryDropzone';
import { itemsApi } from '@/lib/items.api';
import { toast } from 'react-hot-toast';
import { Plus, X, Eye } from 'lucide-react';

interface ItemPhotosProps {
  photos: ItemPhoto[];
  itemId: string;
  isOwner: boolean;
  onPhotosUpdate?: (photos: ItemPhoto[]) => void;
}

export function ItemPhotos({
  photos,
  itemId,
  isOwner,
  onPhotosUpdate,
}: ItemPhotosProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleUploadComplete = async (photoMetas: any[]) => {
    try {
      await itemsApi.attachPhotos(itemId, photoMetas);
      toast.success('Photos ajoutées avec succès');
      setShowUpload(false);
      // Recharger les photos ou mettre à jour l'état
      onPhotosUpdate?.([]); // Sera rechargé par le parent
    } catch (error) {
      toast.error("Erreur lors de l'ajout des photos");
    }
  };

  if (photos.length === 0 && !isOwner) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mb-4 text-6xl">📷</div>
          <p className="text-muted-foreground">Aucune photo disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Galerie de photos */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                    onClick={() => setSelectedPhoto(photo.url)}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedPhoto(photo.url)}
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

      {/* Bouton d'ajout pour le propriétaire */}
      {isOwner && (
        <div>
          {!showUpload ? (
            <Button
              onClick={() => setShowUpload(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter des photos
            </Button>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ajouter des photos</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUpload(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CloudinaryDropzone
                  itemId={itemId}
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal de visualisation */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto}
                alt="Photo en grand"
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setSelectedPhoto(null)}
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

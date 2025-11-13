'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useUnsplashImages } from '@/hooks/useUnsplashImages';
import { triggerDownload } from '@/lib/unsplash.api';
import UnsplashSearch from './UnsplashSearch';
import UnsplashSkeleton from './UnsplashSkeleton';

interface UnsplashGalleryProps {
  query?: string;
  showSearch?: boolean;
}

export default function UnsplashGallery({
  query: initialQuery = 'vintage eco friendly crafts',
  showSearch = true,
}: UnsplashGalleryProps) {
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const { data, isLoading, error } = useUnsplashImages(currentQuery);

  const handleSearch = (newQuery: string) => {
    setCurrentQuery(newQuery);
  };

  if (error) {
    return (
      <section className="w-full py-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">📷</div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-100">
            Erreur de chargement des photos
          </h2>
          <p className="mb-4 text-red-500">
            Impossible de charger les photos. Vérifiez votre connexion et
            réessayez.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-8">
      <h2 className="mb-4 text-2xl font-semibold text-gray-100">
        Photos libres de droits pour "{currentQuery}"
      </h2>

      {showSearch && (
        <UnsplashSearch onSearch={handleSearch} initialQuery={currentQuery} />
      )}

      {isLoading ? (
        <UnsplashSkeleton />
      ) : !data || data.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-100">
            Aucune photo trouvée
          </h3>
          <p className="mb-4 text-gray-400">
            Essayez avec d'autres mots-clés pour découvrir des photos
            inspirantes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((photo) => (
            <motion.div
              key={photo.id}
              whileHover={{ scale: 1.02 }}
              onClick={() =>
                triggerDownload(photo.id, photo.links.download_location)
              }
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-muted/30 shadow-md"
            >
              <Image
                src={photo.urls.small}
                alt={photo.alt_description || 'Photo Unsplash'}
                width={400}
                height={400}
                className="h-64 w-full object-cover"
              />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-gray-300 opacity-0 transition-opacity group-hover:opacity-100">
                <p>
                  Photo by{' '}
                  <a
                    href={photo.user.links.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    {photo.user.name}
                  </a>{' '}
                  on{' '}
                  <a
                    href={photo.links.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    Unsplash
                  </a>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUnsplashPhotos } from '@/lib/unsplash.api';

export function useUnsplashImages(query: string, page = 1, perPage = 12) {
  return useQuery({
    queryKey: ['unsplash', query, page],
    queryFn: () => fetchUnsplashPhotos(query, page, perPage),
    enabled: !!query,
    staleTime: 1000 * 60 * 5,
  });
}

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ListItemsParams } from '@/types';

export function useQueryParams() {
  const searchParams = useSearchParams();

  const params = useMemo((): ListItemsParams => {
    return {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      q: searchParams.get('q') || undefined,
      category: (searchParams.get('category') as any) || undefined,
      condition: (searchParams.get('condition') as any) || undefined,
      status: (searchParams.get('status') as any) || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      sort: searchParams.get('sort') || '-createdAt',
    };
  }, [searchParams]);

  const updateParams = useCallback((newParams: Partial<ListItemsParams>) => {
    const url = new URL(window.location.href);
    const currentParams = new URLSearchParams(url.search);

    // Reset page when changing filters
    if (
      newParams.q !== undefined ||
      newParams.category !== undefined ||
      newParams.condition !== undefined ||
      newParams.status !== undefined ||
      newParams.sort !== undefined
    ) {
      newParams.page = 1;
    }

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(value));
      }
    });

    const newUrl = `${url.pathname}?${currentParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  const resetParams = useCallback(() => {
    const url = new URL(window.location.href);
    window.history.pushState({}, '', url.pathname);
  }, []);

  return {
    params,
    updateParams,
    resetParams,
  };
}

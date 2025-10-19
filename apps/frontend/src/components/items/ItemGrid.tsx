'use client';

import { Item } from '@/types';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  items: Item[];
  loading?: boolean;
}

export function ItemGrid({ items, loading = false }: ItemGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-xl font-semibold">Aucun objet trouvé</h3>
        <p className="mb-4 text-muted-foreground">
          Essayez de modifier vos critères de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <ItemCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

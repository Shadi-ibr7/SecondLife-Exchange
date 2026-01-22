/**
 * FICHIER: components/community/CategoryList.tsx
 *
 * DESCRIPTION:
 * Composant pour afficher la liste des catégories avec leurs compteurs.
 * Utilisé dans la sidebar de la page communauté.
 */

'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { THREAD_CATEGORIES, THREAD_CATEGORY_LABELS } from '@/lib/constants';
import { ThreadCategory } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryListProps {
  selectedCategory?: ThreadCategory | null;
  onCategorySelect?: (category: ThreadCategory | null) => void;
  categoryCounts?: Record<string, number>;
  totalCount?: number;
}

export function CategoryList({
  selectedCategory,
  onCategorySelect,
  categoryCounts = {},
  totalCount = 0,
}: CategoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Catégories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Option "Tous" */}
        <button
          onClick={() => onCategorySelect?.(null)}
          className={cn(
            'w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors hover:bg-muted',
            selectedCategory === null && 'bg-muted font-medium'
          )}
        >
          <span>Tous</span>
          <Badge variant="secondary" className="ml-auto">
            {totalCount}
          </Badge>
        </button>

        {/* Liste des catégories */}
        {THREAD_CATEGORIES.map((category) => {
          const count = categoryCounts[category] || 0;
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onCategorySelect?.(category)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors hover:bg-muted',
                isSelected && 'bg-muted font-medium'
              )}
            >
              <span>{THREAD_CATEGORY_LABELS[category]}</span>
              <Badge variant="secondary" className="ml-auto">
                {count}
              </Badge>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

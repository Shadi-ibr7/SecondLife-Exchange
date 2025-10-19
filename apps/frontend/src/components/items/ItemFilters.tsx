'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_STATUS,
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
  ITEM_STATUS_LABELS,
  SORT_OPTIONS,
} from '@/lib/constants';
import { ListItemsParams } from '@/types';
import { Search, X, Filter } from 'lucide-react';

interface ItemFiltersProps {
  params: ListItemsParams;
  onParamsChange: (params: Partial<ListItemsParams>) => void;
  onReset: () => void;
}

export function ItemFilters({
  params,
  onParamsChange,
  onReset,
}: ItemFiltersProps) {
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  const handleChange = (key: keyof ListItemsParams, value: any) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    onParamsChange({ [key]: value });
  };

  const hasActiveFilters =
    localParams.q ||
    localParams.category ||
    localParams.condition ||
    localParams.status ||
    localParams.sort !== '-createdAt';

  const activeFiltersCount = [
    localParams.q,
    localParams.category,
    localParams.condition,
    localParams.status,
    localParams.sort !== '-createdAt' ? localParams.sort : null,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un objet..."
                value={localParams.q || ''}
                onChange={(e) => handleChange('q', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-2 md:flex-row">
            <select
              value={localParams.category || ''}
              onChange={(e) =>
                handleChange('category', e.target.value || undefined)
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Toutes les catégories</option>
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {ITEM_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>

            <select
              value={localParams.condition || ''}
              onChange={(e) =>
                handleChange('condition', e.target.value || undefined)
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous les états</option>
              {ITEM_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {ITEM_CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>

            <select
              value={localParams.status || ''}
              onChange={(e) =>
                handleChange('status', e.target.value || undefined)
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous les statuts</option>
              {ITEM_STATUS.map((status) => (
                <option key={status} value={status}>
                  {ITEM_STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <select
              value={localParams.sort || '-createdAt'}
              onChange={(e) => handleChange('sort', e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtres actifs */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Filtres actifs:
            </span>
            {localParams.q && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Recherche: "{localParams.q}"
                <button
                  onClick={() => handleChange('q', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ITEM_CATEGORY_LABELS[localParams.category]}
                <button
                  onClick={() => handleChange('category', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.condition && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ITEM_CONDITION_LABELS[localParams.condition]}
                <button
                  onClick={() => handleChange('condition', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ITEM_STATUS_LABELS[localParams.status]}
                <button
                  onClick={() => handleChange('status', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localParams.sort !== '-createdAt' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {
                  SORT_OPTIONS.find((opt) => opt.value === localParams.sort)
                    ?.label
                }
                <button
                  onClick={() => handleChange('sort', '-createdAt')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="ml-2"
            >
              <Filter className="mr-2 h-4 w-4" />
              Réinitialiser ({activeFiltersCount})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

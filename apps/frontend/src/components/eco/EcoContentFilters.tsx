'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListEcoContentParams } from '@/types';
import { Search, Filter, X, Tag } from 'lucide-react';

interface EcoContentFiltersProps {
  filters: ListEcoContentParams;
  onFiltersChange: (filters: ListEcoContentParams) => void;
  popularTags: string[];
  stats: {
    total: number;
    byKind: Record<string, number>;
    byLocale: Record<string, number>;
  };
}

export function EcoContentFilters({
  filters,
  onFiltersChange,
  popularTags,
  stats,
}: EcoContentFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.q || '');

  const handleKindChange = (kind: string | undefined) => {
    onFiltersChange({
      ...filters,
      kind: kind as any,
      page: 1, // Reset to first page
    });
  };

  const handleTagSelect = (tag: string) => {
    onFiltersChange({
      ...filters,
      tag: filters.tag === tag ? undefined : tag,
      page: 1,
    });
  };

  const handleSearch = () => {
    onFiltersChange({
      ...filters,
      q: searchQuery.trim() || undefined,
      page: 1,
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.kind || filters.tag || filters.q || filters.locale;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="mr-1 h-4 w-4" />
              Effacer
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recherche */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Recherche</label>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher dans les contenus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Type de contenu */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type de contenu</label>
          <Tabs
            value={filters.kind || 'all'}
            onValueChange={(value) =>
              handleKindChange(value === 'all' ? undefined : value)
            }
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="ARTICLE">
                Articles ({stats.byKind.ARTICLE || 0})
              </TabsTrigger>
              <TabsTrigger value="VIDEO">
                Vidéos ({stats.byKind.VIDEO || 0})
              </TabsTrigger>
              <TabsTrigger value="STAT">
                Stats ({stats.byKind.STAT || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tags populaires */}
        {popularTags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags populaires</label>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.tag === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTagSelect(tag)}
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Langue */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Langue</label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!filters.locale ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                onFiltersChange({ ...filters, locale: undefined, page: 1 })
              }
            >
              Toutes
            </Badge>
            {Object.entries(stats.byLocale).map(([locale, count]) => (
              <Badge
                key={locale}
                variant={filters.locale === locale ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, locale, page: 1 })}
              >
                {locale.toUpperCase()} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Filtres actifs */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtres actifs</label>
            <div className="flex flex-wrap gap-2">
              {filters.kind && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.kind}
                  <button
                    onClick={() => handleKindChange(undefined)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.tag && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tag: {filters.tag}
                  <button
                    onClick={() => handleTagSelect(filters.tag!)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.q && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: {filters.q}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      onFiltersChange({ ...filters, q: undefined, page: 1 });
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.locale && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Langue: {filters.locale}
                  <button
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        locale: undefined,
                        page: 1,
                      })
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

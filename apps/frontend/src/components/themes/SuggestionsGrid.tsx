import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SuggestedItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, MapPin, Clock, Wrench } from 'lucide-react';

interface SuggestionsGridProps {
  suggestions: SuggestedItem[];
  isLoading?: boolean;
  title?: string;
}

const DIFFICULTY_LABELS = {
  faible: 'Facile',
  moyenne: 'Moyen',
  elevee: 'Difficile',
};

const DIFFICULTY_COLORS = {
  faible: 'bg-green-100 text-green-800',
  moyenne: 'bg-yellow-100 text-yellow-800',
  elevee: 'bg-red-100 text-red-800',
};

export function SuggestionsGrid({
  suggestions,
  isLoading = false,
  title = 'Suggestions IA',
}: SuggestionsGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl">💡</div>
        <h3 className="mb-2 text-xl font-semibold">Aucune suggestion</h3>
        <p className="text-muted-foreground">
          Aucune suggestion disponible pour ce thème
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge variant="secondary">
          {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-lg">
                  {item.name}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.repairDifficulty && (
                    <Badge
                      variant="secondary"
                      className={DIFFICULTY_COLORS[item.repairDifficulty]}
                    >
                      <Wrench className="mr-1 h-3 w-3" />
                      {DIFFICULTY_LABELS[item.repairDifficulty]}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Localisation et époque */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{item.country}</span>
                  </div>
                  {item.era && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.era}</span>
                    </div>
                  )}
                </div>

                {/* Raison écologique */}
                <div className="rounded-md bg-primary/10 p-3">
                  <p className="mb-1 text-sm font-medium text-primary">
                    💡 Pourquoi c'est écolo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.ecoReason}
                  </p>
                </div>

                {/* Matériaux */}
                {item.materials && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Matériaux
                    </p>
                    <p className="text-sm">{item.materials}</p>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags && item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Popularité */}
                {item.popularity && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Popularité</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            i < Math.round((item.popularity || 0) / 20)
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

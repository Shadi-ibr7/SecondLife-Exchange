import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyTheme, SuggestedItem } from '@/types';
import { formatWeekRange, isSameWeekRange } from '@/lib/date';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { SuggestionsGrid } from './SuggestionsGrid';
import { themesApi } from '@/lib/themes.api';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface ThemeCalendarProps {
  themes: WeeklyTheme[];
  isLoading?: boolean;
}

export function ThemeCalendar({
  themes,
  isLoading = false,
}: ThemeCalendarProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    SuggestedItem[]
  >([]);

  // Récupérer les suggestions du thème sélectionné
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['theme-suggestions', selectedThemeId],
    queryFn: () => themesApi.getThemeSuggestions(selectedThemeId!),
    enabled: !!selectedThemeId,
  });

  const handleThemeSelect = async (theme: WeeklyTheme) => {
    setSelectedThemeId(theme.id);
    setSelectedSuggestions(theme.suggestions || []);
  };

  const handleLoadMoreSuggestions = () => {
    if (
      suggestionsData &&
      suggestionsData.items.length > selectedSuggestions.length
    ) {
      setSelectedSuggestions(suggestionsData.items);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Calendrier des thèmes */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <Calendar className="h-6 w-6" />
          Calendrier des thèmes
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedThemeId === theme.id
                    ? 'shadow-lg ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => handleThemeSelect(theme)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-lg">
                        {theme.title}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatWeekRange(new Date(theme.startOfWeek))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {theme.isActive && (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Actif
                        </Badge>
                      )}
                      {theme.suggestions && theme.suggestions.length > 0 && (
                        <Badge variant="secondary">
                          {theme.suggestions.length} suggestions
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {theme.impactText && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {theme.impactText}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      Voir les suggestions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Suggestions du thème sélectionné */}
      {selectedThemeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SuggestionsGrid
            suggestions={selectedSuggestions}
            isLoading={suggestionsLoading}
            title={`Suggestions - ${themes.find((t) => t.id === selectedThemeId)?.title}`}
          />

          {suggestionsData &&
            suggestionsData.items.length > selectedSuggestions.length && (
              <div className="mt-6 text-center">
                <Button onClick={handleLoadMoreSuggestions} variant="outline">
                  Charger plus de suggestions
                </Button>
              </div>
            )}
        </motion.div>
      )}
    </div>
  );
}

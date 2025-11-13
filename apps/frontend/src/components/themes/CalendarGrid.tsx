'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarWeek, SuggestedItem } from '@/types';
import { addDays, format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { useUnsplashImages } from '@/hooks/useUnsplashImages';

interface CalendarGridProps {
  weeks: CalendarWeek[];
  selectedWeekIndex: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  isLoading?: boolean;
  suggestions?: SuggestedItem[];
}

export function CalendarGrid({
  weeks,
  selectedWeekIndex,
  onPreviousWeek,
  onNextWeek,
  isLoading = false,
  suggestions = [],
}: CalendarGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg bg-muted/50"
          />
        ))}
      </div>
    );
  }

  const selectedWeek = weeks[selectedWeekIndex];

  if (!selectedWeek) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/40 p-8 text-center text-muted-foreground">
        Aucun calendrier disponible pour le moment.
      </div>
    );
  }

  const weekStart = parseISO(selectedWeek.weekStart);
  const weekEnd = parseISO(selectedWeek.weekEnd);
  const today = new Date();

  const suggestionItems = suggestions.length
    ? suggestions
    : selectedWeek.theme
      ? [
          {
            id: `${selectedWeek.theme.id}-fallback`,
            themeId: selectedWeek.theme.id,
            name: selectedWeek.theme.title,
            category: 'GENERAL',
            country: '',
            ecoReason:
              "Les détails de l'impact seront bientôt disponibles pour ce thème.",
            tags: [],
            createdAt: selectedWeek.theme.startOfWeek,
          },
        ]
      : [];

  const dailyThemes = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(weekStart, index);
    const suggestion = suggestionItems[index % suggestionItems.length];
    const title =
      suggestion?.name ?? selectedWeek.theme?.title ?? 'Thème à définir';
    const description =
      suggestion?.ecoReason ??
      selectedWeek.theme?.description ??
      "Les suggestions seront générées prochainement par l'IA.";
    const impact =
      suggestion && 'popularity' in suggestion && suggestion.popularity
        ? `Popularité ${suggestion.popularity}%`
        : suggestion?.materials
          ? `Matériaux: ${suggestion.materials}`
          : 'Impact en cours de calcul';

    const query =
      suggestion?.name ??
      selectedWeek.theme?.title ??
      `${format(date, 'EEEE', { locale: fr })} sustainable`;

    return {
      id: suggestion?.id ?? `${selectedWeek.weekStart}-${index}`,
      dayLabel: capitalizeFirstLetter(format(date, 'EEEE', { locale: fr })),
      dateLabel: format(date, 'dd MMM', { locale: fr }),
      title,
      description,
      impact,
      query,
      href: selectedWeek.theme ? `/themes/${selectedWeek.theme.slug}` : '#',
      isActiveDay: selectedWeek.isActive && isSameDay(date, today),
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Calendar className="h-3.5 w-3.5" />
            Semaine sélectionnée
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            {selectedWeek.title || 'Thème à programmer'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Du{' '}
            <span className="font-medium">
              {format(weekStart, 'dd MMM', { locale: fr })}
            </span>{' '}
            au{' '}
            <span className="font-medium">
              {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousWeek}
            disabled={selectedWeekIndex === 0}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextWeek}
            disabled={selectedWeekIndex === weeks.length - 1}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dailyThemes.map((day, index) => (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <DailyThemeCard
              data={day}
              isCurrentWeekActive={selectedWeek.isActive}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary"></div>
          <span>Jour actuel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-400/60"></div>
          <span>Thème suggéré par l’IA</span>
        </div>
      </div>
    </div>
  );
}

interface DailyThemeCardProps {
  data: {
    id: string;
    dayLabel: string;
    dateLabel: string;
    title: string;
    description: string;
    impact: string;
    query: string;
    href: string;
    isActiveDay: boolean;
  };
  isCurrentWeekActive: boolean;
}

function DailyThemeCard({ data, isCurrentWeekActive }: DailyThemeCardProps) {
  const { data: images } = useUnsplashImages(`${data.title} sustainable`, 1, 1);
  const image = images?.[0];

  return (
    <Card
      className={`overflow-hidden border-2 transition-all duration-300 ${
        data.isActiveDay
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-border hover:border-primary/40'
      }`}
    >
      <div className="relative h-40 w-full overflow-hidden">
        {image ? (
          <Image
            src={image.urls.small}
            alt={image.alt_description || data.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={data.isActiveDay}
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="bg-white/10 text-white backdrop-blur">
            {data.dayLabel}
          </Badge>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur">
            {data.dateLabel}
          </span>
        </div>

        {data.isActiveDay && (
          <div className="absolute right-3 top-3">
            <Badge className="bg-primary text-white shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" />
              Aujourd’hui
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{data.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {data.description}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          <Leaf className="h-4 w-4" />
          <span className="line-clamp-1">{data.impact}</span>
        </div>

        <Button
          asChild
          className={data.isActiveDay ? 'w-full' : 'w-full'}
          variant={isCurrentWeekActive ? 'default' : 'outline'}
        >
          <Link href={data.href}>
            Explorer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function capitalizeFirstLetter(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

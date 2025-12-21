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
  Tag,
} from 'lucide-react';
import { useUnsplashImages } from '@/hooks/useUnsplashImages';
import { ITEM_CATEGORY_LABELS } from '@/lib/constants';

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

  // Un seul thème pour toute la semaine
  const weekTheme = selectedWeek.theme
    ? {
        id: selectedWeek.theme.id,
        title: selectedWeek.theme.title || 'Thème à venir',
        description:
          selectedWeek.theme.impactText ||
          selectedWeek.theme.description ||
          "Les suggestions seront générées prochainement par l'IA.",
        photoUrl: selectedWeek.theme.photoUrl || null,
        query: selectedWeek.theme.title || 'sustainable theme',
        href: `/themes/${selectedWeek.theme.slug}`,
        isActiveWeek: selectedWeek.isActive,
        targetCategories: selectedWeek.theme.targetCategories || [],
      }
    : {
        id: `coming-soon-${selectedWeek.weekStart}`,
        title: 'Thème à venir',
        description:
          'Ce thème sera généré automatiquement par l\'IA au début du mois.',
        photoUrl: null,
        query: 'sustainable future',
        href: '#',
        isActiveWeek: false,
        targetCategories: [],
      };

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

      {/* Affichage du thème de la semaine */}
      <motion.div
        key={weekTheme.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <WeeklyThemeCard
          data={weekTheme}
          weekStart={weekStart}
          weekEnd={weekEnd}
          isCurrentWeekActive={selectedWeek.isActive}
        />
      </motion.div>

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

interface WeeklyThemeCardProps {
  data: {
    id: string;
    title: string;
    description: string;
    photoUrl: string | null;
    query: string;
    href: string;
    isActiveWeek: boolean;
    targetCategories?: string[];
  };
  weekStart: Date;
  weekEnd: Date;
  isCurrentWeekActive: boolean;
}

function WeeklyThemeCard({
  data,
  weekStart,
  weekEnd,
  isCurrentWeekActive,
}: WeeklyThemeCardProps) {
  const { data: images } = useUnsplashImages(
    data.photoUrl ? '' : `${data.query} sustainable`,
    1,
    1
  );
  const image = data.photoUrl
    ? { urls: { small: data.photoUrl }, alt_description: data.title }
    : images?.[0];

  const today = new Date();
  const isCurrentWeek =
    weekStart <= today && weekEnd >= today && isCurrentWeekActive;

  return (
    <Card
      className={`overflow-hidden border-2 transition-all duration-300 ${
        isCurrentWeek
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-border hover:border-primary/40'
      }`}
    >
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        {image ? (
          <Image
            src={image.urls.small}
            alt={image.alt_description || data.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={isCurrentWeek}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          <Badge className="bg-white/10 text-white backdrop-blur w-fit">
            {format(weekStart, 'dd MMM', { locale: fr })} -{' '}
            {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
          </Badge>
          {isCurrentWeek && (
            <Badge className="bg-primary text-white shadow-sm w-fit">
              <Sparkles className="mr-1 h-3 w-3" />
              Semaine actuelle
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-2xl font-bold leading-tight mb-2">
            {data.title}
          </h3>
          {data.targetCategories && data.targetCategories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {data.targetCategories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="text-xs"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {ITEM_CATEGORY_LABELS[category] || category}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-base text-muted-foreground leading-relaxed">
            {data.description}
          </p>
        </div>

        {data.href !== '#' && (
          <Button
            asChild
            className="w-full"
            variant={isCurrentWeekActive ? 'default' : 'outline'}
            size="lg"
          >
            <Link href={data.href}>
              Explorer le thème
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarWeek } from '@/types';
import { format, parseISO, isSameWeek, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface CalendarGridProps {
  weeks: CalendarWeek[];
  currentWeek: number;
  isLoading?: boolean;
}

export function CalendarGrid({
  weeks,
  currentWeek,
  isLoading = false,
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

  const getWeekStatus = (week: CalendarWeek, index: number) => {
    const now = new Date();
    const weekStart = parseISO(week.weekStart);
    const weekEnd = parseISO(week.weekEnd);

    if (index === currentWeek) {
      return 'current';
    } else if (weekStart > now) {
      return 'future';
    } else {
      return 'past';
    }
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-primary text-primary-foreground';
    }

    switch (status) {
      case 'current':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'future':
        return 'bg-muted text-muted-foreground';
      case 'past':
        return 'bg-muted/50 text-muted-foreground/70';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Sparkles className="h-4 w-4" />;
    }

    switch (status) {
      case 'current':
        return <Clock className="h-4 w-4" />;
      case 'future':
        return <Calendar className="h-4 w-4" />;
      case 'past':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Calendrier des Thèmes
          </h2>
          <p className="text-muted-foreground">
            Découvrez les thèmes passés, actuels et à venir
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {weeks.length} semaines
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {weeks.map((week, index) => {
          const status = getWeekStatus(week, index);
          const isCurrentWeek = index === currentWeek;

          return (
            <motion.div
              key={week.weekStart}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className="group"
            >
              <Card
                className={`h-full transition-all duration-300 hover:shadow-lg ${
                  isCurrentWeek ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`rounded-lg p-2 ${getStatusColor(status, week.isActive)}`}
                    >
                      {getStatusIcon(status, week.isActive)}
                    </div>
                    <Badge
                      variant={week.isActive ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {status === 'current'
                        ? 'Actuel'
                        : status === 'future'
                          ? 'À venir'
                          : 'Passé'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <CardTitle className="line-clamp-2 text-lg font-semibold">
                      {week.title}
                    </CardTitle>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {format(parseISO(week.weekStart), 'dd MMM', {
                        locale: fr,
                      })}{' '}
                      -{' '}
                      {format(parseISO(week.weekEnd), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </div>
                  </div>

                  {week.theme && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {week.theme.description}
                      </div>

                      {week.isActive && (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Sparkles className="h-3 w-3" />
                          <span>Thème actif</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!week.theme && (
                    <div className="text-sm italic text-muted-foreground">
                      Aucun thème défini pour cette semaine
                    </div>
                  )}

                  <div className="pt-2">
                    {week.theme ? (
                      <Link href={`/themes/${week.theme.slug}`}>
                        <Button
                          variant={week.isActive ? 'default' : 'outline'}
                          size="sm"
                          className="w-full transition-transform group-hover:scale-105"
                        >
                          <ArrowRight className="mr-2 h-3 w-3" />
                          Voir les suggestions
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        Aucune suggestion
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary"></div>
          <span>Thème actif</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-blue-200 bg-blue-500/20"></div>
          <span>Semaine actuelle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-muted"></div>
          <span>Semaines passées/futures</span>
        </div>
      </div>
    </div>
  );
}


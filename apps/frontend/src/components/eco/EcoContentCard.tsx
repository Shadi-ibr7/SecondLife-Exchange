'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EcoContent } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ExternalLink,
  Calendar,
  Tag,
  FileText,
  Play,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface EcoContentCardProps {
  content: EcoContent;
  showEnrichButton?: boolean;
  onEnrich?: (id: string) => void;
  isEnriching?: boolean;
}

export function EcoContentCard({
  content,
  showEnrichButton = false,
  onEnrich,
  isEnriching = false,
}: EcoContentCardProps) {
  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'ARTICLE':
        return <FileText className="h-4 w-4" />;
      case 'VIDEO':
        return <Play className="h-4 w-4" />;
      case 'STAT':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'ARTICLE':
        return 'bg-blue-500';
      case 'VIDEO':
        return 'bg-red-500';
      case 'STAT':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'ARTICLE':
        return 'Article';
      case 'VIDEO':
        return 'Vidéo';
      case 'STAT':
        return 'Statistique';
      default:
        return kind;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`rounded p-1 ${getKindColor(content.kind)} text-white`}
                >
                  {getKindIcon(content.kind)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getKindLabel(content.kind)}
                </Badge>
                {content.locale && (
                  <Badge variant="outline" className="text-xs">
                    {content.locale.toUpperCase()}
                  </Badge>
                )}
              </div>
              <CardTitle className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {content.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Source */}
          {content.source && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Source:</span> {content.source}
            </div>
          )}

          {/* Résumé */}
          {content.summary ? (
            <p className="line-clamp-3 text-sm text-foreground">
              {content.summary}
            </p>
          ) : (
            <div className="text-sm italic text-muted-foreground">
              Aucun résumé disponible
              {showEnrichButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => onEnrich?.(content.id)}
                  disabled={isEnriching}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  {isEnriching ? 'Enrichissement...' : 'Enrichir'}
                </Button>
              )}
            </div>
          )}

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.tags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
              {content.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{content.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* KPIs */}
          {content.kpis && (
            <div className="space-y-1">
              {Object.entries(content.kpis).map(([key, value]) => (
                <div
                  key={key}
                  className="text-xs text-green-600 dark:text-green-400"
                >
                  <span className="font-medium">{key}:</span> {value as string}
                </div>
              ))}
            </div>
          )}

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {content.publishedAt
                ? formatDistanceToNow(new Date(content.publishedAt), {
                    addSuffix: true,
                    locale: fr,
                  })
                : 'Date inconnue'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1" size="sm">
              <Link href={`/discover/${content.id}`}>Voir le contenu</Link>
            </Button>
            {content.url && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EcoContent } from '@/types';
import { EcoContentCard } from './EcoContentCard';
import { FileText, RefreshCw, Plus } from 'lucide-react';

interface EcoContentGridProps {
  contents: EcoContent[];
  isLoading: boolean;
  onRefresh: () => void;
  showEnrichButton?: boolean;
  onEnrich?: (id: string) => void;
  enrichingId?: string;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
}

export function EcoContentGrid({
  contents,
  isLoading,
  onRefresh,
  showEnrichButton = false,
  onEnrich,
  enrichingId,
  onCreateNew,
  showCreateButton = false,
}: EcoContentGridProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contenus éco-éducatifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contenus éco-éducatifs
            </CardTitle>
            {showCreateButton && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Aucun contenu trouvé
            </h3>
            <p className="mb-4 text-muted-foreground">
              Aucun contenu éco-éducatif ne correspond à vos critères de
              recherche.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              {showCreateButton && (
                <Button onClick={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter du contenu
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contenus éco-éducatifs
            <Badge variant="secondary" className="ml-2">
              {contents.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {showCreateButton && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            )}
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {contents.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <EcoContentCard
                content={content}
                showEnrichButton={showEnrichButton}
                onEnrich={onEnrich}
                isEnriching={enrichingId === content.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}

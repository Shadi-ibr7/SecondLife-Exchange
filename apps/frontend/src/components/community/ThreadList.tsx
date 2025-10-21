'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Thread } from '@/types';
import { ThreadCard } from './ThreadCard';
import { MessageSquare, RefreshCw, Plus } from 'lucide-react';

interface ThreadListProps {
  threads: Thread[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
}

export function ThreadList({
  threads,
  isLoading,
  onRefresh,
  onCreateNew,
  showCreateButton = false,
}: ThreadListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (threads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Discussions
            </CardTitle>
            {showCreateButton && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle discussion
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Aucune discussion trouvée
            </h3>
            <p className="mb-4 text-muted-foreground">
              Aucune discussion ne correspond à vos critères de recherche.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              {showCreateButton && (
                <Button onClick={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une discussion
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
            <MessageSquare className="h-5 w-5" />
            Discussions
            <Badge variant="secondary" className="ml-2">
              {threads.length}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {showCreateButton && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle discussion
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
          {threads.map((thread, index) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ThreadCard thread={thread} />
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}


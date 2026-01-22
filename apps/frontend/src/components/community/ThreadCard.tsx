/**
 * FICHIER: components/community/ThreadCard.tsx
 *
 * DESCRIPTION:
 * Composant pour afficher une carte de discussion (thread) selon le design Figma.
 * Affiche la catégorie, le badge "Tendance", le titre, l'extrait, les stats et l'auteur.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { Thread } from '@/types';
import { THREAD_CATEGORY_LABELS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ThreadCardProps {
  thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const categoryLabel = thread.category
    ? THREAD_CATEGORY_LABELS[thread.category]
    : null;

  const timeAgo = formatDistanceToNow(new Date(thread.createdAt), {
    addSuffix: false,
    locale: fr,
  });

  // Extraire un extrait du premier post (simulé pour l'instant)
  // TODO: Récupérer le premier post pour avoir un vrai extrait
  const excerpt = thread.title.length > 100
    ? thread.title.substring(0, 100) + '...'
    : thread.title;

  return (
    <Link href={`/thread/${thread.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          <CardContent className="p-6">
            {/* En-tête avec catégories et badge Tendance */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {categoryLabel && (
                  <Badge variant="secondary" className="text-xs">
                    {categoryLabel}
                  </Badge>
                )}
                {thread.isTrending && (
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground text-xs flex items-center gap-1"
                  >
                    <TrendingUp className="h-3 w-3" />
                    Tendance
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Il y a {timeAgo}
              </span>
            </div>

            {/* Titre */}
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">
              {thread.title}
            </h3>

            {/* Extrait */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {excerpt}
            </p>

            {/* Stats et auteur */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{thread.postsCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span>{thread.likesCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  par {thread.author.displayName}
                </span>
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={thread.author.avatarUrl}
                    alt={thread.author.displayName}
                  />
                  <AvatarFallback>
                    {thread.author.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

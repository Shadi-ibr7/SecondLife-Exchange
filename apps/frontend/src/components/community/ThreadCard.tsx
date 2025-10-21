'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Thread } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MessageSquare,
  Calendar,
  User,
  Hash,
  Tag,
  Package,
  FileText,
} from 'lucide-react';

interface ThreadCardProps {
  thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'THEME':
        return <Calendar className="h-4 w-4" />;
      case 'CATEGORY':
        return <Tag className="h-4 w-4" />;
      case 'ITEM':
        return <Package className="h-4 w-4" />;
      case 'GENERAL':
        return <FileText className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'THEME':
        return 'bg-blue-500';
      case 'CATEGORY':
        return 'bg-green-500';
      case 'ITEM':
        return 'bg-purple-500';
      case 'GENERAL':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'THEME':
        return 'Thème';
      case 'CATEGORY':
        return 'Catégorie';
      case 'ITEM':
        return 'Objet';
      case 'GENERAL':
        return 'Général';
      default:
        return scope;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Link href={`/thread/${thread.id}`}>
        <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`rounded p-1 ${getScopeColor(thread.scope)} text-white`}
                  >
                    {getScopeIcon(thread.scope)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getScopeLabel(thread.scope)}
                  </Badge>
                  {thread.scopeRef && (
                    <Badge variant="outline" className="text-xs">
                      {thread.scopeRef}
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                  {thread.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Auteur */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={thread.author.avatarUrl}
                  alt={thread.author.displayName}
                />
                <AvatarFallback className="text-xs">
                  {thread.author.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {thread.author.displayName}
                  </span>
                </div>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>
                    {thread.postsCount} message
                    {thread.postsCount > 1 ? 's' : ''}
                  </span>
                </div>
                {thread.lastPostAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Dernière activité{' '}
                      {formatDistanceToNow(new Date(thread.lastPostAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Date de création */}
            <div className="text-xs text-muted-foreground">
              Créé{' '}
              {formatDistanceToNow(new Date(thread.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}


'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth';
import { MessageSquare, Edit, Trash2, Reply, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onReply?: (post: Post) => void;
  showActions?: boolean;
}

export function PostCard({
  post,
  onEdit,
  onDelete,
  onReply,
  showActions = true,
}: PostCardProps) {
  const { user } = useAuthStore();
  const isOwner = user?.id === post.authorId;
  const isAdmin = user?.roles === 'ADMIN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={post.author.avatarUrl}
                alt={post.author.displayName}
              />
              <AvatarFallback>
                {post.author.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Contenu */}
            <div className="min-w-0 flex-1">
              {/* En-tête */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {post.author.displayName}
                  </span>
                  {post.isEdited && (
                    <Badge variant="outline" className="text-xs">
                      Modifié
                    </Badge>
                  )}
                </div>

                {showActions && (isOwner || isAdmin) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && (
                        <DropdownMenuItem onClick={() => onEdit?.(post)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      {(isOwner || isAdmin) && (
                        <DropdownMenuItem
                          onClick={() => onDelete?.(post)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Contenu du post */}
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap break-words">
                  {post.content}
                </p>
              </div>

              {/* Métadonnées */}
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  {post.editedAt && (
                    <span>
                      Modifié{' '}
                      {formatDistanceToNow(new Date(post.editedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  )}
                  {post.repliesCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.repliesCount} réponse
                      {post.repliesCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReply?.(post)}
                      className="h-8 px-2 text-xs"
                    >
                      <Reply className="mr-1 h-3 w-3" />
                      Répondre
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


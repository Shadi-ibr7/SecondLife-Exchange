/**
 * FICHIER: components/community/PostBubble.tsx
 *
 * DESCRIPTION:
 * Composant pour afficher un message (post) dans une bulle de chat.
 * Style différent selon si c'est le message de l'utilisateur actuel ou d'un autre.
 */

'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare } from 'lucide-react';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';
import { communityApi } from '@/lib/community.api';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PostBubbleProps {
  post: Post;
  threadId: string;
}

export function PostBubble({ post, threadId }: PostBubbleProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isLiking, setIsLiking] = useState(false);
  const isOwnPost = user?.id === post.authorId;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: false,
    locale: fr,
  });

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Vous devez être connecté pour liker');
      return;
    }

    setIsLiking(true);
    try {
      const result = await communityApi.togglePostLike(threadId, post.id);
      
      // Mettre à jour le cache React Query
      queryClient.setQueryData(
        ['thread-posts', threadId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((p: Post) =>
              p.id === post.id
                ? { ...p, isLiked: result.isLiked, likesCount: result.likesCount }
                : p
            ),
          };
        }
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors du like');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 mb-4',
        isOwnPost ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {!isOwnPost && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={post.author.avatarUrl}
            alt={post.author.displayName}
          />
          <AvatarFallback>
            {post.author.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bulle de message */}
      <div
        className={cn(
          'flex-1 max-w-[80%]',
          isOwnPost && 'flex flex-col items-end'
        )}
      >
        {/* Nom et heure */}
        <div
          className={cn(
            'flex items-center gap-2 mb-1 text-xs text-muted-foreground',
            isOwnPost && 'flex-row-reverse'
          )}
        >
          <span className="font-medium">{post.author.displayName}</span>
          <span>•</span>
          <span>
            {new Date(post.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Contenu */}
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            isOwnPost
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{post.content}</p>
        </div>

        {/* Actions (likes, réponses) */}
        <div
          className={cn(
            'flex items-center gap-4 mt-2 text-xs text-muted-foreground',
            isOwnPost && 'flex-row-reverse'
          )}
        >
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              'flex items-center gap-1.5 hover:text-primary transition-colors',
              post.isLiked && 'text-primary'
            )}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                post.isLiked && 'fill-current'
              )}
            />
            <span>{post.likesCount}</span>
          </button>
          {post.repliesCount > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>{post.repliesCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Avatar pour les messages de l'utilisateur */}
      {isOwnPost && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={post.author.avatarUrl}
            alt={post.author.displayName}
          />
          <AvatarFallback>
            {post.author.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

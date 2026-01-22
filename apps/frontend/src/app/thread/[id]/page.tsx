/**
 * FICHIER: app/thread/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détail d'un thread avec bulles de chat selon le design Figma.
 * Affiche les messages en bulles de chat (gauche/droite selon l'auteur).
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/common/Container';
import { PostBubble } from '@/components/community/PostBubble';
import { communityApi } from '@/lib/community.api';
import { useAuthStore } from '@/store/auth';
import { ListPostsParams, CreatePostDto } from '@/types';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Send,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { THREAD_CATEGORY_LABELS } from '@/lib/constants';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const threadId = params.id as string;

  const [filters] = useState<ListPostsParams>({
    page: 1,
    limit: 50, // Afficher plus de messages pour une discussion
  });
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer le thread
  const {
    data: thread,
    isLoading: threadLoading,
    error: threadError,
  } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => communityApi.getThread(threadId),
    retry: false,
  });

  // Récupérer les posts
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ['thread-posts', threadId, filters],
    queryFn: () => communityApi.listPosts(threadId, filters),
    retry: false,
  });

  // Mutation pour créer un post
  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostDto) =>
      communityApi.createPost(threadId, data),
    onSuccess: () => {
      setNewPostContent('');
      queryClient.invalidateQueries({ queryKey: ['thread-posts', threadId] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      toast.success('Message envoyé !');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de l\'envoi du message'
      );
    },
  });

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour participer');
      router.push(`/login?next=/thread/${threadId}`);
      return;
    }

    if (!newPostContent.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPostMutation.mutateAsync({
        content: newPostContent.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCreatePost();
    }
  };

  if (threadLoading || postsLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (threadError || !thread) {
    return (
      <Container className="py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Discussion non trouvée</p>
          <Button onClick={() => router.push('/community')}>
            Retour à la communauté
          </Button>
        </div>
      </Container>
    );
  }

  const categoryLabel = thread.category
    ? THREAD_CATEGORY_LABELS[thread.category]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        {/* En-tête avec retour et badges */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <div className="flex items-center gap-2 mb-4">
            {categoryLabel && (
              <Badge variant="secondary">{categoryLabel}</Badge>
            )}
            {thread.isTrending && (
              <Badge
                variant="default"
                className="bg-primary text-primary-foreground flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Tendance
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{thread.title}</h1>
        </div>

        {/* Zone de messages */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {postsError && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">
                  Erreur lors du chargement des messages
                </p>
              </div>
            )}

            {postsData && postsData.items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucun message pour le moment. Soyez le premier à participer !
                </p>
              </div>
            )}

            {postsData && postsData.items.length > 0 && (
              <div className="space-y-4">
                {postsData.items.map((post) => (
                  <PostBubble key={post.id} post={post} threadId={threadId} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone de réponse */}
        {isAuthenticated && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Écrivez votre réponse..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[100px] resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    disabled={isSubmitting || !newPostContent.trim()}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Répondre
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  Appuyez sur Cmd/Ctrl + Entrée pour envoyer
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAuthenticated && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté pour participer à la discussion
              </p>
              <Button onClick={() => router.push(`/login?next=/thread/${threadId}`)}>
                Se connecter
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
}

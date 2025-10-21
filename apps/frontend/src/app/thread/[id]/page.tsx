'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/common/Container';
import { PostList } from '@/components/community/PostList';
import { communityApi } from '@/lib/community.api';
import { useAuthStore } from '@/store/auth';
import { ListPostsParams, Post, CreatePostDto } from '@/types';
import { toast } from 'react-hot-toast';
import { MessageSquare, ArrowLeft, Send, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const threadId = params.id as string;

  const [filters, setFilters] = useState<ListPostsParams>({
    page: 1,
    limit: 20,
  });
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');

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
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['thread-posts', threadId, filters],
    queryFn: () => communityApi.listPosts(threadId, filters),
    retry: false,
  });

  const handleRefresh = () => {
    refetchPosts();
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour participer');
      return;
    }

    if (!newPostContent.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData: CreatePostDto = {
        content: newPostContent.trim(),
      };

      await communityApi.createPost(threadId, postData);
      setNewPostContent('');
      toast.success('Message publié !');

      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['thread-posts'] });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPost = async (post: Post) => {
    if (!editContent.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    try {
      await communityApi.updatePost(threadId, post.id, {
        content: editContent.trim(),
      });

      setEditingPost(null);
      setEditContent('');
      toast.success('Message modifié !');

      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['thread-posts'] });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      await communityApi.deletePost(threadId, post.id);
      toast.success('Message supprimé !');

      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['thread-posts'] });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleReply = (post: Post) => {
    setNewPostContent(`@${post.author.displayName} `);
    // TODO: Focus sur le champ de saisie
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  if (threadLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Container>
          <div className="py-8">
            <div className="h-96 animate-pulse rounded-lg bg-muted/50" />
          </div>
        </Container>
      </div>
    );
  }

  if (threadError || !thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Container>
          <div className="py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Discussion non trouvée
              </h1>
              <p className="mb-6 text-muted-foreground">
                Cette discussion n'existe pas ou a été supprimée
              </p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Container>
        <div className="py-8">
          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </motion.div>

          {/* En-tête du thread */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {thread.scope}
                      </Badge>
                      {thread.scopeRef && (
                        <Badge variant="outline" className="text-xs">
                          {thread.scopeRef}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mb-4 text-2xl font-bold text-foreground">
                      {thread.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={thread.author.avatarUrl}
                      alt={thread.author.displayName}
                    />
                    <AvatarFallback>
                      {thread.author.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {thread.author.displayName}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Créé{' '}
                      {formatDistanceToNow(new Date(thread.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {thread.postsCount} message
                    {thread.postsCount > 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Liste des posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <PostList
              posts={postsData?.items || []}
              isLoading={postsLoading}
              onRefresh={handleRefresh}
              onEdit={startEdit}
              onDelete={handleDeletePost}
              onReply={handleReply}
              showActions={isAuthenticated}
            />
          </motion.div>

          {/* Formulaire de nouveau post */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {editingPost ? 'Modifier le message' : 'Nouveau message'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingPost ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Modification du message de{' '}
                        {editingPost.author.displayName}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Votre message..."
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleEditPost(editingPost)}
                          disabled={isSubmitting}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        <Button onClick={cancelEdit} variant="outline">
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="Participez à la discussion..."
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleCreatePost();
                            }
                          }}
                        />
                        <Button
                          onClick={handleCreatePost}
                          disabled={isSubmitting || !newPostContent.trim()}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {isSubmitting ? 'Publication...' : 'Publier'}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Appuyez sur Ctrl+Entrée pour publier rapidement
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Message pour les utilisateurs non connectés */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    Connectez-vous pour participer
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Vous devez être connecté pour publier des messages
                  </p>
                  <Button asChild>
                    <a href="/login">Se connecter</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  );
}


/**
 * FICHIER: community/posts/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un post de la communauté pour l'admin.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  User,
  Calendar,
  Trash2,
  MessageCircle,
  Reply,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['admin-post-detail', id],
    queryFn: () => adminApi.getPostById(id),
  });

  const handleDelete = async () => {
    try {
      await adminApi.deletePost(id);
      toast.success('Post supprimé avec succès');
      router.push(`/${ADMIN_BASE_PATH}/community`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Détails du post</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Post non trouvé</h1>
          <p className="text-muted-foreground">Le post demandé n'existe pas</p>
          <Button onClick={() => router.push(`/${ADMIN_BASE_PATH}/community`)} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium mb-1">Détails du post</h1>
            <p className="text-muted-foreground">
              Créé le {format(new Date(post.createdAt), 'PPpp', { locale: fr })}
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Contenu du post
              </CardTitle>
              <CardDescription>Message publié par l'utilisateur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              </div>

              <Separator />

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4" />
                  <span>{post._count?.replies || 0} réponse(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Publié le {format(new Date(post.createdAt), 'PPpp', { locale: fr })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thread Link */}
          {post.thread && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Thread parent
                </CardTitle>
                <CardDescription>Thread auquel ce post appartient</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{post.thread.title}</h4>
                    <Badge variant="secondary" className="mt-2">
                      {post.thread.scope}
                    </Badge>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/community/threads/${post.thread.id}`}>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Voir le thread
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Replies */}
          {post.replies && post.replies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Reply className="w-5 h-5" />
                  Réponses ({post.replies.length})
                </CardTitle>
                <CardDescription>Réponses à ce post</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {post.replies.map((reply: any) => (
                    <div key={reply.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.author?.avatarUrl || undefined} />
                          <AvatarFallback>
                            {reply.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{reply.author?.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(reply.createdAt), 'PPp', { locale: fr })}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author */}
          <Card>
            <CardHeader>
              <CardTitle>Auteur du post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.author ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.author.avatarUrl || undefined} />
                      <AvatarFallback>
                        {post.author.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{post.author.displayName}</div>
                      <div className="text-sm text-muted-foreground">{post.author.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/${ADMIN_BASE_PATH}/users/${post.author.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le profil
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Auteur inconnu</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{post.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span>{format(new Date(post.createdAt), 'PP', { locale: fr })}</span>
              </div>
              {post.updatedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dernière mise à jour</span>
                  <span>{format(new Date(post.updatedAt), 'PP', { locale: fr })}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nombre de réponses</span>
                <Badge variant="secondary">{post._count?.replies || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer le post
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le post</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce post ? Cette action est
              irréversible et supprimera également toutes les réponses associées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Le post de <strong>{post.author?.displayName}</strong> sera supprimé avec ses{' '}
              {post._count?.replies || 0} réponse(s).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


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
          <h1 className="admin-page-title">Détails du post</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Post non trouvé</h1>
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
            <h1 className="admin-page-title">Détails du post</h1>
            <p className="admin-page-description">
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
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <MessageSquare className="w-5 h-5" />
                Contenu du post
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Message publié par l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
              </div>

              <Separator className="bg-border" />

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
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                  <MessageCircle className="w-5 h-5" />
                  Thread parent
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">
                  Thread auquel ce post appartient
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{post.thread.title}</h4>
                    <Badge className="mt-2 bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                      {post.thread.scope}
                    </Badge>
                  </div>
                  <Button variant="outline" className="border-border" asChild>
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
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                  <Reply className="w-5 h-5" />
                  Réponses ({post.replies.length})
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">
                  Réponses à ce post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
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
                          <div className="font-medium text-sm text-foreground">
                            {reply.author?.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(reply.createdAt), 'PPp', { locale: fr })}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
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
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Auteur du post</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
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
                      <div className="font-medium text-foreground">{post.author.displayName}</div>
                      <div className="text-sm text-muted-foreground">{post.author.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-border" asChild>
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
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Informations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs text-foreground">{post.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span className="text-foreground">
                  {format(new Date(post.createdAt), 'PP', { locale: fr })}
                </span>
              </div>
              {post.updatedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dernière mise à jour</span>
                  <span className="text-foreground">
                    {format(new Date(post.updatedAt), 'PP', { locale: fr })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nombre de réponses</span>
                <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                  {post._count?.replies || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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


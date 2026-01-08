/**
 * FICHIER: community/threads/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détails d'un thread de la communauté pour l'admin.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  User,
  Calendar,
  Trash2,
  Users,
  MessageSquare,
  Globe,
  Package,
  Sparkles,
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

const SCOPE_LABELS: Record<string, { label: string; icon: any }> = {
  GLOBAL: { label: 'Global', icon: Globe },
  ITEM: { label: 'Objet', icon: Package },
  USER: { label: 'Utilisateur', icon: User },
  THEME: { label: 'Thème', icon: Sparkles },
};

export default function ThreadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { data: thread, isLoading } = useQuery({
    queryKey: ['admin-thread-detail', id],
    queryFn: () => adminApi.getThreadById(id),
  });

  const handleDeleteThread = async () => {
    try {
      await adminApi.deleteThread(id);
      toast.success('Thread supprimé avec succès');
      router.push(`/${ADMIN_BASE_PATH}/community`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    try {
      await adminApi.deletePost(deletePostId);
      toast.success('Post supprimé avec succès');
      setDeletePostId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-thread-detail', id] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getScopeBadge = (scope: string) => {
    const config = SCOPE_LABELS[scope] || { label: scope, icon: Globe };
    const Icon = config.icon;
    return (
      <Badge className="flex items-center gap-1 w-fit bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Détails du thread</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Thread non trouvé</h1>
          <p className="text-muted-foreground">Le thread demandé n'existe pas</p>
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
            <div className="flex items-center gap-3">
              <h1 className="admin-page-title">Détails du thread</h1>
              {getScopeBadge(thread.scope)}
            </div>
            <p className="admin-page-description">
              Créé le {format(new Date(thread.createdAt), 'PPpp', { locale: fr })}
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
          {/* Thread Info */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <MessageCircle className="w-5 h-5" />
                {thread.title}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Informations sur le thread
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {thread.description && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {thread.description}
                  </p>
                </div>
              )}

              <Separator className="bg-border" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Type</h3>
                  {getScopeBadge(thread.scope)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Nombre de posts</h3>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {thread._count?.posts || 0} posts
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <MessageSquare className="w-5 h-5" />
                Posts ({thread.posts?.length || 0})
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Liste des posts dans ce thread
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {thread.posts && thread.posts.length > 0 ? (
                <div className="space-y-4">
                  {thread.posts.map((post: any) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author?.avatarUrl || undefined} />
                            <AvatarFallback>
                              {post.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{post.author?.displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(post.createdAt), 'PPp', { locale: fr })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {post._count?.replies || 0} réponses
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletePostId(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun post dans ce thread</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-base font-normal text-foreground">Auteur du thread</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={thread.author?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {thread.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{thread.author?.displayName}</div>
                  <div className="text-sm text-muted-foreground">{thread.author?.email}</div>
                </div>
              </div>
              <Button variant="outline" className="w-full border-border" asChild>
                <Link href={`/${ADMIN_BASE_PATH}/users/${thread.author?.id}`}>
                  <User className="w-4 h-4 mr-2" />
                  Voir le profil
                </Link>
              </Button>
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
                <span className="font-mono text-xs text-foreground">{thread.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scope</span>
                {getScopeBadge(thread.scope)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span className="text-foreground">
                  {format(new Date(thread.createdAt), 'PP', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nombre de posts</span>
                <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                  {thread._count?.posts || 0}
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
                Supprimer le thread
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Thread Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le thread</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce thread ? Cette action est
              irréversible et supprimera également tous les posts associés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{thread.title}</strong> sera supprimé avec ses {thread._count?.posts || 0}{' '}
              post(s).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteThread}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Dialog */}
      <Dialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le post</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce post ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePostId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


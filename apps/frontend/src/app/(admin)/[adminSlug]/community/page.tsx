/**
 * FICHIER: community/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion de la communauté (threads et posts) pour l'admin.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Trash2, Eye, Users } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminCommunityPage() {
  const queryClient = useQueryClient();
  const [threadsPage, setThreadsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  // Threads data
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['admin-threads', threadsPage, scopeFilter],
    queryFn: () =>
      adminApi.getThreads(threadsPage, 20, scopeFilter === 'all' ? undefined : scopeFilter),
  });

  // Posts data
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts', postsPage],
    queryFn: () => adminApi.getPosts(postsPage, 20),
  });

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce thread ?')) return;
    try {
      await adminApi.deleteThread(threadId);
      toast.success('Thread supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;
    try {
      await adminApi.deletePost(postId);
      toast.success('Post supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getScopeBadge = (scope: string) => {
    const config: Record<string, { variant: 'default' | 'secondary'; label: string }> = {
      GLOBAL: { variant: 'default', label: 'Global' },
      ITEM: { variant: 'secondary', label: 'Objet' },
      USER: { variant: 'secondary', label: 'Utilisateur' },
      THEME: { variant: 'secondary', label: 'Thème' },
    };
    const { variant, label } = config[scope] || { variant: 'default' as const, label: scope };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="admin-page-title">Gestion de la communauté</h1>
        <p className="admin-page-description">Gérer les threads et posts de la communauté</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total threads</CardDescription>
            <CardTitle className="text-2xl">{threadsData?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total posts</CardDescription>
            <CardTitle className="text-2xl">{postsData?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Threads globaux</CardDescription>
            <CardTitle className="text-2xl">
              {threadsData?.threads?.filter((t: any) => t.scope === 'GLOBAL').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Posts récents (30j)</CardDescription>
            <CardTitle className="text-2xl">
              {postsData?.posts?.filter(
                (p: any) =>
                  new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="threads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threads">
            <MessageCircle className="w-4 h-4 mr-2" />
            Threads
          </TabsTrigger>
          <TabsTrigger value="posts">
            <Users className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
        </TabsList>

        {/* Threads Tab */}
        <TabsContent value="threads" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrer par scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="GLOBAL">Global</SelectItem>
                    <SelectItem value="ITEM">Objet</SelectItem>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="THEME">Thème</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Threads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des threads</CardTitle>
              <CardDescription>
                {threadsData?.total || 0} thread{threadsData?.total !== 1 ? 's' : ''} au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threadsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : threadsData?.threads?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun thread trouvé</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Auteur</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {threadsData?.threads?.map((thread: any) => (
                        <TableRow key={thread.id}>
                          <TableCell>
                            <div className="font-medium">{thread.title}</div>
                            {thread.scopeRef && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {thread.scopeRef}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={thread.author?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {thread.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {thread.author?.displayName || '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {thread.author?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getScopeBadge(thread.scope)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageCircle className="w-4 h-4" />
                              {thread._count?.posts || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(thread.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/${ADMIN_BASE_PATH}/community/threads/${thread.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteThread(thread.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {threadsData && threadsData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {threadsPage} sur {threadsData.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setThreadsPage((p) => Math.max(1, p - 1))}
                          disabled={threadsPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setThreadsPage((p) => Math.min(threadsData.totalPages, p + 1))
                          }
                          disabled={threadsPage === threadsData.totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des posts</CardTitle>
              <CardDescription>
                {postsData?.total || 0} post{postsData?.total !== 1 ? 's' : ''} au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : postsData?.posts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun post trouvé</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contenu</TableHead>
                        <TableHead>Auteur</TableHead>
                        <TableHead>Thread</TableHead>
                        <TableHead>Réponses</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {postsData?.posts?.map((post: any) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="max-w-md">
                              <p className="line-clamp-2 text-sm">{post.content}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={post.author?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {post.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {post.author?.displayName || '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {post.author?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium text-sm line-clamp-1">
                                {post.thread?.title || '-'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getScopeBadge(post.thread?.scope || 'GLOBAL')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageCircle className="w-4 h-4" />
                              {post._count?.replies || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                            {post.editedAt && (
                              <div className="text-xs text-muted-foreground">Édité</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/${ADMIN_BASE_PATH}/community/posts/${post.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {postsData && postsData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {postsPage} sur {postsData.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                          disabled={postsPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPostsPage((p) => Math.min(postsData.totalPages, p + 1))}
                          disabled={postsPage === postsData.totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


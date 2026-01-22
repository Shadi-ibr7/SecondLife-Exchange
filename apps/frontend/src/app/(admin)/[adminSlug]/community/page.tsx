'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Trash2, Eye, Users, Search, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { THREAD_CATEGORY_LABELS } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { ResponsiveTable } from '@/components/admin/ResponsiveTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function CommunityStatsCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="h-auto min-h-[90px]">
      <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
        <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-4 sm:leading-5">
          {title}
        </p>
        <p className="text-xl sm:text-2xl font-normal text-foreground leading-7 sm:leading-8">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function AdminCommunityPage() {
  const queryClient = useQueryClient();
  const [threadsPage, setThreadsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Threads data
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['admin-threads', threadsPage, scopeFilter, search],
    queryFn: () =>
      adminApi.getThreads(threadsPage, 20, scopeFilter === 'all' ? undefined : scopeFilter),
  });

  // Posts data
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts', postsPage, search],
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
    const config: Record<string, { className: string; label: string }> = {
      GLOBAL: { className: 'bg-[rgba(45,90,69,0.1)] text-[#2d5a45]', label: 'Global' },
      ITEM: { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: 'Objet' },
      USER: { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: 'Utilisateur' },
      THEME: { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: 'Thème' },
    };
    const { className, label } = config[scope] || { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: scope };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${className}`}>
        {label}
      </span>
    );
  };

  // Calculate stats
  const threads = threadsData?.threads || [];
  const posts = postsData?.posts || [];
  const totalThreads = threadsData?.total || 0;
  const totalPosts = postsData?.total || 0;
  const globalThreads = threads.filter((t: any) => t.scope === 'GLOBAL').length;
  const recentPosts = posts.filter(
    (p: any) => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="admin-page-title">Gestion de la communauté</h1>
        <p className="admin-page-description">Gérer les threads et posts de la communauté</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CommunityStatsCard title="Total threads" value={totalThreads} />
        <CommunityStatsCard title="Total posts" value={totalPosts} />
        <CommunityStatsCard title="Threads globaux" value={globalThreads} />
        <CommunityStatsCard title="Posts récents (30j)" value={recentPosts} />
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
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[90.293px]">
            <CardContent className="p-0 flex items-center gap-4 h-[39.996px]">
              <div className="flex-1 relative h-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un thread..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setThreadsPage(1);
                  }}
                  className="pl-10 h-full bg-input-background border-border text-foreground"
                />
              </div>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-[200px] h-full bg-input-background border-border text-foreground">
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
            </CardContent>
          </Card>

          {/* Threads Table */}
          <Card className="h-auto min-h-[400px] sm:min-h-[500px]">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 h-full flex flex-col">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-normal text-foreground mb-1">Liste des threads</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                  {totalThreads} thread{totalThreads !== 1 ? 's' : ''} au total
                </p>
              </div>
              {threadsLoading ? (
                <div className="text-center py-12">
                  <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d]">Chargement...</p>
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-[#6f6f73] dark:text-[#9a9a9d]" />
                  <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d]">Aucun thread trouvé</p>
                </div>
              ) : (
                <ResponsiveTable
                  headers={[
                    { key: 'title', label: 'Titre' },
                    { key: 'category', label: 'Catégorie' },
                    { key: 'author', label: 'Auteur' },
                    { key: 'scope', label: 'Scope' },
                    { key: 'posts', label: 'Posts' },
                    { key: 'likes', label: 'Likes' },
                    { key: 'date', label: 'Date' },
                    { key: 'actions', label: 'Actions', align: 'right' },
                  ]}
                  rows={threads.map((thread: any) => ({
                    key: thread.id,
                    cells: [
                      {
                        key: 'title',
                        content: (
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                                {thread.title}
                              </p>
                              {thread.isTrending && (
                                <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Tendances
                                </Badge>
                              )}
                            </div>
                            {thread.scopeRef && (
                              <p className="text-xs text-muted-foreground">Ref: {thread.scopeRef}</p>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: 'category',
                        content: thread.category ? (
                          <Badge variant="outline" className="text-xs">
                            {THREAD_CATEGORY_LABELS[thread.category as keyof typeof THREAD_CATEGORY_LABELS] || thread.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        ),
                      },
                      {
                        key: 'author',
                        content: (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={thread.author?.avatarUrl || undefined} />
                              <AvatarFallback>
                                {thread.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                                {thread.author?.displayName || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">{thread.author?.email}</p>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'scope',
                        content: getScopeBadge(thread.scope || 'GLOBAL'),
                      },
                      {
                        key: 'posts',
                        content: (
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {thread._count?.posts || 0}
                          </p>
                        ),
                      },
                      {
                        key: 'likes',
                        content: (
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {thread.likesCount || 0}
                          </p>
                        ),
                      },
                      {
                        key: 'date',
                        content: (
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {format(new Date(thread.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        ),
                      },
                      {
                        key: 'actions',
                        content: (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              asChild
                            >
                              <Link href={`/${ADMIN_BASE_PATH}/community/threads/${thread.id}`}>
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              onClick={() => handleDeleteThread(thread.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ),
                      },
                    ],
                  }))}
                />
              )}

              {/* Pagination */}
              {threadsData && threadsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
                  <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                    Page {threadsPage} sur {threadsData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setThreadsPage((p) => Math.max(1, p - 1))}
                      disabled={threadsPage === 1}
                      className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setThreadsPage((p) => Math.min(threadsData.totalPages, p + 1))}
                      disabled={threadsPage === threadsData.totalPages}
                      className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {/* Filters */}
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[90.293px]">
            <CardContent className="p-0 flex items-center gap-4 h-[39.996px]">
              <div className="flex-1 relative h-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un post..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPostsPage(1);
                  }}
                  className="pl-10 h-full bg-input-background border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Posts Table */}
          <Card className="h-auto min-h-[400px] sm:min-h-[500px]">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 h-full flex flex-col">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-normal text-foreground mb-1">Liste des posts</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                  {totalPosts} post{totalPosts !== 1 ? 's' : ''} au total
                </p>
              </div>
              {postsLoading ? (
                <div className="text-center py-12">
                  <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d]">Chargement...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-[#6f6f73] dark:text-[#9a9a9d]" />
                  <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d]">Aucun post trouvé</p>
                </div>
              ) : (
                <ResponsiveTable
                  headers={[
                    { key: 'content', label: 'Contenu' },
                    { key: 'author', label: 'Auteur' },
                    { key: 'thread', label: 'Thread' },
                    { key: 'replies', label: 'Réponses' },
                    { key: 'date', label: 'Date' },
                    { key: 'actions', label: 'Actions', align: 'right' },
                  ]}
                  rows={posts.map((post: any) => ({
                    key: post.id,
                    cells: [
                      {
                        key: 'content',
                        content: (
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5 line-clamp-2 max-w-md">
                            {post.content}
                          </p>
                        ),
                      },
                      {
                        key: 'author',
                        content: (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.author?.avatarUrl || undefined} />
                              <AvatarFallback>
                                {post.author?.displayName?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                                {post.author?.displayName || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">{post.author?.email}</p>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'thread',
                        content: (
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5 line-clamp-1 max-w-xs">
                            {post.thread?.title || '-'}
                          </p>
                        ),
                      },
                      {
                        key: 'replies',
                        content: (
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {post._count?.replies || 0}
                          </p>
                        ),
                      },
                      {
                        key: 'date',
                        content: (
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {format(new Date(post.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        ),
                      },
                      {
                        key: 'actions',
                        content: (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              asChild
                            >
                              <Link href={`/${ADMIN_BASE_PATH}/community/posts/${post.id}`}>
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ),
                      },
                    ],
                  }))}
                />
              )}

              {/* Pagination */}
              {postsData && postsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
                  <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                    Page {postsPage} sur {postsData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                      disabled={postsPage === 1}
                      className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPostsPage((p) => Math.min(postsData.totalPages, p + 1))}
                      disabled={postsPage === postsData.totalPages}
                      className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

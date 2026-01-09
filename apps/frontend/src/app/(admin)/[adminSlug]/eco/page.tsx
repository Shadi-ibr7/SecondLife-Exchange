'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink, Leaf, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function EcoImpactCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="h-auto min-h-[138px]">
      <CardContent className="p-4 sm:p-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-4 sm:leading-5">
            {title}
          </p>
          <p className="text-2xl sm:text-[30px] font-normal text-foreground leading-7 sm:leading-[36px]">
            {value}
          </p>
          {change && (
            <p className="text-xs font-normal text-[#2d5a45] leading-4">{change}</p>
          )}
        </div>
        <div className="bg-[rgba(45,90,69,0.1)] rounded-lg w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#2d5a45]" />
        </div>
      </CardContent>
    </Card>
  );
}

function EcoStatsCard({ title, value }: { title: string; value: string | number }) {
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

export default function AdminEcoPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-eco', page, search],
    queryFn: () => adminApi.getEcoContent(page, 20),
  });

  // Mock analytics data (to be replaced with real API call)
  const ecoAnalytics = {
    co2Saved: '12.5 tonnes',
    co2Change: '+8.2% ce mois',
    itemsSaved: '8,247',
    itemsChange: '+12.5% ce mois',
    articlesRead: '24,891',
    articlesChange: '+15.8% ce mois',
    total: 47,
    published: 42,
    drafts: 5,
    totalViews: '24.8k',
  };

  const featuredContent = data?.content?.[0] || null;

  const getTypeBadge = (kind: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      ARTICLE: { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: 'Article' },
      VIDEO: { className: 'bg-[rgba(217,160,85,0.2)] text-[#d9a055]', label: 'Vidéo' },
      STATS: { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: 'Statistiques' },
    };
    const config = variants[kind] || { className: 'bg-[#1a1a1c] text-[#9a9a9d]', label: kind };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (publishedAt: string | null) => {
    if (publishedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(45,90,69,0.1)] text-[#2d5a45]">
          Publié
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] text-[#9a9a9d]">
        Brouillon
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Contenu écologique</h1>
          <p className="admin-page-description">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between h-[63.971px]">
        <div className="flex flex-col gap-[3.987px]">
          <h1 className="admin-page-title">Contenu écologique</h1>
          <p className="admin-page-description">
            Gérer les articles, vidéos et statistiques environnementales
          </p>
        </div>
        <Button className="bg-[#2d5a45] hover:bg-[#2d5a45]/90 h-[39.996px] px-[15.98px] rounded-[6px]">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau contenu
        </Button>
      </div>

      {/* Impact Cards */}
      <div className="flex flex-col gap-[15.984px]">
        <h3 className="text-base font-normal text-foreground leading-[24px] tracking-[-0.3125px]">
          Impact environnemental
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EcoImpactCard
            title="CO₂ économisé"
            value={ecoAnalytics.co2Saved}
            change={ecoAnalytics.co2Change}
            icon={Leaf}
          />
          <EcoImpactCard
            title="Objets sauvés"
            value={ecoAnalytics.itemsSaved}
            change={ecoAnalytics.itemsChange}
            icon={Leaf}
          />
          <EcoImpactCard
            title="Articles lus"
            value={ecoAnalytics.articlesRead}
            change={ecoAnalytics.articlesChange}
            icon={Leaf}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EcoStatsCard title="Total contenus" value={ecoAnalytics.total} />
        <EcoStatsCard title="Publiés" value={ecoAnalytics.published} />
        <EcoStatsCard title="Brouillons" value={ecoAnalytics.drafts} />
        <EcoStatsCard title="Vues totales" value={ecoAnalytics.totalViews} />
      </div>

      {/* Featured Content Card */}
      {featuredContent && (
        <Card
          className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[194.224px] border-[rgba(45,90,69,0.2)]"
          style={{
            backgroundImage:
              'linear-gradient(169.23deg, rgba(45, 90, 69, 0.05) 0%, rgba(45, 90, 69, 0.1) 100%), linear-gradient(90deg, rgba(20, 20, 22, 1) 0%, rgba(20, 20, 22, 1) 100%)',
          }}
        >
          <CardContent className="p-0 flex flex-col gap-[11.997px] h-[143.927px]">
            <div className="flex gap-[11.997px] items-start h-[47.97px]">
              <div className="bg-[#2d5a45] rounded-[8px] size-[39.996px] flex items-center justify-center shrink-0">
                <Leaf className="w-[19.989px] h-[19.989px] text-white" />
              </div>
              <div className="flex-1 flex flex-col gap-[3.987px]">
                <div className="flex items-center gap-[11.997px] h-[23.994px]">
                  <h4 className="text-base font-normal text-foreground leading-[24px] tracking-[-0.3125px]">
                    Contenu mis en avant
                  </h4>
                  {getStatusBadge(featuredContent.publishedAt)}
                </div>
                <p className="text-sm text-muted-foreground font-normal leading-[20px] tracking-[-0.1504px]">
                  Article le plus consulté ce mois
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-[7.992px]">
              <h4 className="text-base font-normal text-foreground leading-[24px] tracking-[-0.3125px]">
                {featuredContent.title || "Les avantages de l'économie circulaire"}
              </h4>
              <p className="text-sm text-muted-foreground font-normal leading-[20px] tracking-[-0.1504px]">
                {featuredContent.summary ||
                  "Découvrez comment l'économie circulaire transforme notre façon de consommer et contribue à préserver notre planète pour les générations futures."}
              </p>
            </div>
            <div className="flex gap-[23.994px] items-center h-[19.989px]">
              <div className="flex items-center gap-[7.992px]">
                <span className="text-sm text-muted-foreground font-normal leading-[20px] tracking-[-0.1504px]">
                  Vues:
                </span>
                <span className="text-sm text-foreground font-normal leading-[20px] tracking-[-0.1504px]">
                  1,247
                </span>
              </div>
              <div className="flex items-center gap-[7.992px]">
                <span className="text-sm text-muted-foreground font-normal leading-[20px] tracking-[-0.1504px]">
                  Publié:
                </span>
                <span className="text-sm text-foreground font-normal leading-[20px] tracking-[-0.1504px]">
                  {featuredContent.publishedAt
                    ? format(new Date(featuredContent.publishedAt), 'dd MMM yyyy', { locale: fr })
                    : '15 Nov 2024'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Table */}
      <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px] h-[394.689px]">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-normal text-foreground mb-1">Tous les contenus</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border h-[44.56px]">
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Titre
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Statut
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Vues
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-sm font-bold text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-sm font-bold text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content?.length > 0 ? (
                  data.content.map((item: any, index: number) => {
                    const isLast = index === data.content.length - 1;
                    return (
                      <tr
                        key={item.id}
                        className={`${
                          !isLast
                            ? 'border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]'
                            : ''
                        } h-[65.108px]`}
                      >
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                            {item.title}
                          </p>
                        </td>
                        <td className="px-4">{getTypeBadge(item.kind || 'ARTICLE')}</td>
                        <td className="px-4">{getStatusBadge(item.publishedAt)}</td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {item.views || '-'}
                          </p>
                        </td>
                        <td className="px-4">
                          <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                            {item.publishedAt
                              ? format(new Date(item.publishedAt), 'dd MMM yyyy', { locale: fr })
                              : item.createdAt
                                ? format(new Date(item.createdAt), 'dd MMM yyyy', { locale: fr })
                                : '-'}
                          </p>
                        </td>
                        <td className="px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                              asChild
                            >
                              <Link href={`/${ADMIN_BASE_PATH}/eco/${item.id}`}>
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-[39.978px] h-[31.986px] rounded-[6px]"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-sm text-muted-foreground">
                      <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      Aucun contenu trouvé.
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

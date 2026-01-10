'use client';

/**
 * FICHIER: app/discover/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détail d'un article de blog/contenu selon les designs Figma.
 * Implémente les 4 variantes de design:
 * - Desktop sombre (node-id 26:6298)
 * - Desktop clair (node-id 26:6738)
 * - Desktop variante sombre avec encadrés (node-id 26:7170)
 * - Mobile (node-id 26:7618)
 *
 * La page s'adapte automatiquement selon le thème (dark/light) et la taille d'écran.
 */

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/discover/ArticleCard';
import {
  ArrowLeft,
  Share2,
  Copy,
  Calendar,
  Clock,
  Leaf,
  Eye,
  Sparkles,
  ArrowRight,
  Bookmark,
  Heart,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';
import { ecoApi } from '@/lib/eco.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useMemo } from 'react';

// Mapping des tags/kind vers les catégories d'affichage
const categoryMapping: Record<string, { bg: string; border: string; text: string }> = {
  Réparation: {
    bg: 'bg-[rgba(43,127,255,0.1)]',
    border: 'border-[rgba(43,127,255,0.2)]',
    text: 'text-[#51a2ff]',
  },
  'Guides pratiques': {
    bg: 'bg-[rgba(240,177,0,0.1)]',
    border: 'border-[rgba(240,177,0,0.2)]',
    text: 'text-[#fdc700]',
  },
  'IA & innovation': {
    bg: 'bg-[rgba(16,185,129,0.1)]',
    border: 'border-[rgba(16,185,129,0.2)]',
    text: 'text-[#10b981]',
  },
  Écologie: {
    bg: 'bg-[rgba(0,201,80,0.1)]',
    border: 'border-[rgba(0,201,80,0.2)]',
    text: 'text-[#05df72]',
  },
  'Économie circulaire': {
    bg: 'bg-[rgba(173,70,255,0.1)]',
    border: 'border-[rgba(173,70,255,0.2)]',
    text: 'text-[#c27aff]',
  },
};

// Fonction pour mapper un contenu EcoContent vers le format article
function mapEcoContentToArticle(content: any) {
  // Déterminer la catégorie
  let category = 'Écologie';
  const lowerTags = (content.tags || []).map((t: string) => t.toLowerCase());
  const lowerKind = content.kind?.toLowerCase() || '';

  for (const [key, mappedCategory] of Object.entries({
    'réparation': 'Réparation',
    'repair': 'Réparation',
    'écologie': 'Écologie',
    'ecology': 'Écologie',
    'économie circulaire': 'Économie circulaire',
    'circular economy': 'Économie circulaire',
    'guide': 'Guides pratiques',
    'tutoriel': 'Guides pratiques',
    'tutorial': 'Guides pratiques',
    'ia': 'IA & innovation',
    'ai': 'IA & innovation',
    'innovation': 'IA & innovation',
  })) {
    if (lowerTags.some((tag: string) => tag.includes(key)) || lowerKind.includes(key)) {
      category = mappedCategory;
      break;
    }
  }

  // Estimer le temps de lecture
  const wordCount = content.summary?.split(/\s+/).length || 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readingTime = `${readingMinutes} min`;

  // Extraire l'impact CO₂
  let co2Impact = '–1 kg CO₂';
  if (content.kpis && typeof content.kpis === 'object') {
    const kpiStr = JSON.stringify(content.kpis);
    const co2Match = kpiStr.match(/co[₂2]?[\s:]*([+-]?\d+[.,]?\d*)\s*(kg|%|tonnes?)/i);
    if (co2Match) {
      const value = co2Match[1].replace(',', '.');
      const unit = co2Match[2] || 'kg CO₂';
      co2Impact = `${value.includes('-') ? '' : '–'}${value} ${unit}`;
    }
  }

  return {
    id: content.id,
    title: content.title,
    description: content.summary || content.title.substring(0, 150) + '...',
    category,
    readingTime,
    co2Impact,
    publishedAt: content.publishedAt,
    createdAt: content.createdAt,
    tags: content.tags || [],
    summary: content.summary,
    kpis: content.kpis,
    source: content.source,
    url: content.url,
    kind: content.kind,
  };
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Charger l'article depuis l'API
  const {
    data: ecoContent,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['eco-content', id],
    queryFn: () => ecoApi.getEcoContent(id),
    enabled: !!id,
    retry: 1,
  });

  // Charger les articles similaires (exclure l'article actuel)
  const { data: similarContentData } = useQuery({
    queryKey: ['eco-content', 'similar', id],
    queryFn: async () => {
      const data = await ecoApi.listEcoContent({ page: 1, limit: 10 });
      // Filtrer l'article actuel et prendre les 3 premiers
      return {
        ...data,
        items: data.items.filter((item: any) => item.id !== id).slice(0, 3),
      };
    },
    enabled: !!id && !!ecoContent,
  });

  // Tous les hooks doivent être appelés avant les early returns
  // Mapper l'article et préparer les données
  const article = useMemo(() => {
    if (!ecoContent) return null;
    return mapEcoContentToArticle(ecoContent);
  }, [ecoContent]);

  const categoryStyle = useMemo(() => {
    if (!article) return categoryMapping['Écologie'];
    return categoryMapping[article.category] || categoryMapping['Écologie'];
  }, [article]);

  // Formater la date
  const formattedDate = useMemo(() => {
    if (!article) return '';
    return article.publishedAt
      ? format(new Date(article.publishedAt), 'd MMMM yyyy', { locale: fr })
      : article.createdAt
      ? format(new Date(article.createdAt), 'd MMMM yyyy', { locale: fr })
      : '';
  }, [article]);

  // Articles similaires
  const similarArticles = useMemo(() => {
    if (!similarContentData?.items) return [];
    return similarContentData.items.map(mapEcoContentToArticle);
  }, [similarContentData]);

  // Extraire les chiffres clés depuis les KPIs
  const keyFigures = useMemo(() => {
    if (!article || !article.kpis || typeof article.kpis !== 'object') return [];
    const kpiStr = JSON.stringify(article.kpis);
    const figures = kpiStr.match(/\d+%|\d+\s*kg\s*CO[₂2]/gi);
    return figures ? figures.slice(0, 4) : [];
  }, [article]);

  // Early returns APRÈS tous les hooks
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#0b0b0d]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#10b981] border-t-transparent mx-auto" />
          <p className="text-[#71717a] dark:text-[#a1a1aa]">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error || !ecoContent || !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#0b0b0d] px-4">
        <div className="text-center max-w-md">
          <h1 className="mb-4 text-2xl font-bold text-[#0b0b0d] dark:text-[#ededee]">
            Article non trouvé
          </h1>
          <p className="mb-6 text-[#71717a] dark:text-[#a1a1aa]">
            L'article demandé n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => router.push('/discover')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0d]">
        {/* Header avec navigation - Design Figma Desktop/Mobile */}
      <header className="sticky top-0 z-50 border-b border-[#e4e4e7] bg-white/95 backdrop-blur-md dark:border-[#27272a] dark:bg-[#0b0b0d]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-9 rounded-lg px-3 text-sm font-medium text-[#71717a] hover:bg-[#fafafa] hover:text-[#0b0b0d] dark:text-[#a1a1aa] dark:hover:bg-[#121216] dark:hover:text-[#ededee]"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Button>
            <span className="hidden text-sm text-[#71717a] md:inline-block dark:text-[#a1a1aa]">
              Découvrir
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton partager avec menu déroulant - Design Figma */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="h-9 w-9 rounded-full border border-[#e4e4e7] bg-white transition-all hover:border-[#10b981] hover:bg-[#fafafa] dark:border-[#27272a] dark:bg-[#121216] dark:hover:border-[#10b981] dark:hover:bg-[#1a1a1f]"
              >
                {showShareMenu ? (
                  <X className="h-4 w-4 text-[#0b0b0d] dark:text-[#ededee]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#0b0b0d] dark:text-[#ededee]" />
                )}
              </Button>

              {showShareMenu && (
                <>
                  {/* Overlay pour fermer le menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 flex min-w-[180px] flex-col gap-1 rounded-xl border border-[#e4e4e7] bg-white p-2 shadow-xl dark:border-[#27272a] dark:bg-[#121216]">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          );
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#fafafa] dark:text-[#ededee] dark:hover:bg-[#1a1a1f]"
                    >
                      <Twitter className="h-4 w-4" />
                      <span>X / Twitter</span>
                    </button>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          );
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#fafafa] dark:text-[#ededee] dark:hover:bg-[#1a1a1f]"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.href);
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#fafafa] dark:text-[#ededee] dark:hover:bg-[#1a1a1f]"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copier le lien</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBookmarked(!bookmarked)}
              className={`h-9 w-9 rounded-full border transition-all ${
                bookmarked
                  ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                  : 'border-[#e4e4e7] bg-white text-[#71717a] hover:border-[#10b981] hover:bg-[#fafafa] dark:border-[#27272a] dark:bg-[#121216] dark:text-[#a1a1aa] dark:hover:border-[#10b981] dark:hover:bg-[#1a1a1f]'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal - Design Figma Desktop/Mobile responsive */}
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8 lg:px-8">
        {/* Breadcrumb - Design Figma Mobile */}
        <nav className="mb-4 text-xs text-[#71717a] sm:text-sm dark:text-[#a1a1aa]">
          <Link href="/discover" className="hover:text-[#10b981] transition-colors">
            Découvrir
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#0b0b0d] dark:text-[#ededee]">{article.category}</span>
        </nav>

        {/* Badge catégorie */}
        <div
          className={`mb-4 inline-flex h-6 items-center rounded-lg border px-3 py-1 text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text}`}
        >
          {article.category}
        </div>

        {/* Titre - Design Figma */}
        <h1 className="mb-4 text-2xl font-bold leading-tight text-[#0b0b0d] dark:text-[#ededee] sm:mb-6 sm:text-3xl lg:text-4xl lg:leading-[1.2]">
          {article.title}
        </h1>

        {/* Métadonnées - Design Figma */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-[#71717a] sm:mb-8 sm:gap-4 sm:text-sm dark:text-[#a1a1aa]">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{article.readingTime} de lecture</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[#10b981]">
            <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Impact: {article.co2Impact}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>1.2k vues</span>
          </div>
        </div>

        {/* Box Analyse IA - Design Figma */}
        <div className="mb-6 rounded-2xl border border-[rgba(16,185,129,0.15)] bg-[rgba(16,185,129,0.06)] p-5 dark:border-[rgba(16,185,129,0.25)] dark:bg-[rgba(16,185,129,0.12)] sm:mb-8 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#10b981]" />
            <span className="text-sm font-semibold leading-5 text-[#10b981]">Analyse IA</span>
          </div>
          <p className="text-sm leading-[1.6] text-[#52525b] dark:text-[#a1a1aa] sm:text-base sm:leading-relaxed">
            {article.summary ||
              "Cet article est recommandé en fonction de vos intérêts pour la réparation et l'impact environnemental. Niveau: Débutant • Thèmes: Réduction CO₂, Économie circulaire, DIY"}
          </p>
          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.slice(0, 5).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="rounded-lg border border-[rgba(16,185,129,0.25)] bg-white/60 px-2.5 py-1 text-xs font-medium text-[#10b981] dark:border-[rgba(16,185,129,0.35)] dark:bg-[#121216]/60"
                >
                  {tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="mb-6 h-px bg-[#e4e4e7] dark:bg-[#27272a]" />

        {/* Informations auteur */}
        <div className="mb-8 flex items-start gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5">
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#10b981]">
              {article.category.charAt(0)}
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                SecondLife Exchange
              </h3>
              <span className="rounded-md border border-[#e4e4e7] bg-transparent px-2 py-1 text-xs font-semibold text-[#71717a] dark:border-[#27272a] dark:text-[#a1a1aa]">
                Expert
              </span>
            </div>
            <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
              Équipe éditoriale • {similarContentData?.total || 0} articles publiés
            </p>
          </div>
        </div>

        {/* Séparateur */}
        <div className="mb-8 h-px bg-[#e4e4e7] dark:bg-[#27272a]" />

        {/* Contenu de l'article */}
        <article className="prose prose-lg dark:prose-invert mb-8 max-w-none sm:mb-12">
          {/* Introduction */}
          {article.summary && (
            <div className="mb-6 sm:mb-8">
              <p className="mb-3 text-base font-semibold text-[#0b0b0d] dark:text-[#ededee] sm:text-lg">
                Introduction
              </p>
              <div className="space-y-4">
                {article.summary.split('\n\n').map((paragraph: string, index: number) => (
                  <p
                    key={index}
                    className="text-base leading-[1.75] text-[#52525b] dark:text-[#a1a1aa] sm:leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Box Chiffres clés - Design Figma */}
          {keyFigures.length > 0 && (
            <div className="my-6 rounded-2xl border border-[rgba(16,185,129,0.15)] bg-[rgba(16,185,129,0.06)] p-5 dark:border-[rgba(16,185,129,0.25)] dark:bg-[rgba(16,185,129,0.12)] sm:my-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <Leaf className="h-5 w-5 text-[#10b981]" />
                <h3 className="text-base font-semibold leading-6 text-[#10b981]">Chiffres clés</h3>
              </div>
              <ul className="space-y-2.5">
                {keyFigures.length > 0 ? (
                  keyFigures.map((figure: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm leading-[1.7] text-[#52525b] dark:text-[#a1a1aa] sm:text-base"
                    >
                      • <strong className="font-semibold text-[#10b981]">{figure}</strong>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="text-sm leading-[1.7] text-[#52525b] dark:text-[#a1a1aa] sm:text-base">
                      • <strong className="font-semibold text-[#10b981]">70%</strong> de réduction des émissions CO₂ en réparant vs. acheter neuf
                    </li>
                    <li className="text-sm leading-[1.7] text-[#52525b] dark:text-[#a1a1aa] sm:text-base">
                      • <strong className="font-semibold text-[#10b981]">80 kg CO₂</strong> économisés en réparant un smartphone
                    </li>
                    <li className="text-sm leading-[1.7] text-[#52525b] dark:text-[#a1a1aa] sm:text-base">
                      • <strong className="font-semibold text-[#10b981]">200 kg CO₂</strong> économisés en réparant un ordinateur portable
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Contenu depuis l'URL - Si disponible - Design Figma */}
          {article.url && (
            <div className="my-6 rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#121216] sm:my-8 sm:p-6">
              <p className="mb-3 text-sm font-semibold text-[#0b0b0d] dark:text-[#ededee] sm:text-base">
                Ressources recommandées
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#10b981] hover:underline sm:text-base"
              >
                {article.source || article.url}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="my-6 flex flex-wrap gap-2 sm:my-8">
              {article.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#52525b] transition-colors hover:border-[#10b981] hover:bg-[#f0fdf4] dark:border-[#27272a] dark:bg-[#121216] dark:text-[#a1a1aa] dark:hover:border-[#10b981] dark:hover:bg-[#0a1f0f]"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Barre d'interactions - Design Figma Mobile/Desktop */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3 border-y border-[#e4e4e7] py-4 dark:border-[#27272a] sm:mb-12 sm:gap-4">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              liked
                ? 'bg-[#10b981]/10 text-[#10b981]'
                : 'text-[#71717a] hover:bg-[#fafafa] dark:text-[#a1a1aa] dark:hover:bg-[#121216]'
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span>45 j&apos;aime</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#71717a] transition-colors hover:bg-[#fafafa] dark:text-[#a1a1aa] dark:hover:bg-[#121216]">
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Commenter</span>
            <span className="sm:hidden">Commentaires</span>
          </button>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#71717a] transition-colors hover:bg-[#fafafa] dark:text-[#a1a1aa] dark:hover:bg-[#121216]"
          >
            <Share2 className="h-5 w-5" />
            <span>23 partages</span>
          </button>
        </div>

        {/* Section CTA - Design Figma */}
        <div className="mb-8 rounded-2xl border border-[rgba(16,185,129,0.2)] bg-gradient-to-br from-[rgba(16,185,129,0.08)] via-[rgba(16,185,129,0.04)] to-[rgba(16,185,129,0.02)] p-6 dark:border-[rgba(16,185,129,0.25)] dark:from-[rgba(16,185,129,0.15)] dark:via-[rgba(16,185,129,0.1)] dark:to-[rgba(16,185,129,0.05)] sm:mb-12 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <h2 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee] sm:text-xl">
                Prêt à passer à l&apos;action?
              </h2>
              <p className="text-sm leading-relaxed text-[#52525b] dark:text-[#a1a1aa] sm:text-base">
                Explorez notre catalogue d&apos;objets à échanger et commencez votre parcours
                vers une consommation plus responsable.
              </p>
            </div>
            <Button
              size="lg"
              asChild
              className="h-11 w-full rounded-lg bg-[#10b981] px-6 text-sm font-semibold text-white transition-all hover:bg-[#059669] sm:w-auto"
            >
              <Link href="/explore" className="flex items-center justify-center gap-2">
                Explorer les objets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Section Articles similaires - Design Figma */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#10b981] sm:h-5 sm:w-5" />
              <span className="text-xs font-semibold text-[#10b981] sm:text-sm">
                Recommandations personnalisées
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0b0b0d] dark:text-[#ededee] sm:text-2xl">
              Articles similaires
            </h2>
          </div>

          {similarArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similarArticles.map((similarArticle: any) => (
                <ArticleCard key={similarArticle.id} {...similarArticle} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#e4e4e7] bg-[#fafafa] py-12 dark:border-[#27272a] dark:bg-[#121216]">
              <Sparkles className="mb-4 h-10 w-10 text-[#10b981]/30" />
              <p className="text-center text-sm text-[#71717a] dark:text-[#a1a1aa]">
                Aucun article similaire disponible pour le moment.
              </p>
            </div>
          )}
        </div>

        {/* Newsletter - Design Figma Mobile */}
        <div className="my-8 rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.05)] p-6 dark:border-[rgba(16,185,129,0.25)] dark:bg-[rgba(16,185,129,0.1)] sm:my-12">
          <h3 className="mb-3 text-base font-semibold text-[#0b0b0d] dark:text-[#ededee] sm:text-lg">
            Abonnez-vous à notre newsletter
          </h3>
          <p className="mb-4 text-sm text-[#52525b] dark:text-[#a1a1aa]">
            Recevez nos meilleurs articles et guides directement dans votre boîte mail.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              className="h-11 flex-1 rounded-lg border border-[#e4e4e7] bg-white px-4 text-sm text-[#0b0b0d] placeholder:text-[#71717a] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 dark:border-[#27272a] dark:bg-[#121216] dark:text-[#ededee] dark:placeholder:text-[#a1a1aa] dark:focus:border-[#10b981]"
            />
            <Button className="h-11 rounded-lg bg-[#10b981] px-6 text-sm font-semibold text-white hover:bg-[#059669]">
              S&apos;abonner
            </Button>
          </div>
        </div>

        {/* Partage social - Design Figma Mobile */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-[#e4e4e7] pt-6 dark:border-[#27272a] sm:mt-12 sm:pt-8">
          <p className="text-xs font-medium text-[#71717a] dark:text-[#a1a1aa] sm:text-sm">
            Partager
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                    '_blank'
                  );
                }
              }}
              className="rounded-full p-2.5 text-[#71717a] transition-all hover:bg-[#fafafa] hover:text-[#1877f2] dark:text-[#a1a1aa] dark:hover:bg-[#121216]"
            >
              <Facebook className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`,
                    '_blank'
                  );
                }
              }}
              className="rounded-full p-2.5 text-[#71717a] transition-all hover:bg-[#fafafa] hover:text-[#1da1f2] dark:text-[#a1a1aa] dark:hover:bg-[#121216]"
            >
              <Twitter className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                    '_blank'
                  );
                }
              }}
              className="rounded-full p-2.5 text-[#71717a] transition-all hover:bg-[#fafafa] hover:text-[#0a66c2] dark:text-[#a1a1aa] dark:hover:bg-[#121216]"
            >
              <Linkedin className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(`https://www.instagram.com/`, '_blank');
                }
              }}
              className="rounded-full p-2.5 text-[#71717a] transition-all hover:bg-[#fafafa] hover:text-[#e4405f] dark:text-[#a1a1aa] dark:hover:bg-[#121216]"
            >
              <Instagram className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

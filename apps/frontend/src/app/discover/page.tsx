'use client';

/**
 * FICHIER: app/discover/page.tsx
 *
 * DESCRIPTION:
 * Page publique "Découvrir" selon le design Figma.
 * Affiche des articles, guides et conseils éco-éducatifs avec filtres par catégorie.
 *
 * SECTIONS:
 * - Hero: Badge, titre et description
 * - Barre de filtres sticky: Catégories (Tous, Écologie, Réparation, etc.)
 * - Grille d'articles: 2 colonnes desktop, 1 colonne mobile
 * - Section IA: Recommandations personnalisées
 * - Section CTA: Statistiques et boutons d'action
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/discover/ArticleCard';
import { Sparkles, ArrowRight, FileText, Inbox, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ecoApi } from '@/lib/eco.api';
import { EcoContent, PaginatedEcoContentResponse } from '@/types';

// Mapping des tags/kind vers les catégories d'affichage
const categoryMapping: Record<string, string> = {
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
};

// Type pour l'article formaté
type ArticleCardData = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  readingTime: string;
  co2Impact: string;
  aiSuggested: boolean;
};

// Fonction utilitaire pour mapper un contenu EcoContent vers ArticleCard
function mapEcoContentToArticle(content: EcoContent): ArticleCardData {
  // Déterminer la catégorie à partir des tags ou du kind
  let category = 'Écologie'; // Par défaut
  const lowerTags = content.tags.map((t) => t.toLowerCase());
  const lowerKind = content.kind?.toLowerCase() || '';

  // Chercher une correspondance dans les tags
  for (const [key, mappedCategory] of Object.entries(categoryMapping)) {
    if (lowerTags.some((tag) => tag.includes(key)) || lowerKind.includes(key)) {
      category = mappedCategory;
      break;
    }
  }

  // Estimer le temps de lecture à partir du résumé (environ 200 mots/min)
  const wordCount = content.summary?.split(/\s+/).length || 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readingTime = `${readingMinutes} min`;

  // Extraire l'impact CO₂ depuis les KPIs ou utiliser une valeur par défaut
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

  // Utiliser le résumé comme description, ou tronquer le titre
  const description = content.summary || content.title.substring(0, 150) + '...';

  return {
    id: content.id,
    title: content.title,
    description,
    image: '/placeholder-article.jpg', // TODO: Ajouter un champ image dans EcoContent si nécessaire
    category,
    readingTime,
    co2Impact,
    aiSuggested: false, // TODO: Implémenter la logique de suggestion IA si nécessaire
  };
}

const categories = [
  'Tous',
  'Écologie',
  'Réparation',
  'Économie circulaire',
  'Guides pratiques',
  'IA & innovation',
];

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Récupérer les contenus éco depuis l'API
  const {
    data: ecoContentData,
    isLoading,
    error,
  } = useQuery<PaginatedEcoContentResponse>({
    queryKey: ['eco-content', 'public'],
    queryFn: async () => {
      try {
        return await ecoApi.listEcoContent({ page: 1, limit: 100 });
      } catch (err: any) {
        // Log l'erreur complète pour déboguer
        console.error('❌ Erreur lors de la récupération des contenus éco:', err);
        console.error('📡 URL complète:', err?.config?.url || err?.request?.responseURL || 'URL non disponible');
        console.error('🌐 Base URL:', err?.config?.baseURL || 'Base URL non disponible');
        throw err;
      }
    },
    staleTime: 30 * 1000, // 30 secondes - permet de voir les nouvelles publications rapidement
    gcTime: 5 * 60 * 1000, // 5 minutes (remplace cacheTime dans React Query v5)
    retry: 1,
  });

  // Mapper les contenus vers le format ArticleCard
  const articles = useMemo(() => {
    if (!ecoContentData?.items) return [];
    return ecoContentData.items.map(mapEcoContentToArticle);
  }, [ecoContentData]);

  // Filtrer par catégorie
  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'Tous') {
      return articles;
    }
    return articles.filter((article: ArticleCardData) => article.category === selectedCategory);
  }, [articles, selectedCategory]);

  // Pour l'instant, pas de recommandations IA - utiliser les 4 premiers articles
  const aiRecommendedArticles = useMemo(() => {
    return articles.slice(0, 4);
  }, [articles]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0d]">
      {/* Hero Section - Design Figma */}
      <section className="relative overflow-hidden border-b border-[#e4e4e7] bg-gradient-to-b from-[rgba(16,185,129,0.08)] via-[#fafafa] via-50% to-[#fafafa] dark:border-[#27272a] dark:from-[rgba(16,185,129,0.15)] dark:via-[#0b0b0d] dark:to-[#0b0b0d]">
        <div className="mx-auto w-full max-w-[1095px] px-4 pb-8 pt-12 sm:pb-0 sm:pt-16 lg:px-[179.5px] lg:pt-20">
          <div className="mx-auto w-full max-w-[736px] text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex h-9 items-center gap-2 rounded-full border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.08)] px-4 sm:mb-[54px] sm:h-[38px] dark:border-[rgba(16,185,129,0.3)] dark:bg-[rgba(16,185,129,0.12)]">
              <FileText className="h-3.5 w-3.5 text-[#10b981] sm:h-4 sm:w-4" />
              <span className="text-xs font-medium leading-5 text-[#10b981] sm:text-sm sm:leading-[20px] sm:tracking-[-0.1504px]">
                Contenus & Guides
              </span>
            </div>

            {/* Titre principal */}
            <h1 className="mb-4 text-3xl font-bold leading-[1.1] tracking-tight text-[#0b0b0d] dark:text-[#ededee] sm:text-4xl sm:leading-[1.1] lg:text-[48px] lg:leading-[48px] lg:tracking-[0.3516px]">
              Découvrir un mode de vie
              <br />
              <span className="text-[#10b981]">plus responsable</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-0 max-w-[672px] text-base leading-7 text-[#52525b] dark:text-[#a1a1aa] sm:text-lg sm:leading-8 lg:text-[20px] lg:leading-[28px] lg:tracking-[-0.4492px]">
              Articles, guides et conseils pour prolonger la vie de vos objets
              et réduire votre impact écologique
            </p>
          </div>
        </div>
      </section>

      {/* Barre de filtres sticky - Design Figma */}
      <div className="sticky top-0 z-10 border-b border-[#e4e4e7] bg-[rgba(250,250,250,0.95)] backdrop-blur-md dark:border-[#27272a] dark:bg-[rgba(11,11,13,0.95)]">
        <div className="mx-auto w-full max-w-[1095px] px-4 py-3 sm:py-4 lg:px-[179.5px]">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`h-[28px] whitespace-nowrap rounded-full px-4 text-xs font-semibold leading-4 transition-all sm:h-[32px] sm:px-5 sm:text-sm sm:leading-[20px] sm:tracking-[-0.1504px] ${
                  selectedCategory === category
                    ? 'bg-[#10b981] text-white shadow-sm'
                    : 'border border-[#e4e4e7] bg-white text-[#52525b] hover:border-[#10b981] hover:bg-[#fafafa] dark:border-[#27272a] dark:bg-[rgba(26,26,31,0.5)] dark:text-[#a1a1aa] dark:hover:border-[#10b981] dark:hover:bg-[rgba(26,26,31,0.7)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille d'articles - Design Figma */}
      <section className="mx-auto w-full max-w-[1095px] px-4 py-16 lg:px-[179.5px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#10b981] dark:text-[#10b981]" />
            <p className="text-center text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
              Chargement des articles...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Inbox className="mb-4 h-12 w-12 text-[#ef4444] dark:text-[#ef4444]" />
            <p className="text-center text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
              Erreur lors du chargement des articles.
              <br />
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs mt-2 block">
                  {(error as any)?.message || 'Erreur inconnue'}
                </span>
              )}
            </p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-[24px]">
            {filteredArticles.map((article: ArticleCardData) => (
              <ArticleCard key={article.id} {...article} href={`/discover/${article.id}`} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Inbox className="mb-4 h-12 w-12 text-[#71717a] dark:text-[#a1a1aa]" />
            <p className="text-center text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
              {selectedCategory === 'Tous'
                ? 'Aucun article disponible pour le moment.'
                : `Aucun article disponible dans la catégorie "${selectedCategory}".`}
              <br />
              Les contenus seront ajoutés prochainement.
            </p>
          </div>
        )}
      </section>

      {/* Section "Recommandé par notre IA" - Design Figma */}
      <section className="mx-auto w-full max-w-[1095px] bg-gradient-to-b from-transparent to-[rgba(16,185,129,0.05)] px-4 py-16 lg:px-[163.5px]">
        <div className="mb-8">
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#10b981]" />
            <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
              Recommandations personnalisées
            </span>
          </div>
          <h2 className="mb-2 text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
            Recommandé par notre IA
          </h2>
          <p className="text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
            Ces articles sont sélectionnés en fonction de vos intérêts et de
            votre impact écologique
          </p>
        </div>

        {/* Grille 2x2 */}
        {aiRecommendedArticles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-[24px]">
            {aiRecommendedArticles.map((article: ArticleCardData) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Sparkles className="mb-4 h-10 w-10 text-[#10b981]/30" />
            <p className="text-center text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
              Aucune recommandation disponible pour le moment.
            </p>
          </div>
        )}
      </section>

      {/* Section CTA avec statistiques - Design Figma */}
      <section className="mx-auto w-full max-w-[1095px] border-t border-[#e4e4e7] bg-white px-4 py-12 dark:border-[#27272a] dark:bg-[#0b0b0d] sm:py-16 lg:px-[179.5px]">
        <div className="mx-auto w-full max-w-[736px] text-center">
          {/* Titre */}
          <h2 className="mb-3 text-lg font-semibold leading-7 text-[#0b0b0d] dark:text-[#ededee] sm:mb-4 sm:text-xl">
            Agir commence par s&apos;informer
          </h2>
          <p className="mb-8 text-base leading-7 text-[#52525b] dark:text-[#a1a1aa] sm:mb-10 sm:text-lg">
            Rejoignez notre communauté et découvrez comment vos actions peuvent
            faire la différence
          </p>

          {/* Boutons */}
          <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              asChild
              className="h-11 w-full rounded-lg bg-[#10b981] px-6 text-sm font-semibold text-white transition-all hover:bg-[#059669] sm:w-auto"
            >
              <Link href="/discover" className="flex items-center justify-center gap-2">
                Explorer tous les articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 w-full rounded-lg border border-[#e4e4e7] bg-white px-6 text-sm font-semibold text-[#0b0b0d] transition-all hover:bg-[#fafafa] dark:border-[#27272a] dark:bg-[#121216] dark:text-[#ededee] dark:hover:bg-[#1a1a1f] sm:w-auto"
            >
              <Link href="/new-item">Proposer un objet</Link>
            </Button>
          </div>

          {/* Statistiques - Design Figma */}
          <div className="mx-auto grid max-w-[672px] grid-cols-3 gap-6 sm:gap-8">
            <div className="flex flex-col gap-2 text-center">
              <div className="text-2xl font-bold leading-8 text-[#10b981] sm:text-[30px] sm:leading-[36px]">
                {ecoContentData?.total || 200}+
              </div>
              <div className="text-xs leading-5 text-[#52525b] dark:text-[#a1a1aa] sm:text-sm">
                Guides disponibles
              </div>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <div className="text-2xl font-bold leading-8 text-[#10b981] sm:text-[30px] sm:leading-[36px]">
                12k+
              </div>
              <div className="text-xs leading-5 text-[#52525b] dark:text-[#a1a1aa] sm:text-sm">
                Lecteurs
              </div>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <div className="text-2xl font-bold leading-8 text-[#10b981] sm:text-[30px] sm:leading-[36px]">
                -70%
              </div>
              <div className="text-xs leading-5 text-[#52525b] dark:text-[#a1a1aa] sm:text-sm">
                CO₂ économisé
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/discover/ArticleCard';
import { Sparkles, ArrowRight, FileText, Inbox } from 'lucide-react';
import Link from 'next/link';

// Les articles seront chargés depuis l'API admin plus tard
// Structure prête pour recevoir les données
const articles: Array<{
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  readingTime: string;
  co2Impact: string;
  aiSuggested: boolean;
}> = [];

const aiRecommendedArticles: typeof articles = [];

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

  const filteredArticles =
    selectedCategory === 'Tous'
      ? articles
      : articles.filter((article) => article.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0d]">
      {/* Hero Section - Design Figma */}
      <section className="relative overflow-hidden border-b border-[#e4e4e7] bg-gradient-to-b from-[rgba(16,185,129,0.1)] via-[#fafafa] via-50% to-[#fafafa] dark:border-[#27272a] dark:via-[#0b0b0d] dark:to-[#0b0b0d]">
        <div className="mx-auto w-full max-w-[1095px] px-4 pb-0 pt-20 lg:px-[179.5px]">
          <div className="mx-auto w-full max-w-[736px] text-center">
            {/* Badge */}
            <div className="mb-[54px] inline-flex h-[38px] items-center gap-2 rounded-full border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)] px-4">
              <FileText className="h-4 w-4 text-[#10b981]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
                Contenus & Guides
              </span>
            </div>

            {/* Titre principal */}
            <h1 className="mb-4 text-[48px] leading-[48px] tracking-[0.3516px] text-[#0b0b0d] dark:text-[#ededee]">
              Découvrir un mode de vie
              <br />
              <span className="text-[#10b981]">plus responsable</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-0 max-w-[672px] text-[20px] leading-[28px] tracking-[-0.4492px] text-[#71717a] dark:text-[#a1a1aa]">
              Articles, guides et conseils pour prolonger la vie de vos objets
              et réduire votre impact écologique
            </p>
          </div>
        </div>
      </section>

      {/* Barre de filtres sticky - Design Figma */}
      <div className="sticky top-0 z-10 border-b border-[#e4e4e7] bg-[rgba(250,250,250,0.8)] backdrop-blur-sm dark:border-[#27272a] dark:bg-[rgba(11,11,13,0.8)]">
        <div className="mx-auto w-full max-w-[1095px] px-4 py-4 lg:px-[179.5px]">
          <div className="flex gap-3 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`h-[32px] whitespace-nowrap rounded-full px-5 text-sm font-semibold leading-[20px] tracking-[-0.1504px] transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#10b981] text-white'
                    : 'border border-[#e4e4e7] bg-[#fafafa] text-[#0b0b0d] hover:bg-[#f4f4f5] dark:border-[#1a1a1f] dark:bg-[rgba(26,26,31,0.3)] dark:text-[#ededee] dark:hover:bg-[rgba(26,26,31,0.5)]'
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
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-[24px]">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Inbox className="mb-4 h-12 w-12 text-[#71717a] dark:text-[#a1a1aa]" />
            <p className="text-center text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
              Aucun article disponible pour le moment.
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
            {aiRecommendedArticles.map((article) => (
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
      <section className="mx-auto w-full max-w-[1095px] px-4 py-16 lg:px-[179.5px]">
        <div className="mx-auto w-full max-w-[736px] text-center">
          {/* Titre */}
          <h2 className="mb-4 text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
            Agir commence par s&apos;informer
          </h2>
          <p className="mb-10 text-[18px] leading-[28px] tracking-[-0.4395px] text-[#71717a] dark:text-[#a1a1aa]">
            Rejoignez notre communauté et découvrez comment vos actions peuvent
            faire la différence
          </p>

          {/* Boutons */}
          <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-[40px] rounded-[8px] bg-[#10b981] px-4 text-sm font-semibold leading-[20px] tracking-[-0.1504px] text-white hover:bg-[#10b981]/90"
            >
              <Link href="/discover" className="flex items-center gap-2">
                Explorer tous les articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-[40px] rounded-[8px] border border-[#e4e4e7] bg-[#fafafa] px-[25px] text-sm font-semibold leading-[20px] tracking-[-0.1504px] text-[#0b0b0d] hover:bg-[#f4f4f5] dark:border-[#1a1a1f] dark:bg-[rgba(26,26,31,0.3)] dark:text-[#ededee] dark:hover:bg-[rgba(26,26,31,0.5)]"
            >
              <Link href="/new-item">Proposer un objet</Link>
            </Button>
          </div>

          {/* Statistiques */}
          <div className="mx-auto grid max-w-[672px] grid-cols-3 gap-8">
            <div className="flex flex-col gap-2 text-center">
              <div className="text-[30px] leading-[36px] tracking-[0.3955px] text-[#10b981]">
                200+
              </div>
              <div className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                Guides disponibles
              </div>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <div className="text-[30px] leading-[36px] tracking-[0.3955px] text-[#10b981]">
                12k+
              </div>
              <div className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                Lecteurs
              </div>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <div className="text-[30px] leading-[36px] tracking-[0.3955px] text-[#10b981]">
                -70%
              </div>
              <div className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                CO₂ économisé
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

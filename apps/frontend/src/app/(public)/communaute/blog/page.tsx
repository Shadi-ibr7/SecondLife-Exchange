/**
 * Page: Blog
 * Route: /communaute/blog
 */

'use client';

import Link from 'next/link';
import { Newspaper, Clock, ArrowRight, Tag, User, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export default function BlogPage() {
  // Articles mock pour le placeholder
  const featuredArticle = {
    id: 'comment-debuter-echange',
    title: 'Comment bien débuter sur SecondLife Exchange : le guide complet',
    excerpt: 'Vous venez de rejoindre notre communauté ? Découvrez tous nos conseils pour réussir vos premiers échanges et devenir un membre actif.',
    category: 'Guide',
    author: 'Emma Laurent',
    date: '15 janvier 2026',
    readTime: '8 min',
    image: '📚',
  };

  const articles = [
    {
      id: '10-objets-plus-echanges',
      title: 'Les 10 objets les plus échangés en 2025',
      excerpt: 'Découvrez quels types d\'objets rencontrent le plus de succès sur notre plateforme et pourquoi.',
      category: 'Tendances',
      author: 'Thomas Martin',
      date: '12 janvier 2026',
      readTime: '5 min',
      image: '📊',
    },
    {
      id: 'impact-ecologique-echanges',
      title: 'L\'impact écologique réel de vos échanges',
      excerpt: 'Chiffres à l\'appui, nous vous montrons comment vos échanges contribuent à la planète.',
      category: 'Écologie',
      author: 'Marie Dubois',
      date: '10 janvier 2026',
      readTime: '6 min',
      image: '🌍',
    },
    {
      id: 'temoignage-sophie-collection',
      title: 'Témoignage : Sophie a complété sa collection grâce à SecondLife',
      excerpt: 'Passionnée de vinyles, Sophie raconte comment elle a trouvé des pièces rares sur notre plateforme.',
      category: 'Témoignage',
      author: 'Sophie Chen',
      date: '8 janvier 2026',
      readTime: '4 min',
      image: '🎵',
    },
    {
      id: 'nouvelles-fonctionnalites-2026',
      title: 'Les nouvelles fonctionnalités de 2026',
      excerpt: 'Matching IA amélioré, chat vidéo, programme fidélité... Découvrez ce qui vous attend cette année.',
      category: 'Actualités',
      author: 'Lucas Bernard',
      date: '5 janvier 2026',
      readTime: '7 min',
      image: '✨',
    },
    {
      id: 'conseils-photo-objets',
      title: '5 conseils pour des photos d\'objets parfaites',
      excerpt: 'Apprenez à photographier vos objets comme un pro pour augmenter vos chances d\'échange.',
      category: 'Guide',
      author: 'Emma Laurent',
      date: '2 janvier 2026',
      readTime: '4 min',
      image: '📸',
    },
    {
      id: 'economie-circulaire-expliquee',
      title: 'L\'économie circulaire expliquée simplement',
      excerpt: 'Qu\'est-ce que l\'économie circulaire et pourquoi est-elle importante ? Explications.',
      category: 'Écologie',
      author: 'Marie Dubois',
      date: '28 décembre 2025',
      readTime: '6 min',
      image: '♻️',
    },
  ];

  const categories = [
    { name: 'Tous', count: 24, active: true },
    { name: 'Guides', count: 8 },
    { name: 'Écologie', count: 6 },
    { name: 'Témoignages', count: 5 },
    { name: 'Actualités', count: 3 },
    { name: 'Tendances', count: 2 },
  ];

  return (
    <>
      <PageHero
        icon={Newspaper}
        badge="Blog & Actualités"
        badgeColor="primary"
        title="Le blog SecondLife"
        subtitle="Conseils, témoignages, actualités et réflexions sur l'économie circulaire et le partage responsable."
      />

      {/* Section: Catégories */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category.active
                  ? 'bg-[#10b981] text-white'
                  : 'bg-[#f4f4f5] text-[#71717a] hover:bg-[#e4e4e7] dark:bg-[#27272a] dark:text-[#a1a1aa] dark:hover:bg-[#3f3f46]'
              }`}
            >
              {category.name}
              <span className="ml-1 opacity-70">({category.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Section: Article à la une */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="group relative overflow-hidden rounded-2xl border border-[#e4e4e7] bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-transparent p-8 transition-all hover:border-[#10b981]/30 hover:shadow-xl dark:border-[#27272a] md:p-12">
          <div className="absolute right-8 top-8 text-8xl opacity-20 transition-transform group-hover:scale-110">
            {featuredArticle.image}
          </div>
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#10b981] px-3 py-1 text-xs font-semibold text-white">
                À la une
              </span>
              <span className="rounded-full bg-[rgba(16,185,129,0.1)] px-3 py-1 text-xs font-medium text-[#10b981]">
                {featuredArticle.category}
              </span>
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee] md:text-3xl">
              {featuredArticle.title}
            </h2>
            <p className="mb-6 max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
              {featuredArticle.excerpt}
            </p>
            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[#71717a] dark:text-[#a1a1aa]">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {featuredArticle.author}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {featuredArticle.readTime} de lecture
              </div>
              <span>{featuredArticle.date}</span>
            </div>
            <Link
              href={`/communaute/blog/${featuredArticle.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
            >
              Lire l'article
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Articles */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <h2 className="mb-6 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
          Derniers articles
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white transition-all hover:border-[#10b981]/30 hover:shadow-lg dark:border-[#27272a] dark:bg-[#121216]"
            >
              {/* Image placeholder */}
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-[rgba(0,201,80,0.05)]">
                <span className="text-6xl transition-transform group-hover:scale-110">
                  {article.image}
                </span>
              </div>
              
              <div className="flex flex-1 flex-col p-5">
                {/* Catégorie */}
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-3 w-3 text-[#10b981]" />
                  <span className="text-xs font-medium text-[#10b981]">{article.category}</span>
                </div>
                
                {/* Titre */}
                <h3 className="mb-2 font-semibold text-[#0b0b0d] line-clamp-2 dark:text-[#ededee]">
                  {article.title}
                </h3>
                
                {/* Extrait */}
                <p className="mb-4 flex-1 text-sm text-[#71717a] line-clamp-2 dark:text-[#a1a1aa]">
                  {article.excerpt}
                </p>
                
                {/* Métadonnées */}
                <div className="flex items-center justify-between text-xs text-[#71717a] dark:text-[#a1a1aa]">
                  <span>{article.date}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section: Placeholder "Bientôt disponible" */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="rounded-xl border border-dashed border-[#e4e4e7] bg-[#fafafa] p-8 text-center dark:border-[#27272a] dark:bg-[#121216]">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#10b981]" />
          <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Plus d'articles à venir
          </h3>
          <p className="mx-auto max-w-md text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Notre équipe rédige régulièrement de nouveaux contenus. Inscrivez-vous à notre newsletter pour être informé des publications.
          </p>
        </div>
      </section>

      {/* Section: Newsletter */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-8 dark:border-[#27272a] dark:bg-[#121216]">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <h2 className="mb-2 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                📬 Newsletter SecondLife
              </h2>
              <p className="text-[#71717a] dark:text-[#a1a1aa]">
                Recevez nos meilleurs articles et conseils directement dans votre boîte mail.
              </p>
            </div>
            <form className="flex w-full max-w-sm gap-2">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-2 text-sm outline-none focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#10b981] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#10b981]/90"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>
      </section>

      <CTASection
        icon={Newspaper}
        title="Vous avez une histoire à partager ?"
        description="Vous êtes un membre actif et souhaitez témoigner ? Contactez-nous !"
        primaryAction={{ label: 'Nous contacter', href: '/aide/contact' }}
        secondaryAction={{ label: 'Voir les témoignages', href: '/communaute/blog' }}
      />
    </>
  );
}

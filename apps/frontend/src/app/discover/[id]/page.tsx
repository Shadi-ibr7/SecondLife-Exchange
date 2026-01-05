'use client';

/**
 * FICHIER: app/discover/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détail d'un article de blog/contenu selon le design Figma.
 * Affiche toutes les informations d'un article : hero avec image, métadonnées,
 * analyse IA, auteur, contenu avec sections, chiffres clés, ressources, tags,
 * CTA et articles similaires.
 *
 * SECTIONS:
 * - Hero: Image de fond avec boutons retour/partage
 * - Carte principale: Badge, titre, métadonnées, analyse IA, auteur, contenu
 * - Section CTA: "Prêt à passer à l'action?"
 * - Section Articles similaires: Grille avec ArticleCard
 */

import { useRouter, useParams } from 'next/navigation';
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
} from 'lucide-react';

// Données mock pour l'article (à remplacer par l'API)
// Les articles seront chargés depuis l'admin plus tard
const mockArticle = {
  id: '1',
  title: 'Pourquoi réparer plutôt que jeter réduit 70% de CO₂',
  category: 'Réparation',
  date: '3 janvier 2026',
  readingTime: '5 min',
  co2Impact: '–3 kg CO₂',
  views: '1,2k vues',
  image: '/placeholder-article.jpg',
  aiAnalysis: {
    level: 'Débutant',
    themes: ['Réduction CO₂', 'Économie circulaire', 'DIY'],
    description:
      "Cet article est recommandé en fonction de vos intérêts pour la réparation et l'impact environnemental.",
  },
  author: {
    name: 'Sophie Arnaud',
    role: 'Expert',
    title: 'Ingénieure environnement',
    articlesCount: '47 articles publiés',
    avatar: '/placeholder-avatar.jpg',
  },
  content: {
    introduction:
      "Dans un monde où la surconsommation atteint des sommets inquiétants, la réparation d'objets apparaît comme une solution simple mais terriblement efficace pour réduire notre empreinte carbone. Les chiffres parlent d'eux-mêmes: réparer plutôt que remplacer permet de réduire jusqu'à 70% des émissions de CO₂ liées à la production d'un nouvel objet.",
    sections: [
      {
        title: "L'impact caché de la production",
        content:
          "Chaque objet que nous achetons a une empreinte carbone bien plus importante qu'on ne l'imagine. La fabrication d'un smartphone, par exemple, génère environ 80 kg de CO₂, dont la majorité provient de l'extraction des matières premières et du processus de fabrication. En prolongeant la durée de vie de nos appareils de seulement un an, nous pouvons réduire drastiquement cet impact.",
      },
      {
        title: 'Les bénéfices économiques',
        content:
          "Au-delà de l'aspect environnemental, réparer ses objets représente également une économie substantielle. Le coût d'une réparation est généralement 3 à 5 fois inférieur à l'achat d'un produit neuf. Cette économie peut être réinvestie dans des achats plus durables ou simplement permettre une meilleure gestion de son budget.",
      },
      {
        title: 'Comment commencer?',
        content:
          "La réparation n'est pas réservée aux experts. De nombreuses ressources en ligne, comme les tutoriels vidéo et les forums de réparation, permettent à chacun de se lancer. Commencez par des réparations simples: changement de batterie, nettoyage de composants, remplacement de pièces basiques. Avec le temps, vous développerez les compétences pour des réparations plus complexes.",
      },
      {
        title: 'Conclusion',
        content:
          "Réparer plutôt que jeter n'est pas seulement un geste écologique, c'est aussi une démarche économique et valorisante. En prenant le temps de comprendre nos objets et en apprenant à les réparer, nous développons une relation plus consciente avec notre consommation et contribuons activement à la réduction de notre empreinte carbone. Chaque réparation compte, et ensemble, nous pouvons faire une réelle différence.",
      },
    ],
    keyFigures: [
      '70% de réduction des émissions CO₂ en réparant vs. acheter neuf',
      '80 kg CO₂ économisés en réparant un smartphone',
      '200 kg CO₂ économisés en réparant un ordinateur portable',
      '500 kg CO₂ économisés en réparant un réfrigérateur',
    ],
    resources: [
      'iFixit - Guides de réparation gratuits',
      'Repair Café - Ateliers communautaires',
      'YouTube - Tutoriels vidéo détaillés',
      'Forums spécialisés par type d\'appareil',
    ],
    tags: ['#réparation', '#écologie', '#CO2', '#économiecirculaire', '#DIY'],
  },
};

const similarArticles: Array<{
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  readingTime: string;
  co2Impact: string;
  aiSuggested: boolean;
}> = [];

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // TODO: Charger l'article depuis l'API
  // const { data: article, isLoading, error } = useQuery({
  //   queryKey: ['article', id],
  //   queryFn: () => articleApi.getArticle(id),
  //   enabled: !!id,
  // });

  // Pour l'instant, utiliser les données mock
  const article = mockArticle;

  const categoryColors: Record<string, { bg: string; border: string; text: string }> =
    {
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

  const categoryStyle = categoryColors[article.category] || categoryColors['Écologie'];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0d]">
      {/* Hero Section avec image de fond - Design Figma */}
      <section className="relative h-[451px] overflow-hidden">
        {/* Image de fond */}
        <div className="absolute inset-0">
          <Image
            src={article.image || '/placeholder-article.jpg'}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-[rgba(250,250,250,0.8)] via-50% to-transparent dark:from-[#0b0b0d] dark:via-[rgba(11,11,13,0.8)]" />
        </div>

        {/* Boutons en haut */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-6">
          {/* Bouton Retour */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-[36px] rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.8)] px-3 text-[#10b981] hover:bg-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(18,18,22,0.8)] dark:text-[#ededee] dark:hover:bg-[rgba(18,18,22,0.9)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          {/* Boutons Partager/Copier */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-[36px] w-[36px] rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(18,18,22,0.8)] dark:hover:bg-[rgba(18,18,22,0.9)]"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-[36px] w-[36px] rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(18,18,22,0.8)] dark:hover:bg-[rgba(18,18,22,0.9)]"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contenu principal - Design Figma */}
      <div className="mx-auto w-full max-w-[896px] px-4 pb-16 pt-[323px] lg:px-[284px]">
        {/* Carte principale */}
        <div className="mb-12 rounded-[14px] border border-[#e4e4e7] bg-white p-12 dark:border-[#27272a] dark:bg-[rgba(18,18,22,0.8)]">
          {/* Badge catégorie */}
          <div
            className={`mb-6 inline-flex h-[22px] items-center rounded-[8px] border px-[9px] py-[3px] ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text}`}
          >
            <span className="text-xs font-semibold leading-4">{article.category}</span>
          </div>

          {/* Titre */}
          <h1 className="mb-6 text-[48px] leading-[48px] tracking-[0.3516px] text-[#0b0b0d] dark:text-[#ededee]">
            {article.title.split('70%').map((part, index, array) => (
              <span key={index}>
                {part}
                {index < array.length - 1 && (
                  <span className="text-[#10b981]">70% de CO₂</span>
                )}
              </span>
            ))}
          </h1>

          {/* Métadonnées */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{article.readingTime} de lecture</span>
            </div>
            <div className="flex items-center gap-2 text-[#05df72]">
              <Leaf className="h-4 w-4" />
              <span>Impact: {article.co2Impact}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.views}</span>
            </div>
          </div>

          {/* Box Analyse IA */}
          <div className="mb-6 rounded-[16px] border border-[rgba(16,185,129,0.1)] bg-[rgba(16,185,129,0.05)] p-5 dark:border-[rgba(16,185,129,0.1)]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#10b981]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
                Analyse IA
              </span>
            </div>
            <p className="text-sm leading-[22.75px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
              {article.aiAnalysis.description} Niveau: {article.aiAnalysis.level} • Thèmes:{' '}
              {article.aiAnalysis.themes.join(', ')}
            </p>
          </div>

          {/* Séparateur */}
          <div className="mb-6 h-px bg-[#e4e4e7] dark:bg-[#27272a]" />

          {/* Informations auteur */}
          <div className="mb-6 flex items-start gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5">
              {article.author.avatar ? (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#10b981]">
                  {article.author.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
                  {article.author.name}
                </h3>
                <div className="rounded-[8px] border border-[#e4e4e7] bg-transparent px-[9px] py-[3px] dark:border-[#27272a]">
                  <span className="text-xs font-semibold leading-4 text-[#0b0b0d] dark:text-[#ededee]">
                    {article.author.role}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                {article.author.title} • {article.author.articlesCount}
              </p>
            </div>
          </div>

          {/* Séparateur */}
          <div className="mb-6 h-px bg-[#e4e4e7] dark:bg-[#27272a]" />

          {/* Contenu de l'article */}
          <div className="space-y-6">
            {/* Introduction */}
            <div>
              <p className="mb-2 text-base font-bold leading-[26px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
                Introduction:
              </p>
              <p className="text-base leading-[26px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
                {article.content.introduction}
              </p>
            </div>

            {/* Sections */}
            {article.content.sections.map((section, index) => (
              <div key={index}>
                <h2 className="mb-4 text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
                  {section.title}
                </h2>
                <p className="text-base leading-[26px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
                  {section.content}
                </p>
              </div>
            ))}

            {/* Box Chiffres clés */}
            <div className="rounded-[16px] border border-[rgba(16,185,129,0.1)] bg-[rgba(16,185,129,0.05)] p-6 dark:border-[rgba(16,185,129,0.1)]">
              <div className="mb-3 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-[#10b981]" />
                <h3 className="text-base leading-[24px] tracking-[-0.3125px] text-[#10b981]">
                  Chiffres clés
                </h3>
              </div>
              <ul className="space-y-2">
                {article.content.keyFigures.map((figure, index) => {
                  // Extraire le nombre/chiffre en gras
                  const match = figure.match(/^(\d+%|\d+\s*kg\s*CO₂)/);
                  const boldPart = match ? match[1] : '';
                  const rest = match ? figure.substring(match[0].length).trim() : figure;
                  return (
                    <li
                      key={index}
                      className="text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]"
                    >
                      • {boldPart && <strong>{boldPart}</strong>} {rest}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Box Ressources recommandées */}
            <div className="rounded-[16px] border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <h3 className="mb-4 text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
                Ressources recommandées
              </h3>
              <ul className="space-y-2">
                {article.content.resources.map((resource, index) => (
                  <li
                    key={index}
                    className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]"
                  >
                    • {resource}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Séparateur */}
          <div className="my-6 h-px bg-[#e4e4e7] dark:bg-[#27272a]" />

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {article.content.tags.map((tag, index) => (
              <div
                key={index}
                className="rounded-[8px] border border-[#e4e4e7] bg-[rgba(245,245,247,0.5)] px-[9px] py-[3px] dark:border-[#27272a] dark:bg-[rgba(26,26,31,0.5)]"
              >
                <span className="text-xs font-semibold leading-4 text-[#0b0b0d] dark:text-[#ededee]">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section CTA - Design Figma */}
        <div className="mb-12 rounded-[14px] border border-[rgba(16,185,129,0.2)] bg-gradient-to-br from-[rgba(16,185,129,0.1)] via-[rgba(16,185,129,0.05)] to-transparent p-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex-1">
              <h2 className="mb-2 text-lg font-semibold leading-[27px] tracking-[-0.4395px] text-[#0b0b0d] dark:text-[#ededee]">
                Prêt à passer à l&apos;action?
              </h2>
              <p className="text-base leading-[24px] tracking-[-0.3125px] text-[#71717a] dark:text-[#a1a1aa]">
                Explorez notre catalogue d&apos;objets à échanger et commencez votre parcours
                vers une consommation plus responsable.
              </p>
            </div>
            <Button
              size="lg"
              asChild
              className="h-[40px] rounded-[8px] bg-[#10b981] px-4 text-sm font-semibold leading-[20px] tracking-[-0.1504px] text-white hover:bg-[#10b981]/90"
            >
              <Link href="/explore" className="flex items-center gap-2">
                Explorer les objets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Section Articles similaires - Design Figma */}
        <div className="space-y-8">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#10b981]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
                Recommandations personnalisées
              </span>
            </div>
            <h2 className="text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
              Articles similaires
            </h2>
          </div>

          {/* Grille d'articles similaires */}
          {similarArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-[24px]">
              {similarArticles.map((similarArticle) => (
                <ArticleCard key={similarArticle.id} {...similarArticle} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="mb-4 h-10 w-10 text-[#10b981]/30" />
              <p className="text-center text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                Aucun article similaire disponible pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

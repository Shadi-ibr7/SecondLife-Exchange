/**
 * FICHIER: page.tsx (Page d'accueil)
 *
 * DESCRIPTION:
 * Ce fichier définit la page d'accueil de l'application.
 * Elle présente la plateforme, le thème hebdomadaire, les suggestions IA,
 * et du contenu éco-éducatif.
 *
 * SECTIONS:
 * - Hero: Section principale avec titre et CTA
 * - Thème hebdomadaire: Affichage du thème actif
 * - Suggestions IA: Recommandations personnalisées
 * - Découverte écologique: Contenu éco-éducatif
 *
 * NOTE:
 * Actuellement, les données sont en dur pour la démonstration.
 * Dans une version complète, elles seraient récupérées depuis l'API.
 */

'use client';

// Import des composants UI
import { Button } from '@/components/ui/button';
import { ItemCard } from '@/components/ui/item-card';
import { Footer } from '@/components/layout/footer';

// Import des icônes
import { Sparkles, ArrowRight, TrendingUp, Leaf } from 'lucide-react';

// Import de Next.js pour la navigation et images
import Link from 'next/link';
import Image from 'next/image';

/**
 * COMPOSANT: HomePage
 *
 * Page d'accueil de l'application.
 * Affiche le hero, le thème hebdomadaire, les suggestions IA et le contenu éco.
 */
export default function HomePage() {
  // Temporairement désactivé pour tester l'affichage
  // const {
  //   data: theme,
  //   isLoading,
  //   error,
  // } = useQuery({
  //   queryKey: ['activeTheme'],
  //   queryFn: () => themesApi.getActiveTheme(),
  // });

  const isLoading = false;
  const theme = null;

  // Données de démonstration pour les suggestions IA
  const aiSuggestions = [
    {
      id: '1',
      title: 'Fauteuil vintage années 70',
      image:
        'https://images.unsplash.com/photo-1577176434922-803273eba97a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwZnVybml0dXJlfGVufDF8fHx8MTc2MTA3NTk1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Mobilier',
      condition: 'Très bon',
      location: 'Paris',
      tags: ['Vintage', 'Réparable', 'Unique'],
      aiSuggested: true,
    },
    {
      id: '2',
      title: 'Veste en cuir artisanale',
      image:
        'https://images.unsplash.com/photo-1534639077088-d702bcf685e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb258ZW58MXx8fHwxNzYxMDkyNzE1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Mode',
      condition: 'Comme neuf',
      location: 'Lyon',
      tags: ['Artisanal', 'Durable', 'Tendance'],
      aiSuggested: true,
    },
    {
      id: '3',
      title: 'Céramique fait-main',
      image:
        'https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGNyYWZ0c3xlbnwxfHx8fDE3NjEwNTgxODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Artisanat',
      condition: 'Comme neuf',
      location: 'Bordeaux',
      tags: ['Fait-main', 'Unique', 'Local'],
      aiSuggested: true,
    },
    {
      id: '4',
      title: 'Appareil photo rétro',
      image:
        'https://images.unsplash.com/photo-1510222755157-fc26750f1199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRybyUyMGVsZWN0cm9uaWNzfGVufDF8fHx8MTc2MTEzNDM2MXww&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Électronique',
      condition: 'Bon',
      location: 'Marseille',
      tags: ['Rétro', 'Fonctionnel', 'Collection'],
      aiSuggested: true,
    },
  ];

  const ecoContent = [
    {
      title: "L'impact de la surconsommation",
      description:
        'Découvrez comment donner une seconde vie aux objets réduit notre empreinte carbone.',
      stat: '70% de CO₂ en moins',
    },
    {
      title: 'Économie circulaire',
      description:
        'Rejoignez un mouvement global pour un mode de vie plus responsable.',
      stat: '50k+ objets échangés',
    },
    {
      title: 'Guide de réparation',
      description:
        'Apprenez à réparer et entretenir vos objets pour prolonger leur durée de vie.',
      stat: '200+ tutoriels',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section - Design Figma (2-369) */}
      {/* Section: 1101px × 735px selon Figma - se termine à y=735, pas d'espace après */}
      <section className="relative overflow-hidden border-b border-[#27272a] bg-gradient-to-b from-[rgba(16,185,129,0.1)] via-[#0b0b0d] via-50% to-[#0b0b0d]">
        {/* Section: 1101px × 735px selon Figma */}
        <div className="mx-auto w-full max-w-[1101px] px-4 pb-[128px] pt-[128px] lg:px-[102.5px]">
          {/* Container interne: 896px de large selon Figma */}
          <div className="mx-auto w-full max-w-[896px] text-center">
            {/* Badge IA */}
            <div className="mb-[16px] inline-flex h-[38px] items-center gap-2 rounded-full border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)] px-4">
              <Sparkles className="h-4 w-4 text-[#10b981]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
                Plateforme propulsée par IA
              </span>
            </div>

            {/* Titre principal */}
            <h1 className="mb-[32px] text-[60px] leading-[60px] tracking-[0.2637px] text-[#ededee] md:text-[60px]">
              Donnez une seconde vie
              <br />
              <span className="text-[#10b981]">à vos objets</span>
            </h1>

            {/* Paragraphe descriptif */}
            <p className="mx-auto mb-[40px] max-w-[672px] text-[20px] leading-[28px] tracking-[-0.4492px] text-[#a1a1aa]">
              Échangez, revalorisez et découvrez des objets uniques grâce à
              notre plateforme éco-responsable assistée par intelligence
              artificielle.
            </p>

            {/* Boutons CTA */}
            <div className="mb-[72px] flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-[40px] rounded-[8px] bg-[#10b981] px-4 text-[14px] font-semibold leading-[20px] tracking-[-0.1504px] text-white hover:bg-[#10b981]/90"
              >
                <Link href="/new-item" className="flex items-center gap-2">
                  Proposer un objet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-[40px] rounded-[8px] border border-[#1a1a1f] bg-[rgba(26,26,31,0.3)] px-[25px] text-[14px] font-semibold leading-[20px] tracking-[-0.1504px] text-[#ededee] hover:bg-[rgba(26,26,31,0.5)]"
              >
                <Link href="/explore">Explorer le catalogue</Link>
              </Button>
            </div>

            {/* Statistiques */}
            <div className="mx-auto grid max-w-[672px] grid-cols-3 gap-[32px]">
              <div className="flex flex-col gap-2 text-center">
                <div className="text-[30px] leading-[36px] tracking-[0.3955px] text-[#ededee]">
                  50k+
                </div>
                <div className="text-sm leading-[20px] tracking-[-0.1504px] text-[#a1a1aa]">
                  Objets échangés
                </div>
              </div>
              <div className="flex flex-col gap-2 text-center">
                <div className="text-[30px] leading-[36px] tracking-[0.3955px] text-[#ededee]">
                  12k+
                </div>
                <div className="text-sm leading-[20px] tracking-[-0.1504px] text-[#a1a1aa]">
                  Membres actifs
                </div>
              </div>
              <div className="flex flex-col gap-2 text-center">
                <div className="text-[30px] leading-[36px] tracking-[0.3955px] text-[#ededee]">
                  -70%
                </div>
                <div className="text-sm leading-[20px] tracking-[-0.1504px] text-[#a1a1aa]">
                  CO₂ économisé
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thème hebdomadaire - Design Figma (2-148) */}
      {/* Section: 1024px × 955.75px selon Figma - commence à y=735, se termine à y=1690.75 */}
      {/* IMPORTANT: Pas d'espace entre les sections - la section Thème commence directement après Hero (y=735 selon Figma) */}
      <section className="mx-auto w-full max-w-[1024px] px-8 pb-[128px] pt-[128px]">
        {/* Container header: gap de 32px entre header et carte selon Figma (148-64-52=32) */}
        <div className="mb-[32px] flex h-[52px] items-center justify-between">
          {/* Header gauche */}
          <div className="flex h-[52px] flex-col gap-2">
            <div className="flex h-5 items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#10b981]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
                Cette semaine
              </span>
            </div>
            <h2 className="text-base leading-[24px] tracking-[-0.3125px] text-[#ededee]">
              Thème hebdomadaire
            </h2>
          </div>

          {/* Bouton droit */}
          <Button
            variant="ghost"
            asChild
            className="h-9 rounded-[8px] text-sm font-semibold leading-[20px] tracking-[-0.1504px] text-[#ededee]"
          >
            <Link href="/themes" className="flex items-center gap-2">
              Voir le calendrier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Carte thème - Design Figma */}
        <div className="relative h-[743.75px] w-full overflow-hidden rounded-[14px] border-2 border-[#10b981] bg-[rgba(16,185,129,0.05)]">
          {/* Image avec overlay */}
          <div className="relative h-[537.75px] w-full overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1534639077088-d702bcf685e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb258ZW58MXx8fHwxNzYxMDkyNzE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Mode Vintage & Rétro"
              fill
              className="object-cover object-center"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Badge "Thème actif" */}
            <div className="absolute left-3 top-[13px] flex h-[22px] items-center gap-2 rounded-[8px] bg-[#10b981] px-2">
              <TrendingUp className="h-3 w-3 text-white" />
              <span className="text-xs font-semibold leading-4 text-white">
                Thème actif
              </span>
            </div>

            {/* Titre et date superposés */}
            <div className="absolute bottom-0 left-3 flex flex-col gap-1 pb-4">
              <h3 className="text-base leading-[24px] tracking-[-0.3125px] text-white">
                Mode Vintage & Rétro
              </h3>
              <p className="text-sm leading-[20px] tracking-[-0.1504px] text-white/80">
                Du 20 au 26 octobre 2025
              </p>
            </div>
          </div>

          {/* Contenu en bas de la carte */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 p-5">
            {/* Description */}
            <p className="text-base leading-[24px] tracking-[-0.3125px] text-[#a1a1aa]">
              Cette semaine, redécouvrez le charme du vintage ! Vêtements,
              accessoires et pièces uniques des années passées.
            </p>

            {/* Métrique CO2 */}
            <div className="flex h-[46px] items-center gap-2 rounded-[14px] border border-[rgba(0,201,80,0.2)] bg-[rgba(0,201,80,0.1)] px-[13px]">
              <Leaf className="h-4 w-4 text-[#05df72]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#05df72]">
                En moyenne -45kg de CO₂ par vêtement échangé vs acheté neuf
              </span>
            </div>

            {/* Bouton CTA */}
            <Button
              onClick={() => (window.location.href = '/explore')}
              className="h-9 w-full rounded-[8px] bg-[#10b981] text-sm font-semibold leading-[20px] tracking-[-0.1504px] text-white hover:bg-[#10b981]/90"
            >
              Voir les suggestions
            </Button>
          </div>
        </div>
      </section>

      {/* Suggestions IA - Design Figma (2-189) */}
      {/* Section: 1024px × 672px selon Figma - commence à y=1690.75, se termine à y=2362.75 */}
      {/* IMPORTANT: Pas d'espace entre les sections */}
      <section className="relative mx-auto w-full max-w-[1024px] bg-gradient-to-b from-transparent to-[rgba(16,185,129,0.05)] px-8 pb-[128px] pt-[128px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex h-5 items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#10b981]" />
            <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
              Recommandations personnalisées
            </span>
          </div>
          <h2 className="text-base leading-[24px] tracking-[-0.3125px] text-[#ededee]">
            Suggestions par IA
          </h2>
          <p className="text-base leading-[24px] tracking-[-0.3125px] text-[#a1a1aa]">
            Objets sélectionnés spécialement pour vous selon vos intérêts
          </p>
        </div>

        {/* Grille de 4 cartes - gap 24px selon Figma */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[24px]">
          {aiSuggestions.map((item) => (
            <ItemCard
              key={item.id}
              {...item}
              aiSuggested={true}
              onClick={() => (window.location.href = '/item-detail')}
            />
          ))}
        </div>

        {/* Bouton centré */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            asChild
            className="h-9 rounded-[8px] border border-[#1a1a1f] bg-[rgba(26,26,31,0.3)] px-3 text-sm font-semibold leading-[20px] tracking-[-0.1504px] text-[#ededee] hover:bg-[rgba(26,26,31,0.5)]"
          >
            <Link href="/explore" className="flex items-center gap-2">
              Voir toutes les suggestions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Découverte écologique - Design Figma */}
      {/* Section: 1024px de large, padding top 64px, padding horizontal 32px selon Figma */}
      <section className="mx-auto w-full max-w-[1024px] px-8 pb-[128px] pt-[128px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex h-5 items-center gap-2">
            <Leaf className="h-5 w-5 text-[#05df72]" />
            <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#05df72]">
              Impact positif
            </span>
          </div>
          <h2 className="text-base leading-[24px] tracking-[-0.3125px] text-[#ededee]">
            Découverte écologique
          </h2>
          <p className="text-base leading-[24px] tracking-[-0.3125px] text-[#a1a1aa]">
            Apprenez-en plus sur l&apos;économie circulaire et son impact
          </p>
        </div>

        {/* Grille de 3 cartes - gap 24px selon Figma */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[24px]">
          {ecoContent.map((content, index) => (
            <div
              key={index}
              className="flex h-[311px] flex-col gap-[40px] rounded-[14px] border border-[#27272a] bg-[#121216] p-[25px]"
            >
              {/* Icône Leaf dans cercle */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,201,80,0.1)]">
                <Leaf className="h-6 w-6 text-[#05df72]" />
              </div>

              {/* Contenu texte */}
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="text-base leading-[24px] tracking-[-0.3125px] text-[#ededee]">
                  {content.title}
                </h3>
                <p className="text-sm leading-[20px] tracking-[-0.1504px] text-[#a1a1aa]">
                  {content.description}
                </p>
              </div>

              {/* Métrique en bas avec bordure supérieure */}
              <div className="border-t border-[#27272a] pt-5">
                <span className="text-base leading-[24px] tracking-[-0.3125px] text-[#10b981]">
                  {content.stat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

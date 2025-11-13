'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ItemCard } from '@/components/ui/item-card';
import { ThemeCard } from '@/components/ui/theme-card';
import { Footer } from '@/components/layout/footer';
import { Sparkles, ArrowRight, TrendingUp, Leaf } from 'lucide-react';
import Link from 'next/link';

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
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-20 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Plateforme propulsée par IA</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl">
              Donnez une seconde vie
              <br />
              <span className="text-primary">à vos objets</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Échangez, revalorisez et découvrez des objets uniques grâce à
              notre plateforme éco-responsable assistée par intelligence
              artificielle.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-primary px-8 hover:bg-primary/90"
              >
                <Link href="/new-item">
                  Proposer un objet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/explore">Explorer le catalogue</Link>
              </Button>
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-8 pt-12">
              <div className="text-center">
                <div className="mb-2 text-3xl">50k+</div>
                <div className="text-sm text-muted-foreground">
                  Objets échangés
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl">12k+</div>
                <div className="text-sm text-muted-foreground">
                  Membres actifs
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl">-70%</div>
                <div className="text-sm text-muted-foreground">
                  CO₂ économisé
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thème de la semaine */}
      <section className="container mx-auto px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary">Cette semaine</span>
            </div>
            <h2>Thème hebdomadaire</h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/themes">
              Voir le calendrier
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ThemeCard
          title="Mode Vintage & Rétro"
          image="https://images.unsplash.com/photo-1534639077088-d702bcf685e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb258ZW58MXx8fHwxNzYxMDkyNzE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
          period="Du 20 au 26 octobre 2025"
          description="Cette semaine, redécouvrez le charme du vintage ! Vêtements, accessoires et pièces uniques des années passées."
          impact="En moyenne -45kg de CO₂ par vêtement échangé vs acheté neuf"
          isActive={true}
          onExplore={() => (window.location.href = '/explore')}
        />
      </section>

      {/* Suggestions IA */}
      <section className="container mx-auto bg-gradient-to-b from-transparent to-primary/5 px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary">
                Recommandations personnalisées
              </span>
            </div>
            <h2>Suggestions par IA</h2>
            <p className="mt-2 text-muted-foreground">
              Objets sélectionnés spécialement pour vous selon vos intérêts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aiSuggestions.map((item) => (
            <ItemCard
              key={item.id}
              {...item}
              onClick={() => (window.location.href = '/item-detail')}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/explore">
              Voir toutes les suggestions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Découverte écologique */}
      <section className="container mx-auto px-4 py-16 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-400">Impact positif</span>
          </div>
          <h2>Découverte écologique</h2>
          <p className="mt-2 text-muted-foreground">
            Apprenez-en plus sur l'économie circulaire et son impact
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ecoContent.map((content, index) => (
            <Card
              key={index}
              className="group cursor-pointer space-y-4 border-border bg-card p-6 transition-all hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <Leaf className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="mb-2 transition-colors group-hover:text-primary">
                  {content.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {content.description}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <span className="text-primary">{content.stat}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/**
 * Page: Impact Écologique
 * Route: /a-propos/impact-ecologique
 */

import { Metadata } from 'next';
import { Leaf, TrendingDown, Recycle, TreePine, Droplets, Factory, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export const metadata: Metadata = {
  title: 'Impact Écologique | SecondLife Exchange',
  description: 'Découvrez l\'impact environnemental positif de SecondLife Exchange : CO₂ économisé, ressources préservées, et notre engagement pour la planète.',
};

export default function ImpactEcologiquePage() {
  const stats = [
    {
      icon: TrendingDown,
      value: '847 tonnes',
      label: 'CO₂ économisé',
      description: 'Grâce aux échanges réalisés sur notre plateforme',
      color: 'text-[#10b981]',
      bgColor: 'bg-[rgba(16,185,129,0.1)]',
    },
    {
      icon: Recycle,
      value: '50 000+',
      label: 'Objets échangés',
      description: 'Une seconde vie pour chaque objet',
      color: 'text-[#05df72]',
      bgColor: 'bg-[rgba(0,201,80,0.1)]',
    },
    {
      icon: TreePine,
      value: '12 000',
      label: 'Arbres équivalents',
      description: 'En compensation carbone annuelle',
      color: 'text-[#22c55e]',
      bgColor: 'bg-[rgba(34,197,94,0.1)]',
    },
    {
      icon: Droplets,
      value: '2.3M litres',
      label: 'Eau économisée',
      description: 'En évitant la production de nouveaux objets',
      color: 'text-[#3b82f6]',
      bgColor: 'bg-[rgba(59,130,246,0.1)]',
    },
  ];

  const impacts = [
    {
      category: 'Électronique',
      co2Saved: '45 kg',
      example: 'Un smartphone reconditionné = 45 kg de CO₂ évités',
      icon: '📱',
    },
    {
      category: 'Textile',
      co2Saved: '25 kg',
      example: 'Un jean d\'occasion = 25 kg de CO₂ évités',
      icon: '👖',
    },
    {
      category: 'Mobilier',
      co2Saved: '120 kg',
      example: 'Un canapé réutilisé = 120 kg de CO₂ évités',
      icon: '🛋️',
    },
    {
      category: 'Livres',
      co2Saved: '2 kg',
      example: 'Un livre d\'occasion = 2 kg de CO₂ évités',
      icon: '📚',
    },
    {
      category: 'Jouets',
      co2Saved: '8 kg',
      example: 'Un jouet échangé = 8 kg de CO₂ évités',
      icon: '🧸',
    },
    {
      category: 'Équipement sportif',
      co2Saved: '35 kg',
      example: 'Un vélo d\'occasion = 35 kg de CO₂ évités',
      icon: '🚴',
    },
  ];

  const commitments = [
    {
      title: 'Serveurs verts',
      description: 'Nos infrastructures fonctionnent à 100% avec de l\'énergie renouvelable.',
      icon: Factory,
    },
    {
      title: 'Compensation carbone',
      description: 'Nous compensons les émissions résiduelles via des projets de reforestation.',
      icon: TreePine,
    },
    {
      title: 'Transparence totale',
      description: 'Nous publions un rapport d\'impact environnemental chaque trimestre.',
      icon: Leaf,
    },
  ];

  return (
    <>
      <PageHero
        icon={Leaf}
        badge="Impact environnemental"
        badgeColor="eco"
        title="Chaque échange compte"
        subtitle="Découvrez comment vos échanges contribuent à réduire notre empreinte carbone collective et à préserver les ressources de notre planète."
      />

      {/* Section: Statistiques globales */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className={`mb-1 text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="mb-2 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {stat.label}
              </div>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {stat.description}
              </p>
              
              {/* Decoration */}
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.bgColor} opacity-50`} />
            </div>
          ))}
        </div>
      </section>

      {/* Section: Impact par catégorie */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Impact par catégorie d'objet
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Chaque type d'objet a son propre impact. Voici combien vous économisez en CO₂ par échange.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {impacts.map((impact, index) => (
            <div
              key={index}
              className="group flex items-start gap-4 rounded-xl border border-[#e4e4e7] bg-white p-5 transition-all hover:border-[#10b981]/30 hover:shadow-lg dark:border-[#27272a] dark:bg-[#121216]"
            >
              <span className="text-3xl">{impact.icon}</span>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                    {impact.category}
                  </h3>
                  <span className="rounded-full bg-[rgba(16,185,129,0.1)] px-2 py-0.5 text-xs font-bold text-[#10b981]">
                    -{impact.co2Saved}
                  </span>
                </div>
                <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  {impact.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Visualisation */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-gradient-to-br from-[rgba(16,185,129,0.1)] via-white to-[rgba(0,201,80,0.05)] p-8 dark:border-[#27272a] dark:via-[#121216] sm:p-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                Votre impact personnel
              </h2>
              <p className="mb-6 text-[#71717a] dark:text-[#a1a1aa]">
                En rejoignant SecondLife Exchange, vous contribuez directement à la réduction des émissions de CO₂. 
                Chaque objet que vous échangez au lieu d'acheter neuf représente une victoire pour la planète.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] text-white">
                    1
                  </div>
                  <span className="text-[#0b0b0d] dark:text-[#ededee]">Proposez un objet que vous n'utilisez plus</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] text-white">
                    2
                  </div>
                  <span className="text-[#0b0b0d] dark:text-[#ededee]">Échangez avec un membre de la communauté</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] text-white">
                    3
                  </div>
                  <span className="text-[#0b0b0d] dark:text-[#ededee]">Suivez votre impact sur votre profil</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="flex h-48 w-48 items-center justify-center rounded-full border-8 border-[#10b981] bg-white dark:bg-[#121216]">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#10b981]">-70%</div>
                    <div className="text-sm text-[#71717a] dark:text-[#a1a1aa]">CO₂ moyen</div>
                    <div className="text-sm text-[#71717a] dark:text-[#a1a1aa]">par échange</div>
                  </div>
                </div>
                <Leaf className="absolute -right-2 -top-2 h-10 w-10 text-[#05df72]" />
                <Recycle className="absolute -bottom-2 -left-2 h-10 w-10 text-[#10b981]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Nos engagements */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Nos engagements environnementaux
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Au-delà de faciliter les échanges, nous nous engageons à minimiser notre propre impact.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {commitments.map((commitment, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e4e4e7] bg-white p-6 text-center dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <commitment.icon className="h-7 w-7 text-[#10b981]" />
              </div>
              <h3 className="mb-2 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {commitment.title}
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {commitment.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        icon={Leaf}
        title="Faites la différence"
        description="Rejoignez les milliers de membres qui contribuent chaque jour à un avenir plus durable."
        primaryAction={{ label: 'Rejoindre la communauté', href: '/register' }}
        secondaryAction={{ label: 'Voir les échanges', href: '/explore' }}
        variant="eco"
      />
    </>
  );
}

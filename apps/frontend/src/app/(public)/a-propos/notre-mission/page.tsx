/**
 * Page: Notre Mission
 * Route: /a-propos/notre-mission
 */

import { Metadata } from 'next';
import { Target, Heart, Leaf, Users, Sparkles, Globe } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export const metadata: Metadata = {
  title: 'Notre Mission | SecondLife Exchange',
  description: 'Découvrez la mission de SecondLife Exchange : promouvoir l\'économie circulaire et donner une seconde vie aux objets grâce à l\'IA.',
};

export default function NotreMissionPage() {
  const values = [
    {
      icon: Heart,
      title: 'Engagement écologique',
      description: 'Chaque échange contribue à réduire notre empreinte carbone. Nous croyons qu\'une consommation responsable est possible.',
    },
    {
      icon: Users,
      title: 'Communauté solidaire',
      description: 'Nous construisons une communauté où chaque membre peut donner et recevoir, créant des liens durables.',
    },
    {
      icon: Sparkles,
      title: 'Innovation responsable',
      description: 'Notre IA suggère des échanges pertinents tout en respectant vos données et votre vie privée.',
    },
    {
      icon: Globe,
      title: 'Impact local et global',
      description: 'Des échanges de proximité qui, ensemble, créent un mouvement mondial pour la planète.',
    },
  ];

  const milestones = [
    { year: '2023', event: 'Fondation de SecondLife Exchange', description: 'Née d\'une idée simple : et si on pouvait échanger plutôt que jeter ?' },
    { year: '2024', event: 'Lancement de l\'IA de matching', description: 'Introduction de notre système intelligent pour des suggestions d\'échanges personnalisées.' },
    { year: '2025', event: '50 000 objets échangés', description: 'Un cap symbolique qui représente des tonnes de CO₂ économisées.' },
    { year: '2026', event: 'Expansion internationale', description: 'SecondLife Exchange s\'ouvre à de nouveaux pays européens.' },
  ];

  return (
    <>
      <PageHero
        icon={Target}
        badge="Notre raison d'être"
        badgeColor="primary"
        title="Donner une seconde vie à vos objets"
        subtitle="SecondLife Exchange est né d'une conviction : chaque objet mérite de trouver quelqu'un qui saura l'apprécier. Notre mission est de faciliter les échanges responsables grâce à la technologie."
      />

      {/* Section: Notre vision */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[#05df72]" />
              <span className="text-sm font-medium text-[#05df72]">Notre vision</span>
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              Un monde où rien ne se perd
            </h2>
            <p className="mb-4 text-[#71717a] dark:text-[#a1a1aa]">
              Nous imaginons un futur où l'économie circulaire est la norme, pas l'exception. Un monde où chaque objet trouve une nouvelle utilité, où le partage remplace le gaspillage.
            </p>
            <p className="text-[#71717a] dark:text-[#a1a1aa]">
              Grâce à notre plateforme propulsée par l'intelligence artificielle, nous rendons les échanges simples, intuitifs et bénéfiques pour tous – pour vous, pour votre communauté, et pour la planète.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-64 w-64 rounded-full bg-gradient-to-br from-[rgba(16,185,129,0.2)] to-[rgba(0,201,80,0.1)]">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[rgba(16,185,129,0.3)] to-[rgba(0,201,80,0.2)]">
                <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[#10b981]">
                  <Leaf className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Nos valeurs */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Nos valeurs fondamentales
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Ces principes guident chacune de nos décisions et façonnent notre plateforme.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {values.map((value, index) => (
            <div
              key={index}
              className="group rounded-xl border border-[#e4e4e7] bg-white p-6 transition-all hover:border-[#10b981]/30 hover:shadow-lg dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)] transition-colors group-hover:bg-[rgba(16,185,129,0.2)]">
                <value.icon className="h-6 w-6 text-[#10b981]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {value.title}
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Timeline */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Notre histoire
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Les grandes étapes de notre aventure vers un monde plus durable.
          </p>
        </div>
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-[#10b981] to-[#05df72] sm:left-1/2 sm:-translate-x-1/2" />
          
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className={`relative mb-8 flex items-start gap-6 ${
                index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
              }`}
            >
              {/* Point sur la timeline */}
              <div className="absolute left-4 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-[#10b981] sm:left-1/2">
                <div className="h-3 w-3 rounded-full bg-white" />
              </div>
              
              {/* Contenu */}
              <div className={`ml-12 w-full sm:ml-0 sm:w-[calc(50%-2rem)] ${index % 2 === 0 ? 'sm:pr-8 sm:text-right' : 'sm:pl-8'}`}>
                <span className="text-sm font-bold text-[#10b981]">{milestone.year}</span>
                <h3 className="mb-1 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {milestone.event}
                </h3>
                <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  {milestone.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        icon={Heart}
        title="Rejoignez le mouvement"
        description="Chaque objet échangé compte. Commencez votre aventure dès aujourd'hui."
        primaryAction={{ label: 'Proposer un objet', href: '/item/new' }}
        secondaryAction={{ label: 'Explorer', href: '/explore' }}
        variant="eco"
      />
    </>
  );
}

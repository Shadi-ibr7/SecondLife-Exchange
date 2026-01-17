/**
 * Page: Partenaires
 * Route: /a-propos/partenaires
 */

import { Metadata } from 'next';
import { Handshake, Building2, Award, Globe, Mail, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export const metadata: Metadata = {
  title: 'Nos Partenaires | SecondLife Exchange',
  description: 'Découvrez les partenaires qui soutiennent SecondLife Exchange dans sa mission pour une économie plus circulaire et durable.',
};

export default function PartenairesPage() {
  const mainPartners = [
    {
      name: 'EcoTech Foundation',
      category: 'Fondation environnementale',
      description: 'Soutient nos initiatives de sensibilisation à l\'économie circulaire et finance nos programmes éducatifs.',
      logo: '🌍',
    },
    {
      name: 'GreenLogistics',
      category: 'Logistique durable',
      description: 'Partenaire logistique privilégié pour des livraisons à faible empreinte carbone entre membres.',
      logo: '🚛',
    },
    {
      name: 'Circular Labs',
      category: 'Recherche & Innovation',
      description: 'Collabore avec nous sur l\'amélioration continue de nos algorithmes d\'IA pour un matching optimal.',
      logo: '🔬',
    },
  ];

  const institutionalPartners = [
    { name: 'ADEME', description: 'Agence de la transition écologique' },
    { name: 'Ministère de l\'Environnement', description: 'Soutien institutionnel' },
    { name: 'European Circular Economy Network', description: 'Réseau européen' },
    { name: 'Zero Waste France', description: 'Association partenaire' },
  ];

  const mediaPartners = [
    { name: 'TechGreen Magazine', logo: '📰' },
    { name: 'Sustainable Living', logo: '🌱' },
    { name: 'EcoNews Daily', logo: '📺' },
    { name: 'Future Planet', logo: '🌏' },
  ];

  const benefits = [
    {
      icon: Globe,
      title: 'Visibilité',
      description: 'Accédez à notre communauté de 12 000+ membres engagés.',
    },
    {
      icon: Award,
      title: 'Impact mesurable',
      description: 'Rapport d\'impact détaillé et certifié pour votre RSE.',
    },
    {
      icon: Building2,
      title: 'Co-création',
      description: 'Participez à façonner l\'avenir de l\'économie circulaire.',
    },
  ];

  return (
    <>
      <PageHero
        icon={Handshake}
        badge="Ensemble pour la planète"
        badgeColor="primary"
        title="Nos partenaires"
        subtitle="SecondLife Exchange est soutenu par un écosystème de partenaires engagés qui partagent notre vision d'un monde plus durable."
      />

      {/* Section: Partenaires principaux */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Partenaires stratégiques
          </h2>
          <p className="text-[#71717a] dark:text-[#a1a1aa]">
            Ils nous accompagnent au quotidien dans notre mission.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {mainPartners.map((partner, index) => (
            <div
              key={index}
              className="group rounded-xl border border-[#e4e4e7] bg-white p-6 transition-all hover:border-[#10b981]/30 hover:shadow-xl dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(16,185,129,0.2)] to-[rgba(0,201,80,0.1)] text-4xl">
                {partner.logo}
              </div>
              <span className="mb-2 inline-block rounded-full bg-[rgba(16,185,129,0.1)] px-3 py-1 text-xs font-medium text-[#10b981]">
                {partner.category}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {partner.name}
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {partner.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Partenaires institutionnels */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-8 dark:border-[#27272a] dark:bg-[#121216]">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="h-6 w-6 text-[#10b981]" />
            <h2 className="text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              Partenaires institutionnels
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {institutionalPartners.map((partner, index) => (
              <div
                key={index}
                className="rounded-lg border border-[#e4e4e7] bg-[#fafafa] p-4 dark:border-[#27272a] dark:bg-[#0b0b0d]"
              >
                <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {partner.name}
                </h3>
                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Partenaires média */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Ils parlent de nous
          </h2>
          <p className="text-[#71717a] dark:text-[#a1a1aa]">
            Médias et influenceurs qui relaient notre message.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {mediaPartners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-full border border-[#e4e4e7] bg-white px-6 py-3 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <span className="text-2xl">{partner.logo}</span>
              <span className="font-medium text-[#0b0b0d] dark:text-[#ededee]">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Devenir partenaire */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border-2 border-dashed border-[#10b981]/40 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent p-8 sm:p-12">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              Devenez partenaire
            </h2>
            <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
              Rejoignez notre réseau de partenaires et contribuez à bâtir un avenir plus durable tout en bénéficiant d'avantages uniques.
            </p>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                  <benefit.icon className="h-6 w-6 text-[#10b981]" />
                </div>
                <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <a
              href="mailto:partenaires@secondlife-exchange.com"
              className="flex items-center gap-2 rounded-lg bg-[#10b981] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
            >
              <Mail className="h-5 w-5" />
              Contactez-nous
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <CTASection
        icon={Handshake}
        title="Rejoignez l'aventure"
        description="Que vous soyez une entreprise, une association ou un média, construisons ensemble un monde plus circulaire."
        primaryAction={{ label: 'Proposer un partenariat', href: 'mailto:partenaires@secondlife-exchange.com' }}
        secondaryAction={{ label: 'Notre mission', href: '/a-propos/notre-mission' }}
      />
    </>
  );
}

/**
 * Page: Règles de la communauté
 * Route: /communaute/regles
 */

import { Metadata } from 'next';
import { Scale, Heart, ShieldCheck, Ban, AlertTriangle, CheckCircle, XCircle, Flag } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export const metadata: Metadata = {
  title: 'Règles de la communauté | SecondLife Exchange',
  description: 'Découvrez les règles de notre communauté pour garantir des échanges respectueux, sécurisés et bienveillants sur SecondLife Exchange.',
};

export default function ReglesPage() {
  const principles = [
    {
      icon: Heart,
      title: 'Respect & Bienveillance',
      description: 'Traitez chaque membre avec respect. Nous sommes une communauté diverse et inclusive où chacun est le bienvenu.',
    },
    {
      icon: ShieldCheck,
      title: 'Honnêteté & Transparence',
      description: 'Décrivez vos objets avec exactitude. La confiance est le fondement de notre plateforme.',
    },
    {
      icon: Scale,
      title: 'Équité & Fair-play',
      description: 'Les échanges doivent être équilibrés et mutuellement bénéfiques. Pas de pratiques commerciales déguisées.',
    },
  ];

  const allowedItems = [
    'Vêtements et accessoires en bon état',
    'Livres, jeux et DVD',
    'Électronique fonctionnelle',
    'Mobilier et décoration',
    'Articles de sport',
    'Jouets et puériculture',
    'Objets de collection',
    'Instruments de musique',
  ];

  const forbiddenItems = [
    'Armes et objets dangereux',
    'Médicaments et produits de santé',
    'Animaux vivants',
    'Contrefaçons et articles volés',
    'Alcool, tabac et drogues',
    'Documents officiels',
    'Contenus à caractère adulte',
    'Articles rappelés pour sécurité',
  ];

  const behaviors = {
    expected: [
      'Répondre aux messages dans un délai raisonnable',
      'Se présenter aux rendez-vous convenus',
      'Confirmer les échanges sur la plateforme',
      'Laisser des avis constructifs',
      'Signaler les comportements inappropriés',
    ],
    prohibited: [
      'Harcèlement ou discrimination',
      'Fausses annonces ou escroqueries',
      'Spam ou publicité non sollicitée',
      'Création de comptes multiples',
      'Contournement du système d\'échange',
    ],
  };

  const sanctions = [
    { level: 'Avertissement', description: 'Premier manquement mineur', color: 'text-[#eab308]' },
    { level: 'Suspension temporaire', description: 'Récidive ou manquement grave', color: 'text-[#f97316]' },
    { level: 'Bannissement définitif', description: 'Comportement inacceptable', color: 'text-[#ef4444]' },
  ];

  return (
    <>
      <PageHero
        icon={Scale}
        badge="Règles communautaires"
        badgeColor="primary"
        title="Nos règles de vie commune"
        subtitle="Ces règles permettent à chacun de profiter d'une expérience d'échange agréable et sécurisée. En utilisant SecondLife Exchange, vous vous engagez à les respecter."
      />

      {/* Section: Principes fondamentaux */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Nos principes fondamentaux
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Trois valeurs guident notre communauté.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {principles.map((principle, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e4e4e7] bg-white p-6 text-center dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <principle.icon className="h-7 w-7 text-[#10b981]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {principle.title}
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Objets autorisés / interdits */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <h2 className="mb-8 text-center text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
          Objets sur la plateforme
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Autorisés */}
          <div className="rounded-xl border border-[#10b981]/30 bg-[rgba(16,185,129,0.05)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-[#10b981]" />
              <h3 className="text-lg font-semibold text-[#10b981]">Objets autorisés</h3>
            </div>
            <ul className="space-y-2">
              {allowedItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-[#0b0b0d] dark:text-[#ededee]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Interdits */}
          <div className="rounded-xl border border-[#ef4444]/30 bg-[rgba(239,68,68,0.05)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-[#ef4444]" />
              <h3 className="text-lg font-semibold text-[#ef4444]">Objets interdits</h3>
            </div>
            <ul className="space-y-2">
              {forbiddenItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-[#0b0b0d] dark:text-[#ededee]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Comportements */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <h2 className="mb-8 text-center text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
          Comportements attendus
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Attendus */}
          <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <CheckCircle className="h-5 w-5 text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">Ce que nous attendons</h3>
            </div>
            <ul className="space-y-3">
              {behaviors.expected.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Prohibés */}
          <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)]">
                <Ban className="h-5 w-5 text-[#ef4444]" />
              </div>
              <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">Ce qui est interdit</h3>
            </div>
            <ul className="space-y-3">
              {behaviors.prohibited.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ef4444]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Sanctions */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-8 dark:border-[#27272a] dark:bg-[#121216]">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-[#f97316]" />
            <h2 className="text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              En cas de non-respect
            </h2>
          </div>
          <p className="mb-6 text-[#71717a] dark:text-[#a1a1aa]">
            Les manquements aux règles sont traités de manière proportionnée :
          </p>
          <div className="space-y-4">
            {sanctions.map((sanction, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-[#e4e4e7] bg-[#fafafa] p-4 dark:border-[#27272a] dark:bg-[#0b0b0d]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f5] text-lg font-bold text-[#71717a] dark:bg-[#27272a]">
                    {index + 1}
                  </div>
                  <span className={`font-semibold ${sanction.color}`}>{sanction.level}</span>
                </div>
                <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">{sanction.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Signaler */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border-2 border-dashed border-[#10b981]/40 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent p-8 text-center">
          <Flag className="mx-auto mb-4 h-10 w-10 text-[#10b981]" />
          <h2 className="mb-3 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Vous constatez un problème ?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-[#71717a] dark:text-[#a1a1aa]">
            N'hésitez pas à nous signaler tout comportement ou contenu inapproprié. Nous traitons chaque signalement avec sérieux.
          </p>
          <a
            href="/aide/signaler"
            className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
          >
            <Flag className="h-5 w-5" />
            Faire un signalement
          </a>
        </div>
      </section>

      <CTASection
        icon={Heart}
        title="Ensemble, créons une communauté exemplaire"
        description="En respectant ces règles, vous contribuez à faire de SecondLife Exchange un espace sûr et agréable pour tous."
        primaryAction={{ label: 'Rejoindre la communauté', href: '/register' }}
        secondaryAction={{ label: 'Guide d\'échange', href: '/communaute/guide-echange' }}
      />
    </>
  );
}

/**
 * Page: Guide d'échange
 * Route: /communaute/guide-echange
 */

'use client';

import { BookOpen, Camera, MessageSquare, Truck, Star, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export default function GuideEchangePage() {
  const steps = [
    {
      number: 1,
      icon: Camera,
      title: 'Photographiez votre objet',
      description: 'Prenez des photos claires sous plusieurs angles. Une bonne luminosité naturelle fait toute la différence.',
      tips: [
        'Utilisez un fond neutre',
        'Montrez les détails et les éventuels défauts',
        'Prenez au moins 3 photos',
      ],
    },
    {
      number: 2,
      icon: BookOpen,
      title: 'Rédigez une description honnête',
      description: 'Décrivez votre objet avec précision : état, dimensions, particularités. L\'honnêteté crée la confiance.',
      tips: [
        'Mentionnez la marque et le modèle',
        'Précisez l\'état réel de l\'objet',
        'Indiquez ce que vous recherchez en échange',
      ],
    },
    {
      number: 3,
      icon: MessageSquare,
      title: 'Échangez avec la communauté',
      description: 'Répondez aux messages, négociez avec respect. Notre messagerie sécurisée facilite la communication.',
      tips: [
        'Répondez dans les 24h',
        'Posez des questions sur l\'objet proposé',
        'Convenez d\'un lieu de rencontre sûr',
      ],
    },
    {
      number: 4,
      icon: Truck,
      title: 'Finalisez l\'échange',
      description: 'Rencontrez-vous dans un lieu public ou utilisez notre service de livraison partenaire pour plus de simplicité.',
      tips: [
        'Privilégiez les lieux publics',
        'Vérifiez l\'objet avant de finaliser',
        'Confirmez l\'échange sur l\'app',
      ],
    },
    {
      number: 5,
      icon: Star,
      title: 'Évaluez votre expérience',
      description: 'Laissez un avis honnête pour aider la communauté et construire votre réputation.',
      tips: [
        'Soyez constructif dans vos commentaires',
        'Notez la communication et la fiabilité',
        'Encouragez les bons comportements',
      ],
    },
  ];

  const bestPractices = [
    {
      icon: Shield,
      title: 'Sécurité avant tout',
      description: 'Rencontrez-vous toujours dans des lieux publics. N\'envoyez jamais d\'argent à l\'avance.',
    },
    {
      icon: CheckCircle2,
      title: 'Photos authentiques',
      description: 'Utilisez toujours vos propres photos. Les images trouvées sur internet sont interdites.',
    },
    {
      icon: MessageSquare,
      title: 'Communication claire',
      description: 'Gardez toutes les conversations sur la plateforme pour votre protection.',
    },
    {
      icon: Star,
      title: 'Respect mutuel',
      description: 'Traitez les autres comme vous aimeriez être traité. La courtoisie va loin.',
    },
  ];

  return (
    <>
      <PageHero
        icon={BookOpen}
        badge="Guide pratique"
        badgeColor="primary"
        title="Comment échanger sur SecondLife"
        subtitle="Suivez notre guide étape par étape pour réussir vos échanges et rejoindre une communauté de partage bienveillante."
      />

      {/* Section: Les étapes */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Les 5 étapes d'un échange réussi
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            De la publication à l'évaluation, voici tout ce que vous devez savoir.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-6 transition-all hover:border-[#10b981]/30 hover:shadow-lg dark:border-[#27272a] dark:bg-[#121216] md:p-8"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                {/* Numéro et icône */}
                <div className="flex items-center gap-4 md:flex-col md:items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981] text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  <step.icon className="h-6 w-6 text-[#10b981] md:mt-2" />
                </div>

                {/* Contenu */}
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                    {step.title}
                  </h3>
                  <p className="mb-4 text-[#71717a] dark:text-[#a1a1aa]">
                    {step.description}
                  </p>

                  {/* Tips */}
                  <div className="rounded-lg bg-[rgba(16,185,129,0.05)] p-4">
                    <p className="mb-2 text-sm font-medium text-[#10b981]">💡 Conseils</p>
                    <ul className="space-y-1">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Connecteur */}
              {index < steps.length - 1 && (
                <div className="absolute -bottom-4 left-7 hidden h-8 w-0.5 bg-gradient-to-b from-[#10b981] to-[#10b981]/20 md:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section: Bonnes pratiques */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent p-8 dark:border-[#27272a]">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              Les bonnes pratiques
            </h2>
            <p className="text-[#71717a] dark:text-[#a1a1aa]">
              Quelques règles d'or pour une expérience optimale.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                  <practice.icon className="h-5 w-5 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                    {practice.title}
                  </h3>
                  <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    {practice.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: FAQ rapide */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Questions fréquentes
          </h2>
          <a
            href="/aide/faq"
            className="flex items-center gap-1 text-sm font-medium text-[#10b981] hover:underline"
          >
            Voir toutes les FAQ
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="space-y-4">
          {[
            { q: 'Puis-je annuler un échange ?', a: 'Oui, tant que l\'échange n\'est pas finalisé. Prévenez l\'autre membre dès que possible.' },
            { q: 'Que faire si l\'objet ne correspond pas ?', a: 'Signalez le problème via l\'app. Notre équipe médiation interviendra dans les 24h.' },
            { q: 'Les échanges sont-ils vraiment gratuits ?', a: 'Oui ! SecondLife Exchange est gratuit. Seuls les frais de livraison sont à votre charge si applicable.' },
          ].map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <h3 className="mb-2 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {faq.q}
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        icon={BookOpen}
        title="Prêt à commencer ?"
        description="Maintenant que vous connaissez les bases, lancez-vous dans votre premier échange !"
        primaryAction={{ label: 'Proposer un objet', href: '/item/new' }}
        secondaryAction={{ label: 'Explorer les objets', href: '/explore' }}
      />
    </>
  );
}

/**
 * Page: Sécurité
 * Route: /aide/securite
 */

'use client';

import { Shield, Lock, Eye, AlertTriangle, CheckCircle, UserCheck, MapPin, MessageSquare, CreditCard, Flag } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export default function SecuritePage() {
  const securityFeatures = [
    {
      icon: UserCheck,
      title: 'Vérification des profils',
      description: 'Les membres peuvent vérifier leur identité pour gagner un badge de confiance visible sur leur profil.',
    },
    {
      icon: Lock,
      title: 'Messagerie chiffrée',
      description: 'Toutes vos conversations sont chiffrées de bout en bout. Personne ne peut les lire à part vous.',
    },
    {
      icon: Eye,
      title: 'Modération 24/7',
      description: 'Notre équipe modération surveille la plateforme en permanence pour garantir un environnement sain.',
    },
    {
      icon: Shield,
      title: 'Protection des données',
      description: 'Vos données personnelles sont protégées selon les standards les plus stricts (RGPD).',
    },
  ];

  const safetyTips = [
    {
      category: 'Avant l\'échange',
      icon: '🔍',
      tips: [
        'Consultez le profil et les avis du membre',
        'Vérifiez que le membre a un badge de confiance',
        'Posez des questions sur l\'objet (photos supplémentaires, détails)',
        'Méfiez-vous des offres trop belles pour être vraies',
      ],
    },
    {
      category: 'Communication',
      icon: '💬',
      tips: [
        'Gardez toutes les conversations sur la plateforme',
        'Ne partagez jamais votre numéro de téléphone ou adresse personnelle trop tôt',
        'Méfiez-vous des liens externes ou des demandes de paiement',
        'Signalez tout comportement suspect immédiatement',
      ],
    },
    {
      category: 'Rencontre physique',
      icon: '🤝',
      tips: [
        'Rencontrez-vous toujours dans un lieu public et fréquenté',
        'Prévenez un proche de votre rendez-vous',
        'Allez-y de préférence accompagné(e)',
        'Vérifiez l\'objet sur place avant de finaliser l\'échange',
      ],
    },
    {
      category: 'Après l\'échange',
      icon: '✅',
      tips: [
        'Confirmez l\'échange sur l\'application',
        'Laissez un avis honnête sur le membre',
        'Signalez tout problème à notre équipe support',
        'Conservez les preuves (messages, photos) en cas de litige',
      ],
    },
  ];

  const redFlags = [
    'Demande de paiement avant l\'échange',
    'Pression pour sortir de la plateforme (WhatsApp, email)',
    'Profil récent avec peu d\'informations',
    'Photos provenant d\'internet (recherche inversée possible)',
    'Refus de montrer l\'objet en vidéo ou de répondre aux questions',
    'Conditions de rencontre inhabituelles (lieu isolé, horaire tardif)',
    'Offres trop avantageuses ou urgentes',
    'Erreurs de français suspectes ou réponses génériques',
  ];

  const whatToDo = [
    {
      situation: 'Message suspect',
      action: 'Cliquez sur "Signaler" dans la conversation et bloquez le membre.',
      icon: MessageSquare,
    },
    {
      situation: 'Annonce frauduleuse',
      action: 'Utilisez le bouton "Signaler" sur l\'annonce. Nous la retirerons sous 24h.',
      icon: Flag,
    },
    {
      situation: 'Tentative d\'arnaque',
      action: 'Contactez immédiatement notre support et conservez toutes les preuves.',
      icon: AlertTriangle,
    },
    {
      situation: 'Problème lors de l\'échange',
      action: 'Utilisez notre service de médiation pour trouver une solution équitable.',
      icon: Shield,
    },
  ];

  return (
    <>
      <PageHero
        icon={Shield}
        badge="Votre sécurité"
        badgeColor="primary"
        title="Échangez en toute confiance"
        subtitle="Votre sécurité est notre priorité absolue. Découvrez comment nous vous protégeons et les bonnes pratiques à adopter."
      />

      {/* Section: Nos mesures de sécurité */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Ce que nous faisons pour vous protéger
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Des mesures techniques et humaines pour un environnement sécurisé.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <feature.icon className="h-6 w-6 text-[#10b981]" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Conseils de sécurité */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Conseils pour des échanges sécurisés
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Suivez ces bonnes pratiques à chaque étape de votre échange.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {safetyTips.map((category, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl">{category.icon}</span>
                <h3 className="text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {category.category}
                </h3>
              </div>
              <ul className="space-y-3">
                {category.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start gap-2 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Red flags */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#ef4444]/30 bg-[rgba(239,68,68,0.05)] p-8">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-[#ef4444]" />
            <h2 className="text-xl font-semibold text-[#ef4444]">
              Signaux d'alerte à surveiller
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {redFlags.map((flag, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-white p-3 dark:bg-[#121216]"
              >
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#ef4444]" />
                <span className="text-sm text-[#0b0b0d] dark:text-[#ededee]">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Que faire si... */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Que faire si...
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Les bons réflexes en cas de problème.
          </p>
        </div>
        <div className="space-y-4">
          {whatToDo.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <item.icon className="h-5 w-5 text-[#10b981]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {item.situation}
                </h3>
                <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Contact d'urgence */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="rounded-xl border-2 border-[#10b981] bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-transparent p-8 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-[#10b981]" />
          <h2 className="mb-3 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Besoin d'aide urgente ?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-[#71717a] dark:text-[#a1a1aa]">
            Notre équipe de sécurité est disponible 7j/7 pour les situations urgentes.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/aide/signaler"
              className="flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
            >
              <Flag className="h-5 w-5" />
              Faire un signalement
            </a>
            <a
              href="/aide/contact"
              className="rounded-lg border border-[#e4e4e7] bg-white px-6 py-3 font-semibold text-[#0b0b0d] transition-colors hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#121216] dark:text-[#ededee]"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </section>

      <CTASection
        icon={Shield}
        title="La sécurité, c'est l'affaire de tous"
        description="En respectant ces conseils, vous contribuez à faire de SecondLife Exchange un espace de confiance pour tous."
        primaryAction={{ label: 'Voir les règles', href: '/communaute/regles' }}
        secondaryAction={{ label: 'Commencer à échanger', href: '/explore' }}
      />
    </>
  );
}

/**
 * Page: L'Équipe
 * Route: /a-propos/equipe
 */

import { Metadata } from 'next';
import { Users, Linkedin, Github, Mail, Heart } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export const metadata: Metadata = {
  title: 'Notre Équipe | SecondLife Exchange',
  description: 'Découvrez l\'équipe passionnée derrière SecondLife Exchange, unis par la volonté de créer un monde plus durable.',
};

export default function EquipePage() {
  const team = [
    {
      name: 'Marie Dubois',
      role: 'Fondatrice & CEO',
      bio: 'Ancienne ingénieure chez Tesla, Marie a fondé SecondLife Exchange pour allier technologie et écologie.',
      avatar: '👩‍💼',
      linkedin: '#',
      github: '#',
    },
    {
      name: 'Thomas Martin',
      role: 'CTO',
      bio: 'Expert en IA avec 10 ans d\'expérience, Thomas pilote l\'innovation technologique de la plateforme.',
      avatar: '👨‍💻',
      linkedin: '#',
      github: '#',
    },
    {
      name: 'Sophie Chen',
      role: 'Head of Product',
      bio: 'Passionnée par l\'UX, Sophie s\'assure que chaque fonctionnalité améliore l\'expérience utilisateur.',
      avatar: '👩‍🎨',
      linkedin: '#',
      github: '#',
    },
    {
      name: 'Lucas Bernard',
      role: 'Lead Developer',
      bio: 'Full-stack expert, Lucas construit les fondations techniques qui font tourner SecondLife Exchange.',
      avatar: '👨‍🔧',
      linkedin: '#',
      github: '#',
    },
    {
      name: 'Emma Laurent',
      role: 'Community Manager',
      bio: 'Emma anime notre communauté avec passion et veille à ce que chaque membre se sente bienvenu.',
      avatar: '👩‍🎤',
      linkedin: '#',
      github: '#',
    },
    {
      name: 'Alexandre Petit',
      role: 'Data Scientist',
      bio: 'Alexandre optimise nos algorithmes de matching pour des suggestions toujours plus pertinentes.',
      avatar: '👨‍🔬',
      linkedin: '#',
      github: '#',
    },
  ];

  const values = [
    { emoji: '🌱', title: 'Éco-responsabilité', description: 'Nous pratiquons ce que nous prêchons' },
    { emoji: '🤝', title: 'Collaboration', description: 'Ensemble, nous allons plus loin' },
    { emoji: '💡', title: 'Innovation', description: 'Toujours repousser les limites' },
    { emoji: '❤️', title: 'Passion', description: 'Aimer ce que nous faisons' },
  ];

  return (
    <>
      <PageHero
        icon={Users}
        badge="L'équipe SecondLife"
        badgeColor="primary"
        title="Des humains passionnés"
        subtitle="Derrière chaque fonctionnalité, il y a une équipe dévouée qui croit en un monde plus durable. Découvrez les visages de SecondLife Exchange."
      />

      {/* Section: Équipe */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-6 transition-all hover:border-[#10b981]/30 hover:shadow-xl dark:border-[#27272a] dark:bg-[#121216]"
            >
              {/* Avatar emoji */}
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(16,185,129,0.2)] to-[rgba(0,201,80,0.1)] text-4xl">
                {member.avatar}
              </div>
              
              {/* Infos */}
              <h3 className="mb-1 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {member.name}
              </h3>
              <p className="mb-3 text-sm font-medium text-[#10b981]">
                {member.role}
              </p>
              <p className="mb-4 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {member.bio}
              </p>
              
              {/* Liens sociaux */}
              <div className="flex gap-3">
                <a
                  href={member.linkedin}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a] transition-colors hover:bg-[#10b981] hover:text-white dark:bg-[#27272a]"
                  aria-label={`LinkedIn de ${member.name}`}
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href={member.github}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a] transition-colors hover:bg-[#10b981] hover:text-white dark:bg-[#27272a]"
                  aria-label={`GitHub de ${member.name}`}
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>

              {/* Decoration */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Section: Nos valeurs d'équipe */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Ce qui nous unit
          </h2>
          <p className="mx-auto max-w-xl text-[#71717a] dark:text-[#a1a1aa]">
            Au-delà des compétences, ce sont nos valeurs partagées qui font notre force.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e4e4e7] bg-white p-6 text-center dark:border-[#27272a] dark:bg-[#121216]"
            >
              <span className="mb-3 block text-4xl">{value.emoji}</span>
              <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {value.title}
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Rejoindre l'équipe */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-gradient-to-r from-[rgba(16,185,129,0.05)] to-[rgba(0,201,80,0.05)] p-8 dark:border-[#27272a] sm:p-12">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <h2 className="mb-2 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                Envie de nous rejoindre ?
              </h2>
              <p className="text-[#71717a] dark:text-[#a1a1aa]">
                Nous recherchons des talents passionnés par l'impact positif. Consultez nos offres !
              </p>
            </div>
            <a
              href="mailto:jobs@secondlife-exchange.com"
              className="flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
            >
              <Mail className="h-5 w-5" />
              Postuler
            </a>
          </div>
        </div>
      </section>

      <CTASection
        icon={Heart}
        title="Faites partie de l'aventure"
        description="Même sans rejoindre l'équipe, vous pouvez contribuer à notre mission en échangeant vos objets."
        primaryAction={{ label: 'Commencer', href: '/register' }}
        secondaryAction={{ label: 'En savoir plus', href: '/a-propos/notre-mission' }}
      />
    </>
  );
}

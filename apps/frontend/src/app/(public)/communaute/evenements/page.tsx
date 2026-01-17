/**
 * Page: Événements
 * Route: /communaute/evenements
 */

import { Metadata } from 'next';
import { Calendar, MapPin, Users, Clock, ArrowRight, Filter, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export const metadata: Metadata = {
  title: 'Événements | SecondLife Exchange',
  description: 'Découvrez les événements SecondLife Exchange : ateliers, rencontres, webinaires et journées de troc près de chez vous.',
};

export default function EvenementsPage() {
  const upcomingEvents = [
    {
      id: 'grande-brocante-paris',
      title: 'Grande Brocante SecondLife - Paris',
      type: 'Événement physique',
      date: '15 février 2026',
      time: '10h00 - 18h00',
      location: 'Parc de la Villette, Paris',
      description: 'Rejoignez-nous pour notre plus grand événement de l\'année ! Échanges en personne, ateliers DIY et animations écologiques.',
      attendees: 234,
      maxAttendees: 500,
      image: '🎪',
      featured: true,
    },
    {
      id: 'webinaire-ia-matching',
      title: 'Webinaire : Découvrez notre IA de matching',
      type: 'En ligne',
      date: '28 janvier 2026',
      time: '19h00 - 20h30',
      location: 'Zoom (lien envoyé après inscription)',
      description: 'Notre CTO Thomas Martin vous présente en exclusivité les coulisses de notre algorithme de matching intelligent.',
      attendees: 89,
      maxAttendees: 200,
      image: '💻',
      featured: false,
    },
    {
      id: 'atelier-reparation-lyon',
      title: 'Atelier Réparation - Lyon',
      type: 'Atelier',
      date: '8 février 2026',
      time: '14h00 - 17h00',
      location: 'MakerSpace Lyon, 15 rue de la République',
      description: 'Apprenez à réparer vos objets du quotidien avec nos bénévoles experts. Électroménager, textile, petit mobilier.',
      attendees: 18,
      maxAttendees: 25,
      image: '🔧',
      featured: false,
    },
    {
      id: 'rencontre-bordeaux',
      title: 'Rencontre de la communauté - Bordeaux',
      type: 'Rencontre',
      date: '22 février 2026',
      time: '18h00 - 21h00',
      location: 'Bar Le Recycleur, Bordeaux',
      description: 'Venez rencontrer les membres de la communauté bordelaise autour d\'un verre. Échanges informels et bonne humeur garantis !',
      attendees: 42,
      maxAttendees: 60,
      image: '🍻',
      featured: false,
    },
  ];

  const pastEvents = [
    {
      title: 'Journée Mondiale du Recyclage',
      date: '15 novembre 2025',
      location: 'Plusieurs villes',
      attendees: 1200,
      image: '🌍',
    },
    {
      title: 'Atelier "Ma première annonce"',
      date: '10 décembre 2025',
      location: 'En ligne',
      attendees: 156,
      image: '📝',
    },
    {
      title: 'Marché de Noël SecondLife',
      date: '20 décembre 2025',
      location: 'Paris, Lyon, Marseille',
      attendees: 890,
      image: '🎄',
    },
  ];

  const filters = [
    { name: 'Tous', active: true },
    { name: 'En ligne' },
    { name: 'Physique' },
    { name: 'Ateliers' },
    { name: 'Rencontres' },
  ];

  return (
    <>
      <PageHero
        icon={Calendar}
        badge="Événements communauté"
        badgeColor="primary"
        title="Nos événements"
        subtitle="Participez à nos événements pour rencontrer la communauté, apprendre de nouvelles compétences et contribuer à l'économie circulaire."
      />

      {/* Section: Filtres */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="h-5 w-5 text-[#71717a]" />
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <button
                key={index}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter.active
                    ? 'bg-[#10b981] text-white'
                    : 'bg-[#f4f4f5] text-[#71717a] hover:bg-[#e4e4e7] dark:bg-[#27272a] dark:text-[#a1a1aa] dark:hover:bg-[#3f3f46]'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Événements à venir */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <h2 className="mb-6 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
          Événements à venir
        </h2>
        <div className="space-y-6">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className={`group relative overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg dark:bg-[#121216] ${
                event.featured
                  ? 'border-[#10b981]/50 ring-2 ring-[#10b981]/20'
                  : 'border-[#e4e4e7] hover:border-[#10b981]/30 dark:border-[#27272a]'
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Image / Emoji */}
                <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-[rgba(0,201,80,0.05)] md:h-auto md:w-48">
                  <span className="text-7xl transition-transform group-hover:scale-110">
                    {event.image}
                  </span>
                </div>
                
                {/* Contenu */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {event.featured && (
                      <span className="rounded-full bg-[#10b981] px-3 py-1 text-xs font-semibold text-white">
                        ⭐ À ne pas manquer
                      </span>
                    )}
                    <span className="rounded-full bg-[rgba(16,185,129,0.1)] px-3 py-1 text-xs font-medium text-[#10b981]">
                      {event.type}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                    {event.title}
                  </h3>
                  
                  <p className="mb-4 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    {event.description}
                  </p>
                  
                  {/* Métadonnées */}
                  <div className="mb-4 flex flex-wrap gap-4 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-[#10b981]" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-[#10b981]" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-[#10b981]" />
                      {event.location}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#71717a]" />
                      <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                        {event.attendees} / {event.maxAttendees} inscrits
                      </span>
                      {/* Barre de progression */}
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e4e4e7] dark:bg-[#27272a]">
                        <div
                          className="h-full rounded-full bg-[#10b981]"
                          style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-[#10b981] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#10b981]/90">
                      S'inscrire
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Placeholder bientôt disponible */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="rounded-xl border border-dashed border-[#e4e4e7] bg-[#fafafa] p-8 text-center dark:border-[#27272a] dark:bg-[#121216]">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#10b981]" />
          <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Plus d'événements bientôt
          </h3>
          <p className="mx-auto max-w-md text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Nous organisons régulièrement de nouveaux événements. Activez les notifications pour être informé en premier !
          </p>
        </div>
      </section>

      {/* Section: Événements passés */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <h2 className="mb-6 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
          Événements passés
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {pastEvents.map((event, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl">{event.image}</span>
                <div>
                  <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                    {event.title}
                  </h3>
                  <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-[#71717a] dark:text-[#a1a1aa]">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.attendees}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Organiser un événement */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="rounded-xl border-2 border-dashed border-[#10b981]/40 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent p-8 text-center">
          <span className="mb-4 inline-block text-5xl">🎉</span>
          <h2 className="mb-3 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Vous souhaitez organiser un événement ?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-[#71717a] dark:text-[#a1a1aa]">
            Vous êtes un membre actif et souhaitez organiser une rencontre dans votre ville ? Nous vous accompagnons !
          </p>
          <a
            href="/aide/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
          >
            Proposer un événement
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <CTASection
        icon={Calendar}
        title="Ne manquez aucun événement"
        description="Inscrivez-vous pour recevoir les invitations à nos prochains événements."
        primaryAction={{ label: 'Créer un compte', href: '/register' }}
        secondaryAction={{ label: 'Voir les règles', href: '/communaute/regles' }}
      />
    </>
  );
}

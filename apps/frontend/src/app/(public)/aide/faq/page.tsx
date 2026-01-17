/**
 * Page: FAQ
 * Route: /aide/faq
 */

'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, Search, MessageCircle, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

// Note: metadata doit être dans un fichier séparé ou le composant doit être server
// Pour simplifier, on garde le composant client

const faqs = [
  {
    category: 'Premiers pas',
    questions: [
      {
        q: 'Comment créer un compte sur SecondLife Exchange ?',
        a: 'C\'est simple et gratuit ! Cliquez sur "Inscription" en haut à droite, renseignez votre email et créez un mot de passe. Vous pouvez aussi vous inscrire via Google ou Apple. Vous recevrez un email de confirmation pour activer votre compte.',
      },
      {
        q: 'L\'utilisation de la plateforme est-elle gratuite ?',
        a: 'Oui, SecondLife Exchange est 100% gratuit ! Aucun frais pour publier des annonces, contacter d\'autres membres ou finaliser des échanges. Seuls les frais de livraison éventuels sont à votre charge si vous choisissez cette option.',
      },
      {
        q: 'Comment publier mon premier objet ?',
        a: 'Connectez-vous, cliquez sur "Proposer un objet" et suivez les étapes : photos (au moins 3 recommandées), titre descriptif, catégorie, état de l\'objet et ce que vous recherchez en échange. Notre IA vous aidera à optimiser votre annonce !',
      },
    ],
  },
  {
    category: 'Échanges',
    questions: [
      {
        q: 'Comment fonctionne un échange ?',
        a: 'Trouvez un objet qui vous intéresse, proposez un échange avec un de vos objets. Si l\'autre membre accepte, convenez ensemble d\'un lieu et d\'une date de rencontre (ou utilisez la livraison). Confirmez l\'échange sur l\'app une fois réalisé.',
      },
      {
        q: 'Puis-je annuler un échange en cours ?',
        a: 'Oui, tant que l\'échange n\'est pas confirmé comme "finalisé". Rendez-vous dans vos échanges en cours et cliquez sur "Annuler". Attention, les annulations répétées peuvent affecter votre réputation.',
      },
      {
        q: 'Que faire si l\'objet reçu ne correspond pas à l\'annonce ?',
        a: 'Contactez d\'abord l\'autre membre pour trouver une solution. Si le désaccord persiste, utilisez notre service de médiation via "Signaler un problème" dans l\'échange concerné. Notre équipe interviendra sous 24h.',
      },
      {
        q: 'Les échanges doivent-ils être de valeur équivalente ?',
        a: 'Pas forcément ! La valeur est subjective. Ce qui compte, c\'est que les deux parties soient satisfaites. Vous pouvez aussi proposer des échanges multiples (plusieurs petits objets contre un plus gros).',
      },
    ],
  },
  {
    category: 'Sécurité',
    questions: [
      {
        q: 'Comment éviter les arnaques ?',
        a: 'Gardez toutes vos conversations sur la plateforme, rencontrez-vous dans des lieux publics, vérifiez les objets avant de finaliser, et consultez les avis des membres. N\'envoyez jamais d\'argent à l\'avance.',
      },
      {
        q: 'Mes données personnelles sont-elles protégées ?',
        a: 'Absolument. Nous respectons le RGPD et ne partageons jamais vos données. Votre adresse n\'est visible que lorsque vous confirmez un échange. Consultez notre politique de confidentialité pour plus de détails.',
      },
      {
        q: 'Que faire si je reçois un message suspect ?',
        a: 'Signalez-le immédiatement via le bouton "Signaler" dans la conversation. Ne cliquez sur aucun lien externe et ne partagez pas d\'informations personnelles. Notre équipe modération agira rapidement.',
      },
    ],
  },
  {
    category: 'Compte & Profil',
    questions: [
      {
        q: 'Comment modifier mes informations de profil ?',
        a: 'Allez dans "Mon profil" > "Paramètres". Vous pouvez modifier votre photo, nom d\'utilisateur, bio, localisation et préférences de notification.',
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Dans "Paramètres" > "Compte" > "Supprimer mon compte". Cette action est irréversible. Vos annonces seront retirées et vos données supprimées sous 30 jours.',
      },
      {
        q: 'J\'ai oublié mon mot de passe, que faire ?',
        a: 'Sur la page de connexion, cliquez sur "Mot de passe oublié", entrez votre email et suivez les instructions. Le lien de réinitialisation est valide 24h.',
      },
    ],
  },
  {
    category: 'IA & Suggestions',
    questions: [
      {
        q: 'Comment fonctionne l\'IA de matching ?',
        a: 'Notre IA analyse vos préférences, l\'historique de vos échanges et vos recherches pour vous suggérer des objets susceptibles de vous plaire et des échanges potentiels avec d\'autres membres.',
      },
      {
        q: 'Puis-je désactiver les suggestions IA ?',
        a: 'Oui, dans "Paramètres" > "Préférences" > "Suggestions IA". Vous pouvez les désactiver complètement ou ajuster leur fréquence.',
      },
      {
        q: 'Les suggestions IA sont-elles basées sur mes données personnelles ?',
        a: 'Les suggestions sont basées sur votre activité sur la plateforme (recherches, favoris, échanges) et non sur des données externes. Vous pouvez effacer votre historique à tout moment.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <>
      <PageHero
        icon={HelpCircle}
        badge="Centre d'aide"
        badgeColor="info"
        title="Questions fréquentes"
        subtitle="Trouvez rapidement des réponses à vos questions sur l'utilisation de SecondLife Exchange."
      />

      {/* Section: Recherche */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e4e4e7] bg-white py-4 pl-12 pr-4 text-[#0b0b0d] outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#121216] dark:text-[#ededee]"
          />
        </div>
      </section>

      {/* Section: FAQ Accordéon */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-xl border border-[#e4e4e7] bg-white p-8 text-center dark:border-[#27272a] dark:bg-[#121216]">
            <HelpCircle className="mx-auto mb-4 h-10 w-10 text-[#71717a]" />
            <h3 className="mb-2 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              Aucun résultat
            </h3>
            <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
              Aucune question ne correspond à votre recherche. Essayez d'autres termes ou contactez-nous.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredFaqs.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="mb-4 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, qIndex) => {
                    const itemId = `${catIndex}-${qIndex}`;
                    const isOpen = openItems.includes(itemId);

                    return (
                      <div
                        key={qIndex}
                        className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#121216]"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-[#fafafa] dark:hover:bg-[#1a1a1f]"
                        >
                          <span className="pr-4 font-medium text-[#0b0b0d] dark:text-[#ededee]">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 flex-shrink-0 text-[#71717a] transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="border-t border-[#e4e4e7] bg-[#fafafa] p-5 dark:border-[#27272a] dark:bg-[#0b0b0d]">
                            <p className="text-sm leading-relaxed text-[#71717a] dark:text-[#a1a1aa]">
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section: Toujours pas trouvé ? */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent p-8 text-center dark:border-[#27272a]">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-[#10b981]" />
          <h2 className="mb-3 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-[#71717a] dark:text-[#a1a1aa]">
            Notre équipe support est disponible pour répondre à toutes vos questions.
          </p>
          <a
            href="/aide/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
          >
            Nous contacter
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <CTASection
        icon={HelpCircle}
        title="Besoin d'aide supplémentaire ?"
        description="Consultez notre guide d'échange complet ou contactez notre équipe support."
        primaryAction={{ label: 'Guide d\'échange', href: '/communaute/guide-echange' }}
        secondaryAction={{ label: 'Contacter le support', href: '/aide/contact' }}
      />
    </>
  );
}

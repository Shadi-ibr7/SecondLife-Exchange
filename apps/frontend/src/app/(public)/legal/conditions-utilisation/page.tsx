/**
 * Page: Conditions d'utilisation
 * Route: /legal/conditions-utilisation
 */

'use client';

import { FileText, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';

export default function ConditionsUtilisationPage() {
  const lastUpdated = '15 janvier 2026';

  const sections = [
    {
      title: '1. Objet',
      content: `Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités et conditions dans lesquelles SecondLife Exchange (ci-après "la Plateforme") met à disposition ses services d'échange d'objets entre particuliers.

En accédant et en utilisant la Plateforme, l'Utilisateur accepte sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.`,
    },
    {
      title: '2. Définitions',
      content: `**Plateforme** : désigne le site web SecondLife Exchange accessible à l'adresse secondlife-exchange.com et l'application mobile associée.

**Utilisateur** : désigne toute personne physique majeure ou mineure de plus de 16 ans avec l'accord parental, accédant et utilisant la Plateforme.

**Membre** : désigne un Utilisateur ayant créé un compte sur la Plateforme.

**Annonce** : désigne la proposition d'échange publiée par un Membre, comprenant la description et les photos de l'objet proposé.

**Échange** : désigne la transaction non monétaire entre deux Membres consistant à échanger des objets.`,
    },
    {
      title: '3. Inscription et compte',
      content: `**3.1 Création de compte**
Pour utiliser les services de la Plateforme, l'Utilisateur doit créer un compte en fournissant des informations exactes et à jour. L'Utilisateur s'engage à maintenir la confidentialité de ses identifiants de connexion.

**3.2 Conditions d'éligibilité**
L'inscription est ouverte aux personnes physiques majeures ou aux mineurs de plus de 16 ans avec l'accord de leur représentant légal. Les personnes morales ne sont pas autorisées à s'inscrire.

**3.3 Responsabilité du compte**
L'Utilisateur est seul responsable de l'activité sur son compte. Tout usage frauduleux doit être signalé immédiatement à notre équipe support.

**3.4 Suspension et résiliation**
SecondLife Exchange se réserve le droit de suspendre ou résilier tout compte en cas de violation des présentes CGU, sans préavis ni indemnité.`,
    },
    {
      title: '4. Services proposés',
      content: `**4.1 Échanges d'objets**
La Plateforme permet aux Membres de proposer des objets à l'échange et de rechercher des objets proposés par d'autres Membres. Les échanges sont effectués directement entre Membres, sans intervention financière de la Plateforme.

**4.2 Messagerie**
La Plateforme met à disposition une messagerie sécurisée permettant aux Membres de communiquer dans le cadre des échanges.

**4.3 Système d'évaluation**
Après chaque échange, les Membres peuvent laisser une évaluation mutuelle, contribuant à la réputation de chacun sur la Plateforme.

**4.4 Suggestions IA**
La Plateforme utilise des algorithmes d'intelligence artificielle pour suggérer des échanges pertinents aux Membres, basés sur leurs préférences et historique d'utilisation.`,
    },
    {
      title: '5. Obligations des Utilisateurs',
      content: `**5.1 Exactitude des informations**
Le Membre s'engage à fournir des informations exactes et complètes lors de la création d'annonces, notamment concernant l'état et les caractéristiques des objets proposés.

**5.2 Objets autorisés**
Seuls les objets légaux et conformes aux règles de la communauté peuvent être proposés à l'échange. Les objets interdits sont notamment : armes, médicaments, contrefaçons, animaux vivants, contenus pour adultes.

**5.3 Comportement**
Le Membre s'engage à adopter un comportement respectueux envers les autres Membres et à ne pas utiliser la Plateforme à des fins illicites.

**5.4 Sécurité**
Le Membre s'engage à ne pas tenter de contourner les mesures de sécurité de la Plateforme, ni à perturber son fonctionnement.`,
    },
    {
      title: '6. Responsabilités',
      content: `**6.1 Rôle d'intermédiaire**
SecondLife Exchange agit uniquement en tant qu'intermédiaire technique entre les Membres. La Plateforme n'est pas partie aux échanges réalisés entre Membres.

**6.2 Limitation de responsabilité**
SecondLife Exchange ne peut être tenue responsable :
- Du contenu des annonces publiées par les Membres
- De la qualité ou de la conformité des objets échangés
- Des litiges survenant entre Membres
- Des dommages directs ou indirects résultant de l'utilisation de la Plateforme

**6.3 Médiation**
En cas de litige, SecondLife Exchange propose un service de médiation à titre gracieux, sans que cela n'engage sa responsabilité.`,
    },
    {
      title: '7. Propriété intellectuelle',
      content: `**7.1 Contenu de la Plateforme**
L'ensemble des éléments composant la Plateforme (textes, graphismes, logos, images, logiciels) est la propriété exclusive de SecondLife Exchange et est protégé par les lois relatives à la propriété intellectuelle.

**7.2 Contenu des Membres**
En publiant du contenu sur la Plateforme, le Membre accorde à SecondLife Exchange une licence non exclusive, gratuite et mondiale d'utilisation, de reproduction et de diffusion de ce contenu dans le cadre du fonctionnement de la Plateforme.

**7.3 Respect des droits**
Le Membre garantit qu'il dispose des droits nécessaires sur le contenu qu'il publie et s'engage à ne pas porter atteinte aux droits des tiers.`,
    },
    {
      title: '8. Protection des données',
      content: `Le traitement des données personnelles des Utilisateurs est régi par notre Politique de Confidentialité, accessible à l'adresse /legal/confidentialite.

SecondLife Exchange s'engage à respecter la réglementation applicable en matière de protection des données personnelles, notamment le Règlement Général sur la Protection des Données (RGPD).`,
    },
    {
      title: '9. Modification des CGU',
      content: `SecondLife Exchange se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés des modifications par email ou notification sur la Plateforme.

La poursuite de l'utilisation de la Plateforme après modification des CGU vaut acceptation des nouvelles conditions.`,
    },
    {
      title: '10. Droit applicable et juridiction',
      content: `Les présentes CGU sont régies par le droit français.

En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront seuls compétents.`,
    },
    {
      title: '11. Contact',
      content: `Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
- Par email : legal@secondlife-exchange.com
- Par courrier : SecondLife Exchange, 15 rue de l'Innovation, 75011 Paris, France
- Via notre formulaire de contact : /aide/contact`,
    },
  ];

  return (
    <>
      <PageHero
        icon={FileText}
        badge="Documentation légale"
        badgeColor="info"
        title="Conditions d'utilisation"
        subtitle="Veuillez lire attentivement les présentes conditions générales d'utilisation avant d'utiliser notre plateforme."
      />

      {/* Info mise à jour */}
      <section className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between rounded-lg bg-[#f4f4f5] p-4 dark:bg-[#1a1a1f]">
          <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Dernière mise à jour : <strong className="text-[#0b0b0d] dark:text-[#ededee]">{lastUpdated}</strong>
          </span>
          <a
            href="/legal/confidentialite"
            className="flex items-center gap-1 text-sm font-medium text-[#10b981] hover:underline"
          >
            Politique de confidentialité
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </section>

      {/* Contenu */}
      <section className="mx-auto w-full max-w-[800px] px-4 pb-16 sm:px-8">
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <h2 className="mb-4 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {section.title}
              </h2>
              <div className="prose prose-sm max-w-none text-[#71717a] dark:text-[#a1a1aa]">
                {section.content.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-3 whitespace-pre-line">
                    {paragraph.split('**').map((text, tIndex) =>
                      tIndex % 2 === 1 ? (
                        <strong key={tIndex} className="text-[#0b0b0d] dark:text-[#ededee]">
                          {text}
                        </strong>
                      ) : (
                        text
                      )
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation légal */}
      <section className="mx-auto w-full max-w-[800px] px-4 pb-16 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
          <h3 className="mb-4 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Documents associés
          </h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/legal/confidentialite"
              className="flex items-center gap-2 rounded-lg bg-[#f4f4f5] px-4 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#e4e4e7] dark:bg-[#27272a] dark:text-[#ededee] dark:hover:bg-[#3f3f46]"
            >
              <FileText className="h-4 w-4" />
              Politique de confidentialité
            </a>
            <a
              href="/legal/cookies"
              className="flex items-center gap-2 rounded-lg bg-[#f4f4f5] px-4 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#e4e4e7] dark:bg-[#27272a] dark:text-[#ededee] dark:hover:bg-[#3f3f46]"
            >
              <FileText className="h-4 w-4" />
              Politique des cookies
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

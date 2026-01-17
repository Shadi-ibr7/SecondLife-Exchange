/**
 * Page: Politique des cookies
 * Route: /legal/cookies
 */

'use client';

import { Cookie, FileText, ArrowRight, Settings, CheckCircle } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { useCookieConsent } from '@/components/cookies';
import { Button } from '@/components/ui/button';

export default function CookiesPage() {
  const lastUpdated = '17 janvier 2026';
  const { openPreferences, consent, hasGivenConsent } = useCookieConsent();

  const cookieTypes = [
    {
      type: 'Essentiels',
      required: true,
      description: 'Ces cookies sont nécessaires au fonctionnement de la plateforme. Ils ne peuvent pas être désactivés.',
      cookies: [
        { name: 'session_id', purpose: 'Maintenir votre connexion', duration: 'Session' },
        { name: 'csrf_token', purpose: 'Sécurité contre les attaques CSRF', duration: 'Session' },
        { name: 'cookie_consent', purpose: 'Mémoriser vos préférences de cookies', duration: '1 an' },
      ],
    },
    {
      type: 'Fonctionnels',
      required: false,
      description: 'Ces cookies améliorent votre expérience en mémorisant vos préférences.',
      cookies: [
        { name: 'theme', purpose: 'Mémoriser votre préférence de thème (clair/sombre)', duration: '1 an' },
        { name: 'language', purpose: 'Mémoriser votre langue préférée', duration: '1 an' },
        { name: 'location', purpose: 'Mémoriser votre localisation pour les suggestions', duration: '30 jours' },
      ],
    },
    {
      type: 'Analytiques',
      required: false,
      description: 'Ces cookies nous aident à comprendre comment vous utilisez la plateforme pour l\'améliorer.',
      cookies: [
        { name: '_ga', purpose: 'Google Analytics - Statistiques de visite anonymisées', duration: '2 ans' },
        { name: '_gid', purpose: 'Google Analytics - Identification de session', duration: '24h' },
        { name: 'plausible_*', purpose: 'Plausible Analytics - Statistiques respectueuses de la vie privée', duration: '30 jours' },
      ],
    },
  ];

  const sections = [
    {
      title: '1. Qu\'est-ce qu\'un cookie ?',
      content: `Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette) lorsque vous visitez un site web. Les cookies permettent au site de mémoriser certaines informations sur votre visite, comme votre langue préférée ou vos paramètres de connexion.

Les cookies ne peuvent pas exécuter de programmes ni transmettre de virus à votre appareil.`,
    },
    {
      title: '2. Comment utilisons-nous les cookies ?',
      content: `SecondLife Exchange utilise des cookies pour :

**Assurer le fonctionnement de la plateforme**
- Maintenir votre session de connexion
- Sécuriser vos actions sur le site
- Mémoriser le contenu de votre panier ou vos brouillons

**Améliorer votre expérience**
- Retenir vos préférences (thème, langue, localisation)
- Afficher des suggestions personnalisées
- Faciliter la navigation entre les pages

**Analyser l'utilisation**
- Comprendre comment la plateforme est utilisée
- Identifier les problèmes techniques
- Améliorer nos services`,
    },
    {
      title: '3. Cookies de tiers',
      content: `Nous utilisons certains services tiers qui peuvent déposer des cookies sur votre appareil :

**Google Analytics** (analyse)
Ces cookies nous aident à comprendre comment vous utilisez notre site. Les données sont anonymisées et ne permettent pas de vous identifier personnellement. Vous pouvez vous opposer à ce suivi via le module complémentaire de navigateur Google Analytics.

**Plausible Analytics** (analyse alternative)
Alternative respectueuse de la vie privée, sans cookies tiers et conforme RGPD par défaut.

Nous n'utilisons pas de cookies publicitaires ni de cookies de réseaux sociaux intrusifs.`,
    },
    {
      title: '4. Durée de conservation',
      content: `Les cookies ont des durées de vie variables :

**Cookies de session** : supprimés à la fermeture de votre navigateur
**Cookies persistants** : conservés pendant une durée définie (voir tableau ci-dessus)

Vous pouvez à tout moment supprimer les cookies stockés sur votre appareil via les paramètres de votre navigateur.`,
    },
    {
      title: '5. Comment modifier votre choix',
      content: `Vous pouvez modifier vos préférences de cookies à tout moment :

**Via notre panneau de préférences**
Cliquez sur le bouton "Gérer mes préférences" ci-dessous ou sur le lien "Gestion des cookies" en bas de chaque page du site.

**Vos choix actuels**
Votre consentement est enregistré et peut être modifié à tout moment. Le cookie de consentement est conservé pendant 6 mois.`,
    },
    {
      title: '6. Vos choix concernant les cookies',
      content: `Vous avez plusieurs options pour gérer les cookies :

**Via notre bandeau de consentement**
Lors de votre première visite, vous pouvez choisir les catégories de cookies que vous acceptez. Vous pouvez modifier ces préférences à tout moment via le lien "Gérer les cookies" en bas de page.

**Via les paramètres de votre navigateur**
Tous les navigateurs permettent de bloquer ou supprimer les cookies :
- Chrome : Paramètres > Confidentialité et sécurité > Cookies
- Firefox : Options > Vie privée et sécurité > Cookies
- Safari : Préférences > Confidentialité
- Edge : Paramètres > Confidentialité > Cookies

**Attention** : le blocage de certains cookies peut affecter le fonctionnement de la plateforme.`,
    },
    {
      title: '7. Modifications de cette politique',
      content: `Nous pouvons mettre à jour cette politique des cookies à tout moment. La date de dernière mise à jour est indiquée en haut de cette page.

En cas de changement significatif, nous vous en informerons via un nouveau bandeau de consentement.`,
    },
    {
      title: '8. Contact',
      content: `Pour toute question concernant notre utilisation des cookies :

**Email** : privacy@secondlife-exchange.com
**Formulaire** : /aide/contact

Vous pouvez également contacter notre DPO pour exercer vos droits relatifs à la protection des données.`,
    },
  ];

  return (
    <>
      <PageHero
        icon={Cookie}
        badge="Cookies & traceurs"
        badgeColor="info"
        title="Politique des cookies"
        subtitle="Transparence totale sur les cookies que nous utilisons et comment vous pouvez les contrôler."
      />

      {/* Info mise à jour */}
      <section className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-4 rounded-lg bg-[#f4f4f5] p-4 dark:bg-[#1a1a1f] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Dernière mise à jour : <strong className="text-[#0b0b0d] dark:text-[#ededee]">{lastUpdated}</strong>
          </span>
          <Button
            onClick={openPreferences}
            className="flex items-center gap-2 bg-[#10b981] text-white hover:bg-[#10b981]/90"
          >
            <Settings className="h-4 w-4" />
            Gérer mes préférences
          </Button>
        </div>
      </section>

      {/* État actuel du consentement */}
      {hasGivenConsent && (
        <section className="mx-auto w-full max-w-[800px] px-4 py-4 sm:px-8">
          <div className="rounded-xl border border-[#10b981]/30 bg-[rgba(16,185,129,0.05)] p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
              <CheckCircle className="h-5 w-5 text-[#10b981]" />
              Vos préférences actuelles
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#121216]">
                <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">Cookies nécessaires</span>
                <span className="rounded-full bg-[#10b981] px-2 py-0.5 text-xs font-medium text-white">Actifs</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#121216]">
                <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">Cookies de préférences</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${consent.preferences ? 'bg-[#10b981] text-white' : 'bg-[#f4f4f5] text-[#71717a] dark:bg-[#27272a]'}`}>
                  {consent.preferences ? 'Actifs' : 'Inactifs'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#121216]">
                <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">Cookies statistiques</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${consent.analytics ? 'bg-[#10b981] text-white' : 'bg-[#f4f4f5] text-[#71717a] dark:bg-[#27272a]'}`}>
                  {consent.analytics ? 'Actifs' : 'Inactifs'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#121216]">
                <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">Cookies marketing</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${consent.marketing ? 'bg-[#10b981] text-white' : 'bg-[#f4f4f5] text-[#71717a] dark:bg-[#27272a]'}`}>
                  {consent.marketing ? 'Actifs' : 'Inactifs'}
                </span>
              </div>
            </div>
            <button
              onClick={openPreferences}
              className="mt-4 text-sm font-medium text-[#10b981] hover:underline"
            >
              Modifier mes préférences →
            </button>
          </div>
        </section>
      )}

      {/* Tableau des cookies */}
      <section className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
        <h2 className="mb-6 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
          Cookies utilisés sur SecondLife Exchange
        </h2>
        <div className="space-y-6">
          {cookieTypes.map((category, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#121216]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e4e4e7] bg-[#fafafa] p-4 dark:border-[#27272a] dark:bg-[#1a1a1f]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {category.type === 'Essentiels' && '🔒'}
                    {category.type === 'Fonctionnels' && '⚙️'}
                    {category.type === 'Analytiques' && '📊'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                      {category.type}
                    </h3>
                    <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                      {category.description}
                    </p>
                  </div>
                </div>
                {category.required ? (
                  <span className="rounded-full bg-[#f4f4f5] px-3 py-1 text-xs font-medium text-[#71717a] dark:bg-[#27272a]">
                    Requis
                  </span>
                ) : (
                  <span className="rounded-full bg-[rgba(16,185,129,0.1)] px-3 py-1 text-xs font-medium text-[#10b981]">
                    Optionnel
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e4e4e7] bg-[#fafafa] dark:border-[#27272a] dark:bg-[#1a1a1f]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-[#a1a1aa]">
                        Nom
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-[#a1a1aa]">
                        Finalité
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-[#a1a1aa]">
                        Durée
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.cookies.map((cookie, cIndex) => (
                      <tr
                        key={cIndex}
                        className="border-b border-[#e4e4e7] last:border-0 dark:border-[#27272a]"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#0b0b0d] dark:text-[#ededee]">
                          {cookie.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                          {cookie.purpose}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                          {cookie.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
              href="/legal/conditions-utilisation"
              className="flex items-center gap-2 rounded-lg bg-[#f4f4f5] px-4 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#e4e4e7] dark:bg-[#27272a] dark:text-[#ededee] dark:hover:bg-[#3f3f46]"
            >
              <FileText className="h-4 w-4" />
              Conditions d'utilisation
            </a>
            <a
              href="/legal/confidentialite"
              className="flex items-center gap-2 rounded-lg bg-[#f4f4f5] px-4 py-2 text-sm font-medium text-[#0b0b0d] transition-colors hover:bg-[#e4e4e7] dark:bg-[#27272a] dark:text-[#ededee] dark:hover:bg-[#3f3f46]"
            >
              <FileText className="h-4 w-4" />
              Politique de confidentialité
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

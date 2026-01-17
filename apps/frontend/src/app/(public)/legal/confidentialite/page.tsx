/**
 * Page: Politique de confidentialité
 * Route: /legal/confidentialite
 */

'use client';

import { Shield, FileText, ArrowRight, Mail } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';

export default function ConfidentialitePage() {
  const lastUpdated = '15 janvier 2026';

  const sections = [
    {
      title: '1. Introduction',
      content: `SecondLife Exchange (ci-après "nous", "notre" ou "la Plateforme") s'engage à protéger la vie privée de ses utilisateurs. La présente Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles.

Cette politique s'applique à tous les utilisateurs de notre site web et de notre application mobile. En utilisant nos services, vous acceptez les pratiques décrites dans cette politique.`,
    },
    {
      title: '2. Responsable du traitement',
      content: `Le responsable du traitement de vos données personnelles est :

**SecondLife Exchange SAS**
15 rue de l'Innovation
75011 Paris, France
Email : dpo@secondlife-exchange.com

Notre Délégué à la Protection des Données (DPO) peut être contacté à l'adresse ci-dessus pour toute question relative à vos données personnelles.`,
    },
    {
      title: '3. Données collectées',
      content: `**3.1 Données fournies par vous**
- Informations d'inscription : nom, prénom, email, mot de passe
- Informations de profil : photo, localisation, biographie
- Contenu : annonces, photos d'objets, messages, évaluations
- Communications : demandes de support, signalements

**3.2 Données collectées automatiquement**
- Données techniques : adresse IP, type de navigateur, système d'exploitation
- Données d'utilisation : pages visitées, fonctionnalités utilisées, temps passé
- Données de localisation : si vous l'autorisez, pour les suggestions locales
- Cookies et traceurs : voir notre Politique des cookies

**3.3 Données provenant de tiers**
- Si vous vous connectez via Google ou Apple, nous recevons les informations autorisées par ces services`,
    },
    {
      title: '4. Finalités du traitement',
      content: `Nous utilisons vos données personnelles pour :

**4.1 Fourniture du service**
- Créer et gérer votre compte
- Permettre la publication d'annonces et les échanges
- Faciliter la communication entre membres
- Assurer le fonctionnement de la messagerie

**4.2 Amélioration du service**
- Personnaliser les suggestions grâce à notre IA
- Analyser l'utilisation pour améliorer la plateforme
- Développer de nouvelles fonctionnalités

**4.3 Sécurité et confiance**
- Détecter et prévenir les fraudes
- Modérer les contenus
- Gérer les litiges

**4.4 Communication**
- Envoyer des notifications de service
- Vous informer des nouveautés (si vous y consentez)
- Répondre à vos demandes de support`,
    },
    {
      title: '5. Base légale du traitement',
      content: `Conformément au RGPD, nous traitons vos données sur les bases légales suivantes :

**Exécution du contrat** : pour les traitements nécessaires à la fourniture de nos services (création de compte, échanges, messagerie).

**Consentement** : pour les communications marketing, les cookies non essentiels, et le traitement de données de localisation.

**Intérêt légitime** : pour l'amélioration du service, la prévention des fraudes, et la sécurité de la plateforme.

**Obligation légale** : pour répondre aux demandes des autorités judiciaires ou administratives.`,
    },
    {
      title: '6. Partage des données',
      content: `**6.1 Avec les autres membres**
Certaines informations de votre profil (nom d'utilisateur, photo, localisation générale, annonces, évaluations) sont visibles par les autres membres.

**6.2 Avec nos prestataires**
Nous faisons appel à des prestataires de confiance pour :
- L'hébergement (serveurs basés dans l'UE)
- L'envoi d'emails (notifications)
- L'analyse anonymisée de l'utilisation
- Le paiement des services premium (le cas échéant)

**6.3 Nous ne vendons jamais vos données**
Nous ne vendons, ne louons et ne partageons pas vos données personnelles à des fins publicitaires tierces.

**6.4 Transferts hors UE**
Si des données sont transférées hors de l'UE, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles types, décision d'adéquation).`,
    },
    {
      title: '7. Conservation des données',
      content: `Nous conservons vos données personnelles pendant la durée nécessaire aux finalités décrites :

- **Données de compte** : tant que votre compte est actif, puis 3 ans après suppression pour des raisons légales
- **Annonces et échanges** : 5 ans après l'échange pour des raisons de preuve
- **Messages** : 2 ans après le dernier message échangé
- **Données techniques** : 13 mois maximum
- **Données de support** : 3 ans après la clôture du ticket

Vous pouvez demander la suppression anticipée de vos données en nous contactant.`,
    },
    {
      title: '8. Vos droits',
      content: `Conformément au RGPD, vous disposez des droits suivants :

**Droit d'accès** : obtenir une copie de vos données personnelles
**Droit de rectification** : corriger des données inexactes
**Droit à l'effacement** : demander la suppression de vos données
**Droit à la portabilité** : recevoir vos données dans un format structuré
**Droit d'opposition** : vous opposer à certains traitements
**Droit à la limitation** : limiter temporairement le traitement
**Droit de retirer votre consentement** : à tout moment, sans affecter la licéité du traitement antérieur

Pour exercer ces droits, contactez-nous à : dpo@secondlife-exchange.com

Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
    },
    {
      title: '9. Sécurité des données',
      content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :

- Chiffrement des données en transit (HTTPS/TLS)
- Chiffrement des messages de bout en bout
- Stockage sécurisé des mots de passe (hash bcrypt)
- Contrôle d'accès strict aux données
- Audits de sécurité réguliers
- Formation de notre personnel à la protection des données
- Notification en cas de violation de données conformément au RGPD`,
    },
    {
      title: '10. Mineurs',
      content: `SecondLife Exchange est accessible aux personnes de 16 ans et plus. Les mineurs de 16 à 18 ans doivent avoir l'autorisation de leur représentant légal.

Nous ne collectons pas sciemment de données concernant les enfants de moins de 16 ans. Si vous êtes parent et pensez que votre enfant nous a fourni des données, contactez-nous pour les faire supprimer.`,
    },
    {
      title: '11. Modifications',
      content: `Nous pouvons modifier cette Politique de Confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par email ou par notification sur la Plateforme.

La date de dernière mise à jour est indiquée en haut de cette page. Nous vous encourageons à consulter régulièrement cette politique.`,
    },
    {
      title: '12. Contact',
      content: `Pour toute question relative à cette Politique de Confidentialité ou à vos données personnelles :

**Email DPO** : dpo@secondlife-exchange.com
**Adresse** : SecondLife Exchange, 15 rue de l'Innovation, 75011 Paris
**Formulaire** : /aide/contact

Nous nous engageons à répondre à vos demandes dans un délai d'un mois.`,
    },
  ];

  return (
    <>
      <PageHero
        icon={Shield}
        badge="Protection des données"
        badgeColor="primary"
        title="Politique de confidentialité"
        subtitle="Votre vie privée est notre priorité. Découvrez comment nous protégeons et utilisons vos données personnelles."
      />

      {/* Info mise à jour */}
      <section className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-4 rounded-lg bg-[#f4f4f5] p-4 dark:bg-[#1a1a1f] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Dernière mise à jour : <strong className="text-[#0b0b0d] dark:text-[#ededee]">{lastUpdated}</strong>
          </span>
          <div className="flex gap-4">
            <a
              href="/legal/conditions-utilisation"
              className="flex items-center gap-1 text-sm font-medium text-[#10b981] hover:underline"
            >
              CGU
              <ArrowRight className="h-3 w-3" />
            </a>
            <a
              href="/legal/cookies"
              className="flex items-center gap-1 text-sm font-medium text-[#10b981] hover:underline"
            >
              Cookies
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Résumé visuel */}
      <section className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#10b981]/30 bg-[rgba(16,185,129,0.05)] p-5 text-center">
            <span className="mb-2 block text-3xl">🔒</span>
            <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">Données chiffrées</h3>
            <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">Vos messages sont chiffrés de bout en bout</p>
          </div>
          <div className="rounded-xl border border-[#10b981]/30 bg-[rgba(16,185,129,0.05)] p-5 text-center">
            <span className="mb-2 block text-3xl">🚫</span>
            <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">Aucune vente</h3>
            <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">Nous ne vendons jamais vos données</p>
          </div>
          <div className="rounded-xl border border-[#10b981]/30 bg-[rgba(16,185,129,0.05)] p-5 text-center">
            <span className="mb-2 block text-3xl">🇪🇺</span>
            <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">Conforme RGPD</h3>
            <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">Respect total de vos droits</p>
          </div>
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

      {/* Contact DPO */}
      <section className="mx-auto w-full max-w-[800px] px-4 pb-16 sm:px-8">
        <div className="rounded-xl border-2 border-dashed border-[#10b981]/40 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent p-8 text-center">
          <Mail className="mx-auto mb-4 h-10 w-10 text-[#10b981]" />
          <h3 className="mb-2 text-lg font-semibold text-[#0b0b0d] dark:text-[#ededee]">
            Questions sur vos données ?
          </h3>
          <p className="mx-auto mb-4 max-w-md text-sm text-[#71717a] dark:text-[#a1a1aa]">
            Notre DPO est à votre disposition pour répondre à toutes vos questions concernant vos données personnelles.
          </p>
          <a
            href="mailto:dpo@secondlife-exchange.com"
            className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90"
          >
            <Mail className="h-5 w-5" />
            Contacter le DPO
          </a>
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

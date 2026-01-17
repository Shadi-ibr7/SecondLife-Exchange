/**
 * Page: Signaler
 * Route: /aide/signaler
 */

'use client';

import { useState } from 'react';
import { Flag, AlertTriangle, Send, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export default function SignalerPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({
    category: '',
    url: '',
    username: '',
    description: '',
    email: '',
    wantsFollowUp: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    
    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setFormState('success');
    setFormData({
      category: '',
      url: '',
      username: '',
      description: '',
      email: '',
      wantsFollowUp: true,
    });
  };

  const categories = [
    { value: 'contenu-inapproprie', label: 'Contenu inapproprié', description: 'Photos, textes ou propos choquants' },
    { value: 'arnaque', label: 'Arnaque ou escroquerie', description: 'Tentative de fraude ou demande de paiement' },
    { value: 'harcelement', label: 'Harcèlement', description: 'Messages répétés, menaçants ou intimidants' },
    { value: 'fausse-annonce', label: 'Fausse annonce', description: 'Photos ou description mensongères' },
    { value: 'objet-interdit', label: 'Objet interdit', description: 'Article ne respectant pas nos règles' },
    { value: 'usurpation', label: 'Usurpation d\'identité', description: 'Profil utilisant l\'identité d\'autrui' },
    { value: 'spam', label: 'Spam ou publicité', description: 'Messages commerciaux non sollicités' },
    { value: 'autre', label: 'Autre', description: 'Tout autre problème' },
  ];

  const processSteps = [
    { step: 1, title: 'Signalement reçu', description: 'Notre équipe est notifiée immédiatement' },
    { step: 2, title: 'Analyse', description: 'Nous examinons le contenu signalé sous 24h' },
    { step: 3, title: 'Action', description: 'Mesures appropriées (avertissement, suspension, suppression)' },
    { step: 4, title: 'Suivi', description: 'Vous êtes informé du résultat si vous le souhaitez' },
  ];

  return (
    <>
      <PageHero
        icon={Flag}
        badge="Signalement"
        badgeColor="warning"
        title="Signaler un problème"
        subtitle="Aidez-nous à maintenir SecondLife Exchange comme un espace sûr et respectueux. Chaque signalement compte."
      />

      {/* Section: Catégories de signalement */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="rounded-xl border border-[#e4e4e7] bg-[#fafafa] p-6 dark:border-[#27272a] dark:bg-[#121216]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#eab308]" />
            <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
              <strong className="text-[#0b0b0d] dark:text-[#ededee]">Important :</strong> Pour les situations urgentes impliquant un danger immédiat, 
              contactez les autorités locales (police: 17) en plus de nous signaler l'incident.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Formulaire */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216] sm:p-8">
              <h2 className="mb-6 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                Formulaire de signalement
              </h2>

              {formState === 'success' ? (
                <div className="rounded-lg bg-[rgba(16,185,129,0.1)] p-6 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-[#10b981]" />
                  <h3 className="mb-2 text-lg font-semibold text-[#10b981]">
                    Signalement envoyé
                  </h3>
                  <p className="mb-4 text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    Merci pour votre vigilance. Notre équipe modération va examiner votre signalement dans les plus brefs délais.
                  </p>
                  <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    Numéro de référence : <strong className="text-[#0b0b0d] dark:text-[#ededee]">SIG-{Date.now()}</strong>
                  </p>
                  <button
                    onClick={() => setFormState('idle')}
                    className="mt-4 text-sm font-medium text-[#10b981] hover:underline"
                  >
                    Faire un autre signalement
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Catégorie */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                      Type de signalement *
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {categories.map((category) => (
                        <label
                          key={category.value}
                          className={`cursor-pointer rounded-lg border p-4 transition-all ${
                            formData.category === category.value
                              ? 'border-[#10b981] bg-[rgba(16,185,129,0.05)] ring-2 ring-[#10b981]/20'
                              : 'border-[#e4e4e7] hover:border-[#10b981]/50 dark:border-[#27272a]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={category.value}
                            checked={formData.category === category.value}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="sr-only"
                            required
                          />
                          <span className="block font-medium text-[#0b0b0d] dark:text-[#ededee]">
                            {category.label}
                          </span>
                          <span className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                            {category.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* URL ou nom d'utilisateur */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                        Lien vers le contenu
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                        placeholder="https://secondlife-exchange.com/..."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                        Nom d'utilisateur concerné
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                        placeholder="@utilisateur"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                      Description détaillée *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full resize-none rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                      placeholder="Décrivez le problème en détail : ce que vous avez observé, quand cela s'est produit, etc."
                    />
                    <p className="mt-2 text-xs text-[#71717a] dark:text-[#a1a1aa]">
                      Plus votre description est précise, plus nous pourrons agir efficacement.
                    </p>
                  </div>

                  {/* Email de suivi */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                      Votre email (pour le suivi)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Suivi */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="followUp"
                      checked={formData.wantsFollowUp}
                      onChange={(e) => setFormData({ ...formData, wantsFollowUp: e.target.checked })}
                      className="h-4 w-4 rounded border-[#e4e4e7] text-[#10b981] focus:ring-[#10b981]"
                    />
                    <label htmlFor="followUp" className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                      Je souhaite être informé(e) des suites données à mon signalement
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#10b981] py-3 font-semibold text-white transition-colors hover:bg-[#10b981]/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {formState === 'submitting' ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Envoyer le signalement
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            {/* Comment ça marche */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <div className="mb-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#10b981]" />
                <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  Comment ça marche ?
                </h3>
              </div>
              <div className="space-y-4">
                {processSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#10b981] text-xs font-bold text-white">
                      {step.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                        {step.title}
                      </h4>
                      <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidentialité */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <h3 className="mb-3 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                🔒 Confidentialité
              </h3>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                Votre signalement est <strong className="text-[#0b0b0d] dark:text-[#ededee]">anonyme</strong>. 
                La personne signalée ne saura jamais qui a fait le signalement. 
                Vos informations personnelles ne sont utilisées que pour le suivi de votre demande.
              </p>
            </div>

            {/* Ressources */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <h3 className="mb-3 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                Ressources utiles
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="/aide/securite" className="flex items-center gap-2 text-sm text-[#10b981] hover:underline">
                    <ArrowRight className="h-3 w-3" />
                    Conseils de sécurité
                  </a>
                </li>
                <li>
                  <a href="/communaute/regles" className="flex items-center gap-2 text-sm text-[#10b981] hover:underline">
                    <ArrowRight className="h-3 w-3" />
                    Règles de la communauté
                  </a>
                </li>
                <li>
                  <a href="/aide/contact" className="flex items-center gap-2 text-sm text-[#10b981] hover:underline">
                    <ArrowRight className="h-3 w-3" />
                    Contacter le support
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        icon={Shield}
        title="Merci pour votre vigilance"
        description="Grâce à vous, SecondLife Exchange reste un espace de confiance pour tous."
        primaryAction={{ label: 'Retour à l\'accueil', href: '/' }}
        secondaryAction={{ label: 'Voir les règles', href: '/communaute/regles' }}
      />
    </>
  );
}

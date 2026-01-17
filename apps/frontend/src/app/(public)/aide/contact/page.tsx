/**
 * Page: Contact
 * Route: /aide/contact
 */

'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Clock, MapPin, Send, CheckCircle, Phone, Globe } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { CTASection } from '@/components/public/cta-section';

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    
    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setFormState('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@secondlife-exchange.com',
      description: 'Réponse sous 24h ouvrées',
    },
    {
      icon: MessageSquare,
      title: 'Chat en ligne',
      value: 'Disponible 7j/7',
      description: 'De 9h à 19h (heure de Paris)',
    },
    {
      icon: Phone,
      title: 'Téléphone',
      value: '+33 1 23 45 67 89',
      description: 'Lun-Ven, 9h-18h',
    },
  ];

  const offices = [
    {
      city: 'Paris',
      address: '15 rue de l\'Innovation',
      postalCode: '75011 Paris',
      country: 'France',
    },
    {
      city: 'Lyon',
      address: '8 place des Échanges',
      postalCode: '69002 Lyon',
      country: 'France',
    },
  ];

  const subjects = [
    'Question générale',
    'Problème technique',
    'Signaler un utilisateur',
    'Partenariat',
    'Presse',
    'Autre',
  ];

  return (
    <>
      <PageHero
        icon={Mail}
        badge="Contactez-nous"
        badgeColor="info"
        title="Comment pouvons-nous vous aider ?"
        subtitle="Notre équipe est là pour répondre à toutes vos questions. Choisissez le moyen de contact qui vous convient."
      />

      {/* Section: Méthodes de contact */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-16 sm:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e4e4e7] bg-white p-6 text-center transition-all hover:border-[#10b981]/30 hover:shadow-lg dark:border-[#27272a] dark:bg-[#121216]"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                <method.icon className="h-7 w-7 text-[#10b981]" />
              </div>
              <h3 className="mb-1 font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                {method.title}
              </h3>
              <p className="mb-2 text-[#10b981]">{method.value}</p>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                {method.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Formulaire de contact */}
      <section className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216] sm:p-8">
              <h2 className="mb-6 text-xl font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                Envoyez-nous un message
              </h2>

              {formState === 'success' ? (
                <div className="rounded-lg bg-[rgba(16,185,129,0.1)] p-6 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-[#10b981]" />
                  <h3 className="mb-2 text-lg font-semibold text-[#10b981]">
                    Message envoyé !
                  </h3>
                  <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                    Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais (généralement sous 24h).
                  </p>
                  <button
                    onClick={() => setFormState('idle')}
                    className="mt-4 text-sm font-medium text-[#10b981] hover:underline"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                        placeholder="jean@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                      Sujet *
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      {subjects.map((subject, index) => (
                        <option key={index} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0b0b0d] dark:text-[#ededee]">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full resize-none rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors focus:border-[#10b981] dark:border-[#27272a] dark:bg-[#0b0b0d]"
                      placeholder="Décrivez votre demande en détail..."
                    />
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
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            {/* Temps de réponse */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#10b981]" />
                <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  Temps de réponse
                </h3>
              </div>
              <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                Nous nous efforçons de répondre à tous les messages sous <strong className="text-[#0b0b0d] dark:text-[#ededee]">24 heures ouvrées</strong>. 
                Pour les urgences, privilégiez le chat en ligne.
              </p>
            </div>

            {/* Nos bureaux */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <div className="mb-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#10b981]" />
                <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  Nos bureaux
                </h3>
              </div>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-[#fafafa] p-4 dark:bg-[#0b0b0d]"
                  >
                    <h4 className="mb-1 font-medium text-[#0b0b0d] dark:text-[#ededee]">
                      {office.city}
                    </h4>
                    <p className="text-sm text-[#71717a] dark:text-[#a1a1aa]">
                      {office.address}
                      <br />
                      {office.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
              <div className="mb-4 flex items-center gap-3">
                <Globe className="h-5 w-5 text-[#10b981]" />
                <h3 className="font-semibold text-[#0b0b0d] dark:text-[#ededee]">
                  Suivez-nous
                </h3>
              </div>
              <div className="flex gap-3">
                {['Twitter', 'Instagram', 'LinkedIn', 'Facebook'].map((social, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a] transition-colors hover:bg-[#10b981] hover:text-white dark:bg-[#27272a]"
                  >
                    <span className="sr-only">{social}</span>
                    <Globe className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        icon={MessageSquare}
        title="Besoin d'aide immédiate ?"
        description="Consultez notre FAQ pour trouver des réponses instantanées aux questions les plus fréquentes."
        primaryAction={{ label: 'Voir la FAQ', href: '/aide/faq' }}
        secondaryAction={{ label: 'Guide d\'échange', href: '/communaute/guide-echange' }}
      />
    </>
  );
}

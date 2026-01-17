'use client';

import { Leaf, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { CookieSettingsButton } from '@/components/cookies';

export function Footer() {
  const footerLinks = {
    'À propos': [
      { name: 'Notre mission', href: '/a-propos/notre-mission' },
      { name: "L'équipe", href: '/a-propos/equipe' },
      { name: 'Impact écologique', href: '/a-propos/impact-ecologique' },
      { name: 'Partenaires', href: '/a-propos/partenaires' },
    ],
    Communauté: [
      { name: "Guide d'échange", href: '/communaute/guide-echange' },
      { name: 'Règles', href: '/communaute/regles' },
      { name: 'Blog', href: '/communaute/blog' },
      { name: 'Événements', href: '/communaute/evenements' },
    ],
    Aide: [
      { name: 'FAQ', href: '/aide/faq' },
      { name: 'Contact', href: '/aide/contact' },
      { name: 'Sécurité', href: '/aide/securite' },
      { name: 'Signaler', href: '/aide/signaler' },
    ],
    Légal: [
      { name: "Conditions d'utilisation", href: '/legal/conditions-utilisation' },
      { name: 'Confidentialité', href: '/legal/confidentialite' },
      { name: 'Cookies', href: '/legal/cookies' },
    ],
  };

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border bg-card">
      <div className="container mx-auto pb-[48px] pt-[48px] lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6 pb-[48px]">
          {/* Logo & Mission */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/icons/icon-192x192.png"
                alt="SecondLife Exchange"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
              <span className="text-base font-semibold sm:text-lg">
                SecondLife Exchange
              </span>
            </div>
            <p className="mb-6 text-muted-foreground">
              Donnez une seconde vie à vos objets et contribuez à un avenir plus
              durable.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Leaf className="h-4 w-4 text-primary" />
                <span className="text-sm">Éco-responsable</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm">IA intégrée</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 SecondLife Exchange. Tous droits réservés.
            </p>
            {/* Bouton Gestion des cookies - RGPD */}
            <CookieSettingsButton />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Plus de 50,000 objets échangés</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

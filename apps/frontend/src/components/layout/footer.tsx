import { Leaf, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const footerLinks = {
    'À propos': [
      { name: 'Notre mission', href: '/about' },
      { name: "L'équipe", href: '/team' },
      { name: 'Impact écologique', href: '/impact' },
      { name: 'Partenaires', href: '/partners' },
    ],
    Communauté: [
      { name: "Guide d'échange", href: '/guide' },
      { name: 'Règles', href: '/rules' },
      { name: 'Blog', href: '/blog' },
      { name: 'Événements', href: '/events' },
    ],
    Aide: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
      { name: 'Sécurité', href: '/security' },
      { name: 'Signaler', href: '/report' },
    ],
    Légal: [
      { name: "Conditions d'utilisation", href: '/terms' },
      { name: 'Confidentialité', href: '/privacy' },
      { name: 'Cookies', href: '/cookies' },
    ],
  };

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
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
              <span className="text-base font-semibold sm:text-lg">SecondLife Exchange</span>
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
          <p className="text-sm text-muted-foreground">
            © 2025 SecondLife Exchange. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Plus de 50,000 objets échangés</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


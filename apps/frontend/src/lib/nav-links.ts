export interface NavLink {
  href: string;
  label: string;
  protected?: boolean;
  icon?: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Accueil', icon: 'Home' },
  { href: '/explore', label: 'Explorer', icon: 'Search' },
  { href: '/discover', label: 'Découvrir', icon: 'Leaf' },
  { href: '/community', label: 'Communauté', icon: 'Users' },
  {
    href: '/matching',
    label: 'Recommandations',
    icon: 'Heart',
    protected: true,
  },
  { href: '/themes', label: 'Thèmes', icon: 'Calendar' },
  {
    href: '/exchanges',
    label: 'Mes échanges',
    protected: true,
    icon: 'MessageSquare',
  },
];

export const CTA_LINK: NavLink = {
  href: '/item/new',
  label: 'Proposer un objet',
  icon: 'Plus',
};

export const USER_LINKS: NavLink[] = [
  { href: '/profile', label: 'Mon profil', icon: 'User' },
  { href: '/settings', label: 'Paramètres', icon: 'Settings' },
  { href: '/logout', label: 'Déconnexion', icon: 'LogOut' },
];

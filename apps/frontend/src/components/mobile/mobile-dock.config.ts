/**
 * FICHIER: mobile-dock.config.ts
 *
 * DESCRIPTION:
 * Configuration des liens de navigation pour le dock mobile.
 * Définit les routes, icônes, labels et propriétés spéciales (CTA, protected, avatar).
 */

import { Home, Compass, PlusCircle, RefreshCw, UserRound } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type MobileDockLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  cta?: boolean;
  protected?: boolean;
  avatar?: boolean;
};

export const MOBILE_DOCK_LINKS: MobileDockLink[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/explore', label: 'Explorer', icon: Compass },
  { href: '/item/new', label: 'Proposer', icon: PlusCircle, cta: true },
  { href: '/exchanges', label: 'Échanger', icon: RefreshCw, protected: true },
  { href: '/profile', label: 'Profil', icon: UserRound, avatar: true },
];


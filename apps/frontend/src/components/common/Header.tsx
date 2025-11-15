/**
 * FICHIER: Header.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche l'en-tête de l'application avec la navigation.
 * Il utilise un design responsive avec navigation desktop et mobile séparées.
 *
 * FONCTIONNALITÉS:
 * - En-tête sticky (reste en haut lors du scroll)
 * - Animation d'apparition avec Framer Motion
 * - Backdrop blur pour un effet de transparence
 * - Navigation desktop et mobile séparées
 * - Design responsive
 *
 * NOTE:
 * Ce composant est une alternative à Navbar.tsx.
 * Il utilise NavDesktop et NavMobile pour séparer les logiques.
 */

'use client';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import des composants de navigation
import { Container } from './Container';
import { NavDesktop } from './NavDesktop';
import { NavMobile } from './NavMobile';

/**
 * COMPOSANT: Header
 *
 * En-tête principal de l'application avec navigation.
 */
export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="from-background/98 to-background/98 sticky top-0 z-50 w-full border-b border-border/20 bg-gradient-to-r via-background/95 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
    >
      <Container>
        <div className="flex h-20 items-center">
          <NavDesktop />
          <NavMobile />
        </div>
      </Container>
    </motion.header>
  );
}

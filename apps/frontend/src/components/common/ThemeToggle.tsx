/**
 * FICHIER: components/common/ThemeToggle.tsx
 *
 * DESCRIPTION:
 * Bouton permettant de basculer entre thème clair/sombre. Ajoute ou retire
 * la classe `dark` sur `<html>` pour que Tailwind applique les styles `dark:`.
 *
 * FONCTIONNEMENT:
 * - À l’init, on détecte le thème actuel via la classe sur `<html>` ou la
 *   préférence système (`prefers-color-scheme`).
 * - Au clic, on inverse `isDark` et on met à jour les classes `dark`/`light`.
 *
 * UX:
 * - Utilise `Button` variant ghost + icônes Sun/Moon avec une rotation animée
 *   pour indiquer visuellement le changement.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // Dark mode par défaut

  useEffect(() => {
    // Vérifier le thème initial
    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(isDarkMode);

    // Appliquer le thème par défaut si aucun n'est défini
    if (
      !document.documentElement.classList.contains('dark') &&
      !document.documentElement.classList.contains('light')
    ) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 hover:bg-primary/10"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </motion.div>
    </Button>
  );
}

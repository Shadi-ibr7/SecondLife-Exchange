/**
 * FICHIER: components/common/ThemeToggle.tsx
 *
 * DESCRIPTION:
 * Bouton permettant de basculer entre thème clair/sombre.
 * Utilise le store Zustand pour gérer le thème de manière centralisée.
 *
 * FONCTIONNEMENT:
 * - Utilise le store theme pour récupérer et modifier le thème.
 * - Le thème est automatiquement sauvegardé dans localStorage via Zustand persist.
 *
 * UX:
 * - Utilise des icônes Sun/Moon avec une rotation animée pour indiquer visuellement le changement.
 */

'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/theme';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // Basculer entre light et dark (ignorer 'system' pour le toggle)
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Éviter le flash de contenu non stylé
  if (!mounted) {
    return (
      <button
        className="h-8 w-8 rounded-md flex items-center justify-center"
        aria-label="Chargement du thème"
      >
        <Sun className="h-4 w-4 text-[#1e1e20] dark:text-[#ececed]" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-[#1e1e20] dark:text-[#ececed]" />
        ) : (
          <Moon className="h-4 w-4 text-[#1e1e20] dark:text-[#ececed]" />
        )}
      </motion.div>
    </button>
  );
}

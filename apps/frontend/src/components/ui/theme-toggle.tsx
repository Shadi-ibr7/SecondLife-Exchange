'use client';

import { Button } from './button';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  isDark?: boolean;
  onToggle?: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    onToggle?.();
  };

  const currentTheme = resolvedTheme || theme;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="hover:bg-accent"
    >
      {currentTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Basculer le thème</span>
    </Button>
  );
}

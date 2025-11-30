/**
 * FICHIER: components/common/SearchOverlay.tsx
 *
 * DESCRIPTION:
 * Overlay plein écran pour lancer une recherche rapide depuis n’importe où.
 * Gestion du focus, fermeture via Escape, suggestions rapides et redirection
 * vers `/explore?search=...`.
 *
 * FLUX:
 * - `isOpen` contrôle l’affichage (AnimatePresence + motion).
 * - focus automatique sur l’input, blocage du scroll body.
 * - submit => redirige vers /explore avec la query + ferme l’overlay.
 * - suggestions cliquables (“Électronique”, etc.) pré-remplissent la recherche.
 *
 * UX:
 * - Fond sombre (backdrop) et carte stylée.
 * - Bouton clair pour refermer et bouton action “Rechercher”.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus sur l'input quand l'overlay s'ouvre
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    // Fermer avec la touche Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body quand l'overlay est ouvert
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-0 right-0 z-50 mx-auto max-w-3xl px-4"
            style={{ top: '5rem' }}
          >
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <div className="relative rounded-lg border border-border bg-card shadow-lg">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Rechercher des objets, catégories..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-14 border-0 bg-transparent pl-12 pr-24 text-base focus-visible:ring-2 focus-visible:ring-primary"
                  role="search"
                  aria-label="Rechercher des objets"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuery('')}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!query.trim()}
                    className="h-9"
                  >
                    Rechercher
                  </Button>
                </div>
              </div>

              {/* Suggestions rapides (optionnel) */}
              <div className="mt-2 rounded-lg border border-border bg-card p-2 shadow-lg">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Recherches rapides :
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Électronique', 'Vêtements', 'Livres', 'Meubles'].map(
                    (suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery(suggestion);
                          router.push(
                            `/explore?search=${encodeURIComponent(suggestion)}`
                          );
                          onClose();
                        }}
                        className="h-7 text-xs"
                      >
                        {suggestion}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

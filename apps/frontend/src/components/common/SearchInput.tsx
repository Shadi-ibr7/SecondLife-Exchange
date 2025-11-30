/**
 * FICHIER: components/common/SearchInput.tsx
 *
 * DESCRIPTION:
 * Champ de recherche compact (utilisé dans la navbar) pour rediriger vers
 * `/explore` avec la query. Similaire à SearchOverlay mais inline.
 *
 * FLUX:
 * - Récupère le texte saisi, `router.push` avec ?search=...
 * - Icône Search positionnée en absolu, Input stylisé.
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SearchInput() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Rechercher des objets..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-64 border-border/50 bg-background/50 pl-10 backdrop-blur-sm focus:border-primary/50 focus:bg-background md:w-80"
        role="search"
        aria-label="Rechercher des objets"
      />
    </form>
  );
}

/**
 * FICHIER: AvatarMini.tsx
 *
 * DESCRIPTION:
 * Composant avatar miniature pour le dock mobile.
 * Affiche une image ou une initiale dans un cercle.
 */

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { palette } from '@/lib/palette';

interface AvatarMiniProps {
  imageUrl?: string | null;
  displayName?: string | null;
  size?: number;
}

export function AvatarMini({
  imageUrl,
  displayName,
  size = 32,
}: AvatarMiniProps) {
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Avatar
      className="border border-white/10"
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={displayName || 'Avatar'} />
      ) : null}
      <AvatarFallback
        className="text-xs font-medium"
        style={{
          backgroundColor: palette.ink,
          color: palette.beige,
        }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}


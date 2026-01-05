'use client';

import { Sparkles, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface MatchCardProps {
  id: string;
  image: string;
  title: string;
  category: string;
  condition: string;
  location: string;
  compatibilityScore: number;
  onClick?: () => void;
}

export function MatchCard({
  id,
  image,
  title,
  category,
  condition,
  location,
  compatibilityScore,
  onClick,
}: MatchCardProps) {
  // Couleurs des badges de condition selon Figma
  const conditionColors: Record<string, { bg: string; border: string; text: string }> =
    {
      'Comme neuf': {
        bg: 'bg-[rgba(0,201,80,0.1)]',
        border: 'border-[rgba(0,201,80,0.2)]',
        text: 'text-[#00c950]',
      },
      'Très bon': {
        bg: 'bg-[rgba(43,127,255,0.1)]',
        border: 'border-[rgba(43,127,255,0.2)]',
        text: 'text-[#51a2ff]',
      },
      Bon: {
        bg: 'bg-[rgba(255,193,7,0.1)]',
        border: 'border-[rgba(255,193,7,0.2)]',
        text: 'text-[#ffc107]',
      },
      Acceptable: {
        bg: 'bg-[rgba(255,87,34,0.1)]',
        border: 'border-[rgba(255,87,34,0.2)]',
        text: 'text-[#ff5722]',
      },
    };

  const conditionStyle =
    conditionColors[condition] || conditionColors['Acceptable'];

  // Couleur du score de compatibilité selon la valeur
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#10b981]';
    if (score >= 60) return 'text-[#51a2ff]';
    if (score >= 40) return 'text-[#fdc700]';
    return 'text-[#ff5722]';
  };

  return (
    <Link href={`/item/${id}`}>
      <div
        className="group relative h-[360px] cursor-pointer overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white transition-all duration-300 hover:border-[#e4e4e7]/80 dark:border-[#27272a] dark:bg-[#121216] dark:hover:border-[#27272a]/80"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative h-[220px] w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Badge score de compatibilité en haut à droite */}
          <div className="absolute right-3 top-3 flex h-[28px] items-center gap-1 rounded-full bg-white/90 px-2 backdrop-blur-sm dark:bg-[#121216]/90">
            <Sparkles className="h-3.5 w-3.5 text-[#10b981]" />
            <span
              className={`text-xs font-semibold leading-4 ${getScoreColor(compatibilityScore)}`}
            >
              {compatibilityScore}%
            </span>
          </div>
        </div>

        {/* Contenu de la carte */}
        <div className="flex flex-col gap-3 p-4">
          {/* Titre et Catégorie */}
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-2 text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
              {title}
            </h3>
            <p className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
              {category}
            </p>
          </div>

          <div className="flex h-[22px] items-center justify-between">
            {/* Badge condition - Design Figma */}
            <div
              className={`flex h-[22px] items-center rounded-[8px] border px-[9px] py-[3px] ${conditionStyle.bg} ${conditionStyle.border} ${conditionStyle.text}`}
            >
              <span className="text-xs font-semibold leading-4">
                {condition}
              </span>
            </div>
            {/* Localisation */}
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#71717a] dark:text-[#a1a1aa]" />
              <span className="text-xs leading-[18px] tracking-[-0.078px] text-[#71717a] dark:text-[#a1a1aa]">
                {location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


'use client';

import { Sparkles, MapPin } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ItemCardProps {
  id: string;
  title: string;
  image: string;
  category: string;
  condition: string;
  location: string;
  tags?: string[];
  aiSuggested?: boolean;
  onClick?: () => void;
}

export function ItemCard({
  title,
  image,
  category,
  condition,
  location,
  tags = [],
  aiSuggested = false,
  onClick,
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Couleurs des badges selon le design Figma
  const conditionColors: Record<string, { bg: string; border: string; text: string }> = {
    'Comme neuf': {
      bg: 'bg-[rgba(0,201,80,0.1)]',
      border: 'border-[rgba(0,201,80,0.2)]',
      text: 'text-[#05df72]',
    },
    'Très bon': {
      bg: 'bg-[rgba(43,127,255,0.1)]',
      border: 'border-[rgba(43,127,255,0.2)]',
      text: 'text-[#51a2ff]',
    },
    Bon: {
      bg: 'bg-[rgba(240,177,0,0.1)]',
      border: 'border-[rgba(240,177,0,0.2)]',
      text: 'text-[#fdc700]',
    },
    Acceptable: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
    },
  };

  const conditionStyle = conditionColors[condition] || {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  };

  return (
    <div
      className="group relative h-[360px] cursor-pointer overflow-hidden rounded-[14px] border border-[#27272a] bg-[#121216] transition-all duration-300 hover:border-[#27272a]/80"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image - 220x220px selon Figma */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        {/* Badge IA - Design Figma */}
        {aiSuggested && (
          <div className="absolute right-3 top-3 flex h-[28px] items-center gap-[6px] rounded-full bg-[rgba(16,185,129,0.9)] px-3">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="text-xs leading-4 text-white">IA</span>
          </div>
        )}
      </div>

      {/* Contenu en bas - Design Figma */}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base leading-[24px] tracking-[-0.3125px] text-[#ededee]">
            {title}
          </h3>
          <p className="text-sm leading-[20px] tracking-[-0.1504px] text-[#a1a1aa]">
            {category}
          </p>
        </div>

        <div className="flex h-[22px] items-center justify-between">
          {/* Badge condition - Design Figma */}
          <div
            className={`flex h-[22px] items-center rounded-[8px] border px-[9px] py-[3px] ${conditionStyle.bg} ${conditionStyle.border} ${conditionStyle.text}`}
          >
            <span className="text-xs font-semibold leading-4">{condition}</span>
          </div>
          {/* Localisation */}
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#a1a1aa]" />
            <span className="text-xs leading-4 text-[#a1a1aa]">{location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


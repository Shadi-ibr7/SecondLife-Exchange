'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, Leaf, Sparkles, FileText } from 'lucide-react';

interface ArticleCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  readingTime: string;
  co2Impact: string;
  aiSuggested?: boolean;
  href?: string;
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  Réparation: {
    bg: 'bg-[rgba(43,127,255,0.1)]',
    border: 'border-[rgba(43,127,255,0.2)]',
    text: 'text-[#51a2ff]',
  },
  'Guides pratiques': {
    bg: 'bg-[rgba(240,177,0,0.1)]',
    border: 'border-[rgba(240,177,0,0.2)]',
    text: 'text-[#fdc700]',
  },
  'IA & innovation': {
    bg: 'bg-[rgba(16,185,129,0.1)]',
    border: 'border-[rgba(16,185,129,0.2)]',
    text: 'text-[#10b981]',
  },
  Écologie: {
    bg: 'bg-[rgba(0,201,80,0.1)]',
    border: 'border-[rgba(0,201,80,0.2)]',
    text: 'text-[#05df72]',
  },
  'Économie circulaire': {
    bg: 'bg-[rgba(173,70,255,0.1)]',
    border: 'border-[rgba(173,70,255,0.2)]',
    text: 'text-[#c27aff]',
  },
};

export function ArticleCard({
  id,
  title,
  description,
  image,
  category,
  readingTime,
  co2Impact,
  aiSuggested = false,
  href = `/discover/${id}`,
}: ArticleCardProps) {
  const categoryStyle = categoryColors[category] || categoryColors['Écologie'];

  const cardContent = (
    <div className="group relative h-[434px] w-full cursor-pointer overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white transition-all duration-300 hover:border-[#e4e4e7]/80 dark:border-[#27272a] dark:bg-[#121216] dark:hover:border-[#27272a]/80">
      {/* Image */}
      <div className="relative h-[199px] w-full overflow-hidden bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5">
        {image && image !== '/placeholder-article.jpg' ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-12 w-12 text-[#10b981]/30" />
          </div>
        )}
        {/* Badge IA en haut à droite */}
        {aiSuggested && (
          <div className="absolute right-[12px] top-[12px] flex h-[28px] items-center gap-[6px] rounded-full bg-[rgba(16,185,129,0.9)] px-3">
            <Sparkles className="h-[14px] w-[14px] text-white" />
            <span className="text-xs leading-4 text-white">IA</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex h-[235px] flex-col gap-[12px] p-5">
        {/* Badge catégorie */}
        <div
          className={`flex h-[22px] w-fit items-center rounded-[8px] border px-[9px] py-[3px] ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text}`}
        >
          <span className="text-xs font-semibold leading-4">{category}</span>
        </div>

        {/* Titre et description */}
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 text-base leading-[24px] tracking-[-0.3125px] text-[#0b0b0d] dark:text-[#ededee]">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
            {description}
          </p>
        </div>

        {/* Métadonnées en bas */}
        <div className="flex items-center justify-between border-t border-[#e4e4e7] pt-[1px] dark:border-[#27272a]">
          <div className="flex items-center gap-[6px]">
            <Clock className="h-[14px] w-[14px] text-[#71717a] dark:text-[#a1a1aa]" />
            <span className="text-xs leading-4 text-[#71717a] dark:text-[#a1a1aa]">
              {readingTime}
            </span>
          </div>
          <div className="flex items-center gap-[6px]">
            <Leaf className="h-[14px] w-[14px] text-[#05df72]" />
            <span className="text-xs leading-4 text-[#05df72]">{co2Impact}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}


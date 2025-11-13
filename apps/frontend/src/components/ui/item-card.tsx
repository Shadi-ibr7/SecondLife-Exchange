'use client';

import { Card } from './card';
import { Badge } from './badge';
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

  const conditionColors: Record<string, string> = {
    'Comme neuf': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Très bon': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Bon: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Acceptable: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {aiSuggested && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="text-xs text-white">IA</span>
          </div>
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-3 left-3 right-3">
            {isHovered && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-white/30 bg-white/20 text-xs text-white backdrop-blur-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{category}</p>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`${conditionColors[condition] || 'bg-muted'}`}
          >
            {condition}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-xs">{location}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}


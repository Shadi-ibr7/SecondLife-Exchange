'use client';

import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ArrowRight, Calendar, Leaf } from 'lucide-react';
import Image from 'next/image';

interface ThemeCardProps {
  title: string;
  image: string;
  period: string;
  description: string;
  impact: string;
  isActive?: boolean;
  onExplore?: () => void;
}

export function ThemeCard({
  title,
  image,
  period,
  description,
  impact,
  isActive = false,
  onExplore,
}: ThemeCardProps) {
  return (
    <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/30">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white" />
            <span className="text-sm text-white/90">{period}</span>
          </div>
          {isActive && (
            <Badge className="border-0 bg-primary/90 text-white">Actuel</Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
          <p className="line-clamp-2 text-sm text-white/90">{description}</p>
        </div>
      </div>

      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-green-400">
          <Leaf className="h-4 w-4" />
          <span className="text-sm font-medium">Impact écologique</span>
        </div>

        <p className="text-sm text-muted-foreground">{impact}</p>

        <Button
          onClick={onExplore}
          className="w-full bg-primary hover:bg-primary/90"
        >
          Explorer ce thème
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}


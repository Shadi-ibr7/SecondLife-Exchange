'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types';
import { ITEM_CATEGORY_LABELS, ITEM_CONDITION_LABELS } from '@/lib/constants';
import { MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface ItemCardProps {
  item: Item;
  index?: number;
}

export function ItemCard({ item, index = 0 }: ItemCardProps) {
  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  const isMock = item.id.startsWith('mock-');
  const handleMockClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (isMock) {
      e.preventDefault();
      toast("Aperçu d'annonce. Publiez un objet pour voir la fiche détaillée.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
        <Link
          href={isMock ? '/explore' : `/item/${item.id}`}
          onClick={handleMockClick}
        >
          <div className="flex aspect-square items-center justify-center rounded-t-lg bg-muted">
            {item.photos.length > 0 ? (
              <img
                src={item.photos[0].url}
                alt={item.title}
                className="h-full w-full rounded-t-lg object-cover"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="mb-2 text-4xl">📦</div>
                <p>Aucune image</p>
              </div>
            )}
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{item.owner.location || 'Localisation non précisée'}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {ITEM_CATEGORY_LABELS[item.category] || item.category}
              </Badge>
              <Badge variant="outline">
                {ITEM_CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Par {item.owner.displayName}</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </div>
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}

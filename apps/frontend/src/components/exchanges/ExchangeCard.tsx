import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Exchange } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface ExchangeCardProps {
  exchange: Exchange;
  currentUserId: string;
}

export function ExchangeCard({ exchange, currentUserId }: ExchangeCardProps) {
  const isRequester = exchange.requesterId === currentUserId;
  const otherUser = isRequester ? exchange.responder : exchange.requester;

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="line-clamp-2 text-lg">
                {isRequester ? 'Vous proposez' : 'Vous recevez'}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRequester
                  ? exchange.offeredItemTitle
                  : exchange.requestedItemTitle}
              </p>
            </div>
            <StatusBadge status={exchange.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Échange */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {isRequester ? 'Contre' : 'Pour'}
              </span>
            </div>
            <p className="pl-6 text-sm text-muted-foreground">
              {isRequester
                ? exchange.requestedItemTitle
                : exchange.offeredItemTitle}
            </p>
          </div>

          {/* Utilisateur */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Avec</span>
            <span className="font-medium">{otherUser.displayName}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Il y a {formatRelativeTime(exchange.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <Button asChild className="w-full">
              <Link href={`/exchange/${exchange.id}`}>Voir l'échange</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

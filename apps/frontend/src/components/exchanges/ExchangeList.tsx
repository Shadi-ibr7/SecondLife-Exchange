import { Exchange } from '@/types';
import { ExchangeCard } from './ExchangeCard';
import { useAuthStore } from '@/store/auth';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ExchangeListProps {
  exchanges: Exchange[];
  isLoading?: boolean;
}

export function ExchangeList({
  exchanges,
  isLoading = false,
}: ExchangeListProps) {
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (exchanges.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-12 text-center backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          Aucun échange en cours
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Lancez-vous en proposant un échange sur un objet qui vous inspire.
        </p>
        <Button asChild>
          <Link href="/explore">Explorer les objets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {exchanges.map((exchange) => (
        <ExchangeCard
          key={exchange.id}
          exchange={exchange}
          currentUserId={user?.id || ''}
        />
      ))}
    </div>
  );
}

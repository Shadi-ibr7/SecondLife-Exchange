import { Exchange, ExchangeStatus } from '@/types';
import { ExchangeCard } from './ExchangeCard';
import { useAuthStore } from '@/store/auth';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl">🤝</div>
        <h3 className="mb-2 text-xl font-semibold">Aucun échange</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas encore d'échanges en cours
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

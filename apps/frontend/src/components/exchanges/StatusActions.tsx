import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Exchange, ExchangeStatus } from '@/types';
import { exchangesApi } from '@/lib/exchanges.api';
import { toast } from 'react-hot-toast';
import { Check, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface StatusActionsProps {
  exchange: Exchange;
  onStatusUpdate: (updatedExchange: Exchange) => void;
}

export function StatusActions({
  exchange,
  onStatusUpdate,
}: StatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const isRequester = exchange.requesterId === user?.id;
  const isResponder = exchange.responderId === user?.id;

  const handleStatusUpdate = async (newStatus: ExchangeStatus) => {
    setIsLoading(true);
    try {
      const updatedExchange = await exchangesApi.updateExchangeStatus(
        exchange.id,
        {
          status: newStatus,
        }
      );
      onStatusUpdate(updatedExchange);
      toast.success(`Échange ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // Règles d'affichage des boutons selon le statut et le rôle
  const canAccept = isResponder && exchange.status === 'PENDING';
  const canDecline = isResponder && exchange.status === 'PENDING';
  const canComplete =
    (isRequester || isResponder) && exchange.status === 'ACCEPTED';
  const canCancel =
    (isRequester || isResponder) &&
    ['PENDING', 'ACCEPTED'].includes(exchange.status);

  if (exchange.status === 'COMPLETED') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Terminé
        </Badge>
        {exchange.completedAt && (
          <span className="text-sm text-muted-foreground">
            le {new Date(exchange.completedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    );
  }

  if (exchange.status === ('DECLINED' as const)) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Refusé
        </Badge>
      </div>
    );
  }

  if (exchange.status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Annulé
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canAccept && (
        <Button
          onClick={() => handleStatusUpdate('ACCEPTED')}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Accepter
        </Button>
      )}

      {canDecline && (
        <Button
          onClick={() => handleStatusUpdate('DECLINED')}
          disabled={isLoading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Refuser
        </Button>
      )}

      {canComplete && (
        <Button
          onClick={() => handleStatusUpdate('COMPLETED')}
          disabled={isLoading}
          variant="default"
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Marquer comme terminé
        </Button>
      )}

      {canCancel && (
        <Button
          onClick={() => handleStatusUpdate('CANCELLED')}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Annuler
        </Button>
      )}
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { ExchangeStatus } from '@/types';

interface StatusBadgeProps {
  status: ExchangeStatus;
}

const STATUS_LABELS: Record<ExchangeStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Accepté',
  DECLINED: 'Refusé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

const STATUS_VARIANTS: Record<
  ExchangeStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'outline',
  ACCEPTED: 'default',
  DECLINED: 'destructive',
  COMPLETED: 'secondary',
  CANCELLED: 'secondary',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

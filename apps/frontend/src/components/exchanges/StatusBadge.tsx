import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExchangeStatus } from '@/types';

interface StatusBadgeProps {
  status: ExchangeStatus;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
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

export function StatusBadge({ status, className, variant }: StatusBadgeProps) {
  return (
    <Badge
      variant={variant ?? STATUS_VARIANTS[status]}
      className={cn(className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

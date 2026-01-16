/**
 * FICHIER: components/notifications/NotificationItem.tsx
 *
 * DESCRIPTION:
 * Composant pour afficher une notification individuelle.
 * Gère l'affichage, le clic pour marquer comme lu, et la navigation.
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  ArrowLeftRight,
  CheckCircle,
  ShieldAlert,
  Leaf,
  Sparkles,
  Calendar,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AppNotification,
  NotificationType,
  getNotificationUrl,
  formatNotificationDate,
} from '@/lib/notifications.api';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => Promise<void>;
}

// Map des icônes par type
const iconMap: Record<NotificationType, React.ElementType> = {
  MESSAGE: MessageCircle,
  EXCHANGE_REQUEST: ArrowLeftRight,
  EXCHANGE_STATUS: CheckCircle,
  ADMIN_ACTION: ShieldAlert,
  ECO_CONTENT_PUBLISHED: Leaf,
  MATCH_FOUND: Sparkles,
  WEEKLY_THEME: Calendar,
  SYSTEM: Bell,
};

// Couleurs de fond par type
const bgColorMap: Record<NotificationType, string> = {
  MESSAGE: 'bg-blue-500/10',
  EXCHANGE_REQUEST: 'bg-orange-500/10',
  EXCHANGE_STATUS: 'bg-green-500/10',
  ADMIN_ACTION: 'bg-red-500/10',
  ECO_CONTENT_PUBLISHED: 'bg-emerald-500/10',
  MATCH_FOUND: 'bg-purple-500/10',
  WEEKLY_THEME: 'bg-yellow-500/10',
  SYSTEM: 'bg-gray-500/10',
};

// Couleurs d'icône par type
const iconColorMap: Record<NotificationType, string> = {
  MESSAGE: 'text-blue-500',
  EXCHANGE_REQUEST: 'text-orange-500',
  EXCHANGE_STATUS: 'text-green-500',
  ADMIN_ACTION: 'text-red-500',
  ECO_CONTENT_PUBLISHED: 'text-emerald-500',
  MATCH_FOUND: 'text-purple-500',
  WEEKLY_THEME: 'text-yellow-500',
  SYSTEM: 'text-gray-500',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();
  const isUnread = !notification.readAt;
  const Icon = iconMap[notification.type] || Bell;

  const handleClick = async () => {
    // Marquer comme lu si pas encore fait
    if (isUnread) {
      try {
        await onMarkAsRead(notification.id);
      } catch (error) {
        // Continuer même si le marquage échoue
        console.error('Erreur marquage notification:', error);
      }
    }

    // Naviguer vers la destination
    const url = getNotificationUrl(notification);
    if (url) {
      router.push(url);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-4 rounded-lg p-4 text-left transition-colors',
        'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
        isUnread ? 'bg-primary/5' : 'bg-transparent'
      )}
    >
      {/* Icône */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          bgColorMap[notification.type]
        )}
      >
        <Icon className={cn('h-5 w-5', iconColorMap[notification.type])} />
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              'truncate text-sm font-medium',
              isUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {notification.title}
          </h4>
          {isUnread && (
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p
          className={cn(
            'mt-0.5 line-clamp-2 text-sm',
            isUnread ? 'text-muted-foreground' : 'text-muted-foreground/70'
          )}
        >
          {notification.body}
        </p>
        <span className="mt-1 block text-xs text-muted-foreground/60">
          {formatNotificationDate(notification.createdAt)}
        </span>
      </div>
    </button>
  );
}

import { motion } from 'framer-motion';
import { ChatMessage, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageBubbleProps {
  message: ChatMessage;
  sender: User;
  isOwn: boolean;
  isOptimistic?: boolean;
}

export function MessageBubble({
  message,
  sender,
  isOwn,
  isOptimistic = false,
}: MessageBubbleProps) {
  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.avatarUrl} alt={sender.displayName} />
          <AvatarFallback>
            {sender.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {!isOwn && (
          <p className="mb-1 px-2 text-xs text-muted-foreground">
            {sender.displayName}
          </p>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
          } ${isOptimistic ? 'opacity-70' : ''}`}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>

        {message.createdAt && (
          <p
            className={`mt-1 px-2 text-xs text-muted-foreground ${
              isOwn ? 'text-right' : 'text-left'
            }`}
          >
            {formatTime(message.createdAt)}
          </p>
        )}

        {isOptimistic && (
          <p className="mt-1 px-2 text-xs text-muted-foreground">
            Envoi en cours...
          </p>
        )}
      </div>
    </motion.div>
  );
}

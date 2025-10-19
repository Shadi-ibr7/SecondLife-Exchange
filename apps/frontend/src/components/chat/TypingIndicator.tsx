import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export function TypingIndicator({ user }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback>
          {user.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col">
        <p className="mb-1 px-2 text-xs text-muted-foreground">
          {user.displayName}
        </p>

        <div className="rounded-2xl bg-muted px-4 py-2">
          <div className="flex gap-1">
            <motion.div
              className="h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

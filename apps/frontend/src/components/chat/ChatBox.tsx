import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessage, User } from '@/types';
import { socketService } from '@/lib/socket';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useAuthStore } from '@/store/auth';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatBoxProps {
  exchangeId: string;
  messages: ChatMessage[];
  otherUser: User;
  onNewMessage?: (message: ChatMessage) => void;
}

export function ChatBox({
  exchangeId,
  messages,
  otherUser,
  onNewMessage,
}: ChatBoxProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    []
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { user } = useAuthStore();

  // Auto-scroll vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages, scrollToBottom]);

  // Connexion au socket
  useEffect(() => {
    if (!exchangeId || !user) return;

    socketService.connect();
    socketService.connectToExchange(exchangeId);

    // Écouter les nouveaux messages
    const handleNewMessage = (message: ChatMessage) => {
      onNewMessage?.(message);
      // Retirer le message optimiste s'il existe
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== message.id));
    };

    // Écouter les événements de frappe
    const handleTyping = (data: {
      exchangeId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (data.exchangeId !== exchangeId || data.userId === user.id) return;

      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    socketService.onMessage(handleNewMessage);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.offMessage(handleNewMessage);
      socketService.offTyping(handleTyping);
      socketService.leaveExchange();
    };
  }, [exchangeId, user, onNewMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Message optimiste
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      exchangeId,
      senderId: user.id,
      content: messageContent,
      createdAt: new Date().toISOString(),
      sender: user,
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    try {
      socketService.sendMessage(exchangeId, messageContent);
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
      // Retirer le message optimiste en cas d'erreur
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!user) return;

    setIsTyping(true);
    socketService.emitTyping(exchangeId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const allMessages = [...messages, ...optimisticMessages].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateA - dateB;
  });

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat avec {otherUser.displayName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-0">
        {/* Messages */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {allMessages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">
                Envoyez le premier message pour commencer la conversation
              </p>
            </div>
          ) : (
            <>
              {allMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  sender={
                    message.sender ||
                    (message.senderId === user?.id ? user : otherUser)
                  }
                  isOwn={message.senderId === user?.id}
                  isOptimistic={optimisticMessages.some(
                    (m) => m.id === message.id
                  )}
                />
              ))}

              {/* Indicateur de frappe */}
              <AnimatePresence>
                {typingUsers.size > 0 && <TypingIndicator user={otherUser} />}
              </AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={!user}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !user}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

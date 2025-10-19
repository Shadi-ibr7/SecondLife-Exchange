'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Exchange, ChatMessage } from '@/types';
import { exchangesApi } from '@/lib/exchanges.api';
import { StatusBadge } from '@/components/exchanges/StatusBadge';
import { StatusActions } from '@/components/exchanges/StatusActions';
import { ChatBox } from '@/components/chat/ChatBox';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  MessageCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import ProtectedRoute from '../../(auth)/protected';

function ExchangeDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const exchangeId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const {
    data: exchange,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['exchange', exchangeId],
    queryFn: () => exchangesApi.getExchange(exchangeId),
    enabled: !!exchangeId,
  });

  useEffect(() => {
    if (exchange?.messages) {
      setMessages(exchange.messages);
    }
  }, [exchange]);

  const handleStatusUpdate = (updatedExchange: Exchange) => {
    // Mettre à jour les messages si nécessaire
    if (updatedExchange.messages) {
      setMessages(updatedExchange.messages);
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="h-96 animate-pulse rounded-lg bg-muted" />
              </div>
              <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exchange) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-destructive">Échange non trouvé</p>
          <Button asChild>
            <Link href="/exchanges">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux échanges
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isRequester = exchange.requesterId === user?.id;
  const otherUser = isRequester ? exchange.responder : exchange.requester;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/exchanges">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Détail de l'échange</h1>
              <p className="text-muted-foreground">
                Échange #{exchange.id.slice(-8)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <ChatBox
              exchangeId={exchange.id}
              messages={messages}
              otherUser={otherUser}
              onNewMessage={handleNewMessage}
            />
          </motion.div>

          {/* Informations de l'échange */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Statut et actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Statut de l'échange
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut actuel</span>
                  <StatusBadge status={exchange.status} />
                </div>

                <Separator />

                <StatusActions
                  exchange={exchange}
                  onStatusUpdate={handleStatusUpdate}
                />
              </CardContent>
            </Card>

            {/* Détails de l'échange */}
            <Card>
              <CardHeader>
                <CardTitle>Détails de l'échange</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium">
                    {isRequester ? 'Vous proposez' : 'Vous recevez'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRequester
                      ? exchange.offeredItemTitle
                      : exchange.requestedItemTitle}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-medium">
                    {isRequester ? 'Contre' : 'Pour'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRequester
                      ? exchange.requestedItemTitle
                      : exchange.offeredItemTitle}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Avec</span>
                  <span className="font-medium">{otherUser.displayName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Créé il y a {formatRelativeTime(exchange.createdAt)}
                  </span>
                </div>

                {exchange.completedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Terminé le{' '}
                      {new Date(exchange.completedAt).toLocaleDateString(
                        'fr-FR'
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages récents */}
            {messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Messages récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-48 space-y-3 overflow-y-auto">
                    {messages.slice(-3).map((message) => (
                      <div key={message.id} className="text-sm">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium">
                            {message.sender?.displayName || 'Utilisateur'}
                          </span>
                          <span className="text-muted-foreground">
                            {message.createdAt &&
                              formatRelativeTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-muted-foreground">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ExchangeDetailPage() {
  return (
    <ProtectedRoute>
      <ExchangeDetailPageContent />
    </ProtectedRoute>
  );
}

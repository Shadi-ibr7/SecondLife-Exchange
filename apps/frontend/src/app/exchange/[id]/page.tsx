'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Exchange, ChatMessage, Item } from '@/types';
import { exchangesApi } from '@/lib/exchanges.api';
import { itemsApi } from '@/lib/items.api';
import { StatusBadge } from '@/components/exchanges/StatusBadge';
import { StatusActions } from '@/components/exchanges/StatusActions';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { socketService } from '@/lib/socket';
import {
  ArrowLeft,
  Send,
  Check,
  X,
  Package,
  Image as ImageIcon,
  X as XIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '../../(auth)/protected';
import { toast } from 'react-hot-toast';
import { uploadApi } from '@/lib/upload.api';
import { PhotoMeta } from '@/types';

function ExchangeDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const exchangeId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    []
  );
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: exchange,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['exchange', exchangeId],
    queryFn: () => exchangesApi.getExchange(exchangeId),
    enabled: !!exchangeId,
  });

  const isRequester = exchange?.requesterId === user?.id;
  const otherUser = exchange
    ? isRequester
      ? exchange.responder
      : exchange.requester
    : null;

  // Récupérer l'item offert (celui du requester)
  const { data: offeredItem } = useQuery({
    queryKey: [
      'item',
      'offered',
      exchange?.requesterId,
      exchange?.offeredItemTitle,
    ],
    queryFn: async () => {
      if (!exchange?.offeredItemTitle || !exchange?.requesterId) return null;
      try {
        // Rechercher par titre uniquement (le backend n'accepte pas les CUIDs comme UUIDs)
        const result = await itemsApi.listItems({
          q: exchange.offeredItemTitle,
          limit: 20,
          page: 1,
        });
        // Vérifier que result et result.items existent
        if (!result || !result.items || !Array.isArray(result.items)) {
          return null;
        }
        // Filtrer côté client pour trouver l'item avec le bon titre ET le bon propriétaire
        const item = result.items.find(
          (item) =>
            item.title.toLowerCase().trim() ===
              exchange.offeredItemTitle.toLowerCase().trim() &&
            item.ownerId === exchange.requesterId
        );
        return item || null;
      } catch (error: any) {
        console.error(
          "Erreur lors de la récupération de l'item offert:",
          error?.response?.data || error?.message || error
        );
        return null;
      }
    },
    enabled: !!exchange?.offeredItemTitle && !!exchange?.requesterId,
    retry: false, // Ne pas réessayer en cas d'erreur
  });

  // Récupérer l'item demandé (celui du responder)
  const { data: requestedItem } = useQuery({
    queryKey: [
      'item',
      'requested',
      exchange?.responderId,
      exchange?.requestedItemTitle,
    ],
    queryFn: async () => {
      if (!exchange?.requestedItemTitle || !exchange?.responderId) return null;
      try {
        // Rechercher par titre uniquement (le backend n'accepte pas les CUIDs comme UUIDs)
        const result = await itemsApi.listItems({
          q: exchange.requestedItemTitle,
          limit: 20,
          page: 1,
        });
        // Vérifier que result et result.items existent
        if (!result || !result.items || !Array.isArray(result.items)) {
          return null;
        }
        // Filtrer côté client pour trouver l'item avec le bon titre ET le bon propriétaire
        const item = result.items.find(
          (item) =>
            item.title.toLowerCase().trim() ===
              exchange.requestedItemTitle.toLowerCase().trim() &&
            item.ownerId === exchange.responderId
        );
        return item || null;
      } catch (error: any) {
        console.error(
          "Erreur lors de la récupération de l'item demandé:",
          error?.response?.data || error?.message || error
        );
        return null;
      }
    },
    enabled: !!exchange?.requestedItemTitle && !!exchange?.responderId,
    retry: false, // Ne pas réessayer en cas d'erreur
  });

  // Connexion au socket
  useEffect(() => {
    if (!exchangeId || !user) return;

    socketService.connect();
    socketService.connectToExchange(exchangeId);

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== message.id));
    };

    socketService.onMessage(handleNewMessage);

    return () => {
      socketService.offMessage(handleNewMessage);
      socketService.leaveExchange();
    };
  }, [exchangeId, user]);

  useEffect(() => {
    if (!exchange) {
      return;
    }

    const history: ChatMessage[] = [];

    if (exchange.message) {
      history.push({
        id: 'initial-message',
        exchangeId,
        senderId: exchange.requesterId,
        content: exchange.message,
        createdAt: exchange.createdAt,
        sender: exchange.requester,
      });
    }

    if (exchange.messages?.length) {
      history.push(...exchange.messages);
    }

    setMessages(history);
  }, [exchange, exchangeId]);

  const handleStatusUpdate = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!exchange) return;

    try {
      await exchangesApi.updateExchangeStatus(exchange.id, { status });
      toast.success(
        status === 'ACCEPTED' ? 'Échange accepté !' : 'Échange refusé'
      );
      router.refresh();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limiter à 5 images maximum
    const imagesToAdd = files.slice(0, 5 - selectedImages.length);
    setSelectedImages((prev) => [...prev, ...imagesToAdd]);

    // Créer des previews
    imagesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (
      (!newMessage.trim() && selectedImages.length === 0) ||
      !user ||
      !exchangeId
    )
      return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Upload des images si nécessaire
    let uploadedImages: PhotoMeta[] = [];
    if (selectedImages.length > 0) {
      setUploadingImages(true);
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
          throw new Error('Cloudinary non configuré');
        }

        // Upload toutes les images
        const uploadPromises = selectedImages.map(async (file) => {
          const signature = await uploadApi.getUploadSignature({
            folder: `exchanges/${exchangeId}/messages`,
          });
          return uploadApi.uploadToCloudinary(file, signature, cloudName);
        });

        uploadedImages = await Promise.all(uploadPromises);
        setSelectedImages([]);
        setImagePreviews([]);
      } catch (error: any) {
        toast.error("Erreur lors de l'upload des images");
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      exchangeId,
      senderId: user.id,
      content:
        messageContent || (uploadedImages.length > 0 ? '📷 Photo(s)' : ''),
      createdAt: new Date().toISOString(),
      sender: user,
      // Ajouter les images au message
      ...(uploadedImages.length > 0 && {
        images: uploadedImages.map((img) => img.url),
      }),
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Envoyer via socket avec les images
      const contentToSend =
        messageContent || (uploadedImages.length > 0 ? '📷 Photo(s)' : '');
      const imageUrls = uploadedImages.map((img) => img.url);
      socketService.sendMessage(exchangeId, contentToSend, imageUrls, user?.id);
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
    }
  };

  const getStatusColors = (status: Exchange['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'ACCEPTED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'DECLINED':
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return '';
    }
  };

  const getItemImageUrl = (itemTitle: string, isOffered: boolean): string => {
    const item = isOffered ? offeredItem : requestedItem;

    if (item?.photos && item.photos.length > 0) {
      // Utiliser la première photo de l'item
      return item.photos[0].url;
    }

    // Fallback: image placeholder basée sur le titre
    return `https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=200&h=200&fit=crop&q=80`;
  };

  const handleItemClick = (item: Item | null, title?: string) => {
    if (item) {
      setSelectedItem(item);
      setIsItemDialogOpen(true);
    } else if (title) {
      // Si l'item n'est pas encore chargé, on peut afficher au moins le titre
      // Pour l'instant, on ne fait rien, mais on pourrait créer un état pour afficher un message
      console.log('Item pas encore chargé:', title);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
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

  const allMessages = [...messages, ...optimisticMessages].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateA - dateB;
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="sticky top-16 z-40 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/exchanges')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatarUrl} />
              <AvatarFallback>
                {otherUser.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3>{otherUser.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                En ligne il y a 5 min
              </p>
            </div>

            <Badge
              variant="outline"
              className={getStatusColors(exchange.status)}
            >
              {exchange.status === 'PENDING' && 'Proposition'}
              {exchange.status === 'ACCEPTED' && 'En cours'}
              {exchange.status === 'COMPLETED' && 'Complété'}
              {exchange.status === 'DECLINED' && 'Refusé'}
              {exchange.status === 'CANCELLED' && 'Annulé'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Exchange Details */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Carte 1: Item offert (celui du requester) */}
            <Card
              className="cursor-pointer border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => handleItemClick(offeredItem || null)}
            >
              <p className="mb-2 text-sm text-muted-foreground">
                {isRequester
                  ? 'Vous proposez'
                  : `${otherUser?.displayName} propose`}
              </p>
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={getItemImageUrl(exchange.offeredItemTitle, true)}
                    alt={exchange.offeredItemTitle}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium">
                    {exchange.offeredItemTitle}
                  </h4>
                </div>
              </div>
            </Card>

            {/* Carte 2: Item demandé (celui du responder) */}
            <Card
              className="cursor-pointer border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => handleItemClick(requestedItem || null)}
            >
              <p className="mb-2 text-sm text-muted-foreground">
                {isRequester
                  ? `${otherUser?.displayName} propose`
                  : 'Vous proposez'}
              </p>
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={getItemImageUrl(exchange.requestedItemTitle, false)}
                    alt={exchange.requestedItemTitle}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium">
                    {exchange.requestedItemTitle}
                  </h4>
                </div>
              </div>
            </Card>
          </div>

          {exchange.status === 'PENDING' && !isRequester && (
            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => handleStatusUpdate('ACCEPTED')}
              >
                <Check className="mr-2 h-4 w-4" />
                Accepter l'échange
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleStatusUpdate('DECLINED')}
              >
                <X className="mr-2 h-4 w-4" />
                Refuser
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl space-y-4 px-4 py-6 lg:px-8">
          {allMessages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">
                Envoyez le premier message pour commencer la conversation
              </p>
            </div>
          ) : (
            allMessages.map((message) => (
              <MessageBubble
                key={message.id || `msg-${message.createdAt}`}
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
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-4 lg:px-8">
          {/* Previews des images */}
          {imagePreviews.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border"
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages || selectedImages.length >= 5}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-input"
              disabled={uploadingImages}
            />
            <Button
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary/90"
              disabled={
                (!newMessage.trim() && selectedImages.length === 0) ||
                uploadingImages
              }
            >
              {uploadingImages ? (
                <span className="text-sm">Envoi...</span>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de détails de l'item */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  {selectedItem.description || 'Aucune description'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Photos */}
                {selectedItem.photos && selectedItem.photos.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Photos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square overflow-hidden rounded-lg"
                        >
                          <Image
                            src={photo.url}
                            alt={selectedItem.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informations */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Catégorie
                    </p>
                    <p className="text-sm">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      État
                    </p>
                    <p className="text-sm">{selectedItem.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Statut
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {selectedItem.status}
                    </Badge>
                  </div>
                </div>

                {/* Tags */}
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Propriétaire */}
                {selectedItem.owner && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Propriétaire
                    </p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedItem.owner.avatarUrl} />
                        <AvatarFallback>
                          {selectedItem.owner.displayName
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {selectedItem.owner.displayName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

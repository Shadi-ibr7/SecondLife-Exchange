'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ItemPhotos } from '@/components/items/ItemPhotos';
import { ItemOwnerActions } from '@/components/items/ItemOwnerActions';
import { ProposeExchangeModal } from '@/components/exchanges/ProposeExchangeModal';
import { itemsApi } from '@/lib/items.api';
import { useAuthStore } from '@/store/auth';
import {
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
  ITEM_STATUS_LABELS,
} from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Sparkles,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const itemId = params.id as string;

  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.getItem(itemId),
    enabled: !!itemId,
  });

  const isOwner = Boolean(user && item && user.id === item.ownerId);

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="space-y-6">
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-2xl font-semibold">Objet non trouvé</h2>
          <p className="mb-4 text-muted-foreground">
            L'objet que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button asChild>
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'exploration
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        {/* Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'exploration
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Contenu principal */}
          <div className="space-y-6 lg:col-span-2">
            {/* Photos */}
            <ItemPhotos
              photos={item.photos}
              itemId={item.id}
              isOwner={isOwner}
            />

            {/* Informations de base */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {ITEM_CATEGORY_LABELS[item.category] || item.category}
                      </Badge>
                      <Badge variant="outline">
                        {ITEM_CONDITION_LABELS[item.condition] ||
                          item.condition}
                      </Badge>
                      <Badge
                        variant={
                          item.status === 'AVAILABLE' ? 'default' : 'secondary'
                        }
                      >
                        {ITEM_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{item.description}</p>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informations IA */}
                {(item.aiSummary || item.aiRepairTip) && (
                  <div className="rounded-lg bg-primary/10 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      Analyse IA
                    </h4>
                    {item.aiSummary && (
                      <div className="mb-3">
                        <h5 className="mb-1 text-sm font-medium">Résumé</h5>
                        <p className="text-sm text-muted-foreground">
                          {item.aiSummary}
                        </p>
                      </div>
                    )}
                    {item.aiRepairTip && (
                      <div>
                        <h5 className="mb-1 flex items-center gap-1 text-sm font-medium">
                          <Wrench className="h-3 w-3" />
                          Conseil de réparation
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {item.aiRepairTip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations du propriétaire */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {item.owner.avatarUrl ? (
                      <img
                        src={item.owner.avatarUrl}
                        alt={item.owner.displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.owner.displayName}</p>
                    {item.owner.location && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {item.owner.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Publié {formatRelativeTime(item.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions du propriétaire */}
            {isOwner && (
              <ItemOwnerActions itemId={item.id} currentStatus={item.status} />
            )}

            {/* Actions pour les non-propriétaires */}
            {!isOwner && item.status === 'AVAILABLE' && (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="mb-2 font-semibold">
                    Intéressé par cet objet ?
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Proposez un de vos objets en échange
                  </p>
                  <ProposeExchangeModal
                    requestedItem={item}
                    responderId={item.ownerId}
                  >
                    <Button className="w-full">Proposer un échange</Button>
                  </ProposeExchangeModal>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

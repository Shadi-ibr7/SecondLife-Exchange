'use client';

/**
 * FICHIER: app/item/[id]/edit/page.tsx
 *
 * DESCRIPTION:
 * Page d'édition d'un objet. Réservée au propriétaire de l'item, elle
 * réutilise ItemForm pour permettre la mise à jour du titre, description,
 * tags, catégorie, etc.
 *
 * FONCTIONNALITÉS:
 * - Vérifie l'authentification et la propriété (sinon redirection + toast)
 * - Charge l'item existant via itemsApi.getItem
 * - Soumission via ItemForm qui appelle itemsApi.updateItem
 * - Affiche un bouton pour revenir à la fiche publique
 *
 * UX:
 * - Pré-remplit le formulaire avec les données actuelles
 * - Feedback via toast (succès / erreurs)
 */

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ItemForm } from '@/components/items/ItemForm';
import { itemsApi } from '@/lib/items.api';
import { useAuthStore } from '@/store/auth';
import { UpdateItemDto } from '@/types';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditItemPage() {
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

  // Vérifier l'authentification et la propriété
  useEffect(() => {
    if (!user) {
      router.push('/login?next=/item/' + itemId + '/edit');
      return;
    }

    if (item && user.id !== item.ownerId) {
      toast.error("Vous n'êtes pas autorisé à modifier cet objet");
      router.push('/item/' + itemId);
      return;
    }
  }, [user, item, itemId, router]);

  const handleSubmit = async (data: UpdateItemDto) => {
    try {
      await itemsApi.updateItem(itemId, data);
      toast.success('Objet mis à jour avec succès !');
      router.push(`/item/${itemId}`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'objet");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
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
            L'objet que vous souhaitez modifier n'existe pas.
          </p>
          <Button asChild>
            <Link href="/explore">Retour à l'exploration</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user || user.id !== item.ownerId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h2 className="mb-2 text-2xl font-semibold">Accès refusé</h2>
          <p className="mb-4 text-muted-foreground">
            Vous n'êtes pas autorisé à modifier cet objet.
          </p>
          <Button asChild>
            <Link href={`/item/${itemId}`}>Voir l'objet</Link>
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
        className="mx-auto max-w-2xl"
      >
        {/* Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href={`/item/${itemId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'objet
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Modifier l'objet</h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations de votre objet
          </p>
        </div>

        <ItemForm mode="edit" initialData={item} onSubmit={handleSubmit} />
      </motion.div>
    </div>
  );
}

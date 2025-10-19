'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ItemForm } from '@/components/items/ItemForm';
import { itemsApi } from '@/lib/items.api';
import { CreateItemDto, UpdateItemDto } from '@/types';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

export default function NewItemPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?next=/item/new');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (data: CreateItemDto | UpdateItemDto) => {
    try {
      const item = await itemsApi.createItem(data as CreateItemDto);
      toast.success('Objet créé avec succès !');
      router.push(`/item/${item.id}`);
    } catch (error) {
      toast.error("Erreur lors de la création de l'objet");
      throw error;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
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
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Créer un nouvel objet</h1>
          <p className="text-muted-foreground">
            Partagez un objet que vous souhaitez échanger avec la communauté
          </p>
        </div>

        <ItemForm mode="create" onSubmit={handleSubmit} />
      </motion.div>
    </div>
  );
}

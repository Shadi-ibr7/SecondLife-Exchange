'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { itemsApi } from '@/lib/items.api';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Archive, RotateCcw } from 'lucide-react';

interface ItemOwnerActionsProps {
  itemId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function ItemOwnerActions({
  itemId,
  currentStatus,
  onStatusChange,
}: ItemOwnerActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = () => {
    router.push(`/item/${itemId}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await itemsApi.deleteItem(itemId);
      toast.success('Objet supprimé avec succès');
      router.push('/explore');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await itemsApi.updateItem(itemId, { status: newStatus as any });
      toast.success('Statut mis à jour avec succès');
      onStatusChange?.(newStatus);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusActions = () => {
    switch (currentStatus) {
      case 'AVAILABLE':
        return [
          {
            status: 'PENDING',
            label: 'Marquer comme en cours',
            icon: RotateCcw,
          },
          { status: 'ARCHIVED', label: 'Archiver', icon: Archive },
        ];
      case 'PENDING':
        return [
          {
            status: 'AVAILABLE',
            label: 'Remettre disponible',
            icon: RotateCcw,
          },
          { status: 'TRADED', label: 'Marquer comme échangé', icon: RotateCcw },
        ];
      case 'TRADED':
        return [
          {
            status: 'AVAILABLE',
            label: 'Remettre disponible',
            icon: RotateCcw,
          },
        ];
      case 'ARCHIVED':
        return [
          {
            status: 'AVAILABLE',
            label: 'Remettre disponible',
            icon: RotateCcw,
          },
        ];
      default:
        return [];
    }
  };

  const statusActions = getStatusActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions du propriétaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Édition */}
        <Button onClick={handleEdit} className="w-full" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Modifier l'objet
        </Button>

        {/* Changement de statut */}
        {statusActions.length > 0 && (
          <div className="space-y-2">
            {statusActions.map((action) => (
              <Button
                key={action.status}
                onClick={() => handleStatusChange(action.status)}
                disabled={isUpdating}
                variant="outline"
                className="w-full"
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Suppression */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer l'objet
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera
                définitivement votre objet et toutes les données associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

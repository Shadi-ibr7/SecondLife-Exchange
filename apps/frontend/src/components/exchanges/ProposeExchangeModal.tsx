import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Item, CreateExchangeDto } from '@/types';
import { exchangesApi } from '@/lib/exchanges.api';
import { itemsApi } from '@/lib/items.api';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { ArrowRight, Package } from 'lucide-react';

interface ProposeExchangeModalProps {
  requestedItem: Item;
  responderId: string;
  children: React.ReactNode;
}

const exchangeSchema = z.object({
  offeredItemTitle: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères'),
  message: z.string().optional(),
});

type ExchangeForm = z.infer<typeof exchangeSchema>;

export function ProposeExchangeModal({
  requestedItem,
  responderId,
  children,
}: ProposeExchangeModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExchangeForm>({
    resolver: zodResolver(exchangeSchema),
  });

  // Récupérer les items de l'utilisateur pour les suggestions
  const { data: myItems } = useQuery({
    queryKey: ['my-items'],
    queryFn: () => itemsApi.listItems({ ownerId: user?.id, limit: 50 }),
    enabled: !!user?.id && open,
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: ExchangeForm) => {
    try {
      const exchangeData: CreateExchangeDto = {
        responderId,
        requestedItemTitle: requestedItem.title,
        offeredItemTitle: data.offeredItemTitle,
        message: data.message,
      };

      await exchangesApi.createExchange(exchangeData);
      toast.success("Proposition d'échange envoyée !");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la proposition");
    }
  };

  const handleItemSelect = (itemTitle: string) => {
    // Pré-remplir le champ avec le titre de l'item sélectionné
    reset({ offeredItemTitle: itemTitle });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Proposer un échange</DialogTitle>
          <DialogDescription>
            Proposez un de vos objets en échange de "{requestedItem.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Objet demandé */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Objet demandé</h4>
            <div className="flex items-center gap-3">
              {requestedItem.photos.length > 0 ? (
                <img
                  src={requestedItem.photos[0].url}
                  alt={requestedItem.title}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{requestedItem.title}</p>
                <p className="text-sm text-muted-foreground">
                  Par {requestedItem.owner.displayName}
                </p>
              </div>
            </div>
          </div>

          {/* Mes objets disponibles */}
          {myItems && myItems.items.length > 0 && (
            <div>
              <h4 className="mb-3 font-medium">Mes objets disponibles</h4>
              <div className="grid max-h-32 grid-cols-1 gap-2 overflow-y-auto">
                {myItems.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.title)}
                    className="flex items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted"
                  >
                    {item.photos.length > 0 ? (
                      <img
                        src={item.photos[0].url}
                        alt={item.title}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{item.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.condition}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="offeredItemTitle">
                Objet que vous proposez *
              </Label>
              <Input
                id="offeredItemTitle"
                placeholder="Titre de votre objet"
                {...register('offeredItemTitle')}
              />
              {errors.offeredItemTitle && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.offeredItemTitle.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Ajoutez un message pour expliquer votre proposition..."
                rows={3}
                {...register('message')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Envoyer la proposition
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

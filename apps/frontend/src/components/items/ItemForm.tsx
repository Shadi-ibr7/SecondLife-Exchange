/**
 * FICHIER: ItemForm.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche un formulaire pour créer ou modifier un item (objet).
 * Il gère tous les champs nécessaires : titre, description, catégorie, condition, tags.
 *
 * FONCTIONNALITÉS:
 * - Formulaire avec validation Zod
 * - Gestion des tags (ajout/suppression, maximum 10)
 * - Option d'aide IA (Gemini) pour catégorie et tags automatiques
 * - Mode création ou édition
 * - Validation en temps réel
 * - Gestion des erreurs avec affichage
 *
 * CHAMPS:
 * - title: Titre de l'item (3-120 caractères)
 * - description: Description détaillée (10-2000 caractères)
 * - category: Catégorie (optionnel si IA activée)
 * - condition: État de l'item (requis)
 * - tags: Tags personnalisés (max 10, 2-24 caractères chacun)
 * - aiAuto: Activer l'aide IA (optionnel)
 */

'use client';

// Import de React
import { useState } from 'react';

// Import de React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import de Zod pour la validation
import { z } from 'zod';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import des constantes
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
} from '@/lib/constants';

// Import des types
import {
  CreateItemDto,
  UpdateItemDto,
  Item,
  ItemCategory,
  ItemCondition,
} from '@/types';

// Import de react-hot-toast
import { toast } from 'react-hot-toast';

// Import des icônes
import { Sparkles, Tag, X } from 'lucide-react';

/**
 * SCHÉMA DE VALIDATION: itemSchema
 *
 * Définit les règles de validation pour le formulaire d'item.
 */
const itemSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(120, 'Le titre ne peut pas dépasser 120 caractères'),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  category: z.string().optional(), // Optionnel si IA activée
  condition: z.string().min(1, "L'état est requis"),
  tags: z
    .array(
      z
        .string()
        .min(2, 'Un tag doit contenir au moins 2 caractères')
        .max(24, 'Un tag ne peut pas dépasser 24 caractères')
    )
    .max(10, 'Maximum 10 tags'),
  aiAuto: z.boolean().default(false), // Aide IA activée ou non
});

/**
 * TYPE: ItemFormData
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type ItemFormData = z.infer<typeof itemSchema>;

/**
 * INTERFACE: ItemFormProps
 *
 * Définit les propriétés acceptées par le composant.
 */
interface ItemFormProps {
  mode: 'create' | 'edit'; // Mode création ou édition
  initialData?: Item; // Données initiales (pour édition)
  onSubmit: (data: CreateItemDto | UpdateItemDto) => Promise<void>; // Fonction de soumission
  isLoading?: boolean; // État de chargement
}

/**
 * COMPOSANT: ItemForm
 *
 * Formulaire pour créer ou modifier un item.
 *
 * @param mode - Mode création ou édition
 * @param initialData - Données initiales (pour édition)
 * @param onSubmit - Fonction appelée lors de la soumission
 * @param isLoading - État de chargement
 */
export function ItemForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
}: ItemFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      condition: initialData?.condition || '',
      tags: initialData?.tags || [],
      aiAuto: false,
    },
  });

  const aiAuto = watch('aiAuto');
  const category = watch('category');

  const addTag = () => {
    if (newTag.trim() && tags.length < 10 && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    setValue('tags', updatedTags);
  };

  const handleFormSubmit = async (data: ItemFormData) => {
    try {
      const submitData = {
        ...data,
        tags: tags.length > 0 ? tags : undefined,
        category: data.category as ItemCategory | undefined,
        condition: data.condition as ItemCondition,
      };
      await onSubmit(submitData);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Créer un nouvel objet' : "Modifier l'objet"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Titre de votre objet"
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Décrivez votre objet en détail..."
              className="mt-1 min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* État */}
          <div>
            <Label htmlFor="condition">État *</Label>
            <select
              id="condition"
              {...register('condition')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un état</option>
              {ITEM_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {ITEM_CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>
            {errors.condition && (
              <p className="mt-1 text-sm text-destructive">
                {errors.condition.message}
              </p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="category">
              Catégorie{' '}
              {aiAuto ? "(optionnel - peut être fournie par l'IA)" : '*'}
            </Label>
            <select
              id="category"
              {...register('category')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une catégorie</option>
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {ITEM_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (optionnel)</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim() || tags.length >= 10}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {tags.length >= 10 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Maximum 10 tags atteint
              </p>
            )}
          </div>

          {/* IA Auto */}
          <div className="flex items-center space-x-2">
            <Switch
              id="aiAuto"
              checked={aiAuto}
              onCheckedChange={(checked) => setValue('aiAuto', checked)}
            />
            <Label htmlFor="aiAuto" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Aider avec Gemini (IA)
            </Label>
          </div>
          {aiAuto && (
            <div className="rounded-md bg-primary/10 p-3 text-sm">
              <p className="text-primary">
                💡 L'IA peut automatiquement suggérer la catégorie, générer des
                tags et créer un résumé de votre objet.
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? 'Sauvegarde...'
                : mode === 'create'
                  ? "Créer l'objet"
                  : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

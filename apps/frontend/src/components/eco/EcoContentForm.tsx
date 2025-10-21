'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateEcoContentDto, UpdateEcoContentDto, EcoContent } from '@/types';
import { toast } from 'react-hot-toast';
import { X, Plus, Save } from 'lucide-react';

const ecoContentSchema = z.object({
  kind: z.enum(['ARTICLE', 'VIDEO', 'STAT']),
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  url: z.string().url('URL invalide'),
  locale: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  publishedAt: z.string().optional(),
});

type EcoContentForm = z.infer<typeof ecoContentSchema>;

interface EcoContentFormProps {
  initialData?: EcoContent;
  onSubmit: (data: CreateEcoContentDto | UpdateEcoContentDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function EcoContentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: EcoContentFormProps) {
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EcoContentForm>({
    resolver: zodResolver(ecoContentSchema),
    defaultValues: {
      kind: initialData?.kind || 'ARTICLE',
      title: initialData?.title || '',
      url: initialData?.url || '',
      locale: initialData?.locale || '',
      tags: initialData?.tags || [],
      source: initialData?.source || '',
      publishedAt: initialData?.publishedAt || '',
    },
  });

  const watchedTags = watch('tags');

  const addTag = (tag: string) => {
    if (!tag.trim()) return;

    if (watchedTags.includes(tag)) return;

    const newTags = [...watchedTags, tag];
    setValue('tags', newTags);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    const newTags = watchedTags.filter((t) => t !== tag);
    setValue('tags', newTags);
  };

  const handleFormSubmit = async (data: EcoContentForm) => {
    try {
      await onSubmit(data);
      toast.success(initialData ? 'Contenu mis à jour !' : 'Contenu créé !');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          {initialData ? 'Modifier le contenu' : 'Nouveau contenu éco'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Type de contenu */}
          <div className="space-y-2">
            <Label htmlFor="kind">Type de contenu</Label>
            <Select
              value={watch('kind')}
              onValueChange={(value) => setValue('kind', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARTICLE">Article</SelectItem>
                <SelectItem value="VIDEO">Vidéo</SelectItem>
                <SelectItem value="STAT">Statistique</SelectItem>
              </SelectContent>
            </Select>
            {errors.kind && (
              <p className="text-sm text-destructive">{errors.kind.message}</p>
            )}
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Titre du contenu"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              {...register('url')}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              placeholder="Nom de la source (ex: Le Monde, YouTube, etc.)"
              {...register('source')}
            />
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {watchedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newTag)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Métadonnées */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="locale">Langue</Label>
              <Input
                id="locale"
                placeholder="fr, en, es, etc."
                {...register('locale')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Date de publication</Label>
              <Input
                id="publishedAt"
                type="datetime-local"
                {...register('publishedAt')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? 'Sauvegarde...'
                : initialData
                  ? 'Mettre à jour'
                  : 'Créer'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

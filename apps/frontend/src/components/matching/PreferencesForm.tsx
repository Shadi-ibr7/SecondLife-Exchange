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
import { SavePreferencesDto } from '@/types';
import { matchingApi } from '@/lib/matching.api';
import { toast } from 'react-hot-toast';
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '@/lib/constants';
import { X, Plus, Save } from 'lucide-react';

const preferencesSchema = z.object({
  preferredCategories: z.array(z.string()).default([]),
  dislikedCategories: z.array(z.string()).default([]),
  preferredConditions: z.array(z.string()).default([]),
  locale: z.string().optional(),
  country: z.string().optional(),
  radiusKm: z.number().min(1).max(1000).optional(),
});

type PreferencesForm = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  initialData?: SavePreferencesDto;
  onSave?: () => void;
}

export function PreferencesForm({ initialData, onSave }: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newDislikedCategory, setNewDislikedCategory] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferredCategories: initialData?.preferredCategories || [],
      dislikedCategories: initialData?.dislikedCategories || [],
      preferredConditions: initialData?.preferredConditions || [],
      locale: initialData?.locale || '',
      country: initialData?.country || '',
      radiusKm: initialData?.radiusKm || 50,
    },
  });

  const watchedCategories = watch('preferredCategories');
  const watchedDislikedCategories = watch('dislikedCategories');
  const watchedConditions = watch('preferredConditions');

  const addCategory = (category: string, type: 'preferred' | 'disliked') => {
    if (!category.trim()) return;

    const currentCategories =
      type === 'preferred' ? watchedCategories : watchedDislikedCategories;
    if (currentCategories.includes(category)) return;

    const newCategories = [...currentCategories, category];
    setValue(
      type === 'preferred' ? 'preferredCategories' : 'dislikedCategories',
      newCategories
    );

    if (type === 'preferred') {
      setNewCategory('');
    } else {
      setNewDislikedCategory('');
    }
  };

  const removeCategory = (category: string, type: 'preferred' | 'disliked') => {
    const currentCategories =
      type === 'preferred' ? watchedCategories : watchedDislikedCategories;
    const newCategories = currentCategories.filter((c) => c !== category);
    setValue(
      type === 'preferred' ? 'preferredCategories' : 'dislikedCategories',
      newCategories
    );
  };

  const toggleCondition = (condition: string) => {
    const currentConditions = watchedConditions;
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter((c) => c !== condition)
      : [...currentConditions, condition];
    setValue('preferredConditions', newConditions);
  };

  const onSubmit = async (data: PreferencesForm) => {
    setIsLoading(true);
    try {
      await matchingApi.savePreferences(data);
      toast.success('Préférences sauvegardées !');
      onSave?.();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des préférences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Mes préférences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Catégories préférées */}
          <div className="space-y-3">
            <Label>Catégories préférées</Label>
            <div className="flex flex-wrap gap-2">
              {watchedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => removeCategory(category, 'preferred')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une catégorie..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCategory(newCategory, 'preferred');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCategory(newCategory, 'preferred')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Catégories non désirées */}
          <div className="space-y-3">
            <Label>Catégories à éviter</Label>
            <div className="flex flex-wrap gap-2">
              {watchedDislikedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => removeCategory(category, 'disliked')}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une catégorie à éviter..."
                value={newDislikedCategory}
                onChange={(e) => setNewDislikedCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCategory(newDislikedCategory, 'disliked');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCategory(newDislikedCategory, 'disliked')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Conditions préférées */}
          <div className="space-y-3">
            <Label>Conditions préférées</Label>
            <div className="flex flex-wrap gap-2">
              {ITEM_CONDITIONS.map((condition) => (
                <Badge
                  key={condition}
                  variant={
                    watchedConditions.includes(condition)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleCondition(condition)}
                >
                  {condition}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Localisation */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                placeholder="France"
                {...register('country')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radiusKm">Rayon (km)</Label>
              <Input
                id="radiusKm"
                type="number"
                min="1"
                max="1000"
                placeholder="50"
                {...register('radiusKm', { valueAsNumber: true })}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * FICHIER: app/community/new/page.tsx
 *
 * DESCRIPTION:
 * Page pour créer une nouvelle discussion dans le forum.
 * Formulaire avec titre, catégorie, et premier message.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Container } from '@/components/common/Container';
import { communityApi } from '@/lib/community.api';
import { useAuthStore } from '@/store/auth';
import { CreateThreadDto, ThreadCategory } from '@/types';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  THREAD_CATEGORIES,
  THREAD_CATEGORY_LABELS,
} from '@/lib/constants';
import { useEffect } from 'react';

export default function NewThreadPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ThreadCategory | ''>('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?next=/community/new');
    }
  }, [isAuthenticated, router]);

  // Mutation pour créer le thread
  const createThreadMutation = useMutation({
    mutationFn: (data: CreateThreadDto) => communityApi.createThread(data),
    onSuccess: (thread) => {
      toast.success('Discussion créée avec succès !');
      router.push(`/thread/${thread.id}`);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de la création'
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    if (!content.trim()) {
      toast.error('Le message est requis');
      return;
    }

    if (!category) {
      toast.error('La catégorie est requise');
      return;
    }

    setIsSubmitting(true);
    try {
      await createThreadMutation.mutateAsync({
        scope: 'GENERAL',
        category: category as ThreadCategory,
        title: title.trim(),
        contentFirst: content.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Nouvelle discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de votre discussion"
                  className="mt-1"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/200 caractères
                </p>
              </div>

              {/* Catégorie */}
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as ThreadCategory)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {THREAD_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {THREAD_CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="content">Premier message *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="mt-1 min-h-[200px] resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.length}/5000 caractères
                </p>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    'Créer la discussion'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

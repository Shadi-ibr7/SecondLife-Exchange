'use client';

/**
 * FICHIER: app/discover/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détail d'un contenu éco-éducatif. Accessible publiquement,
 * elle affiche toutes les métadonnées d'un contenu (summary, KPIs, tags, source).
 *
 * FONCTIONNALITÉS:
 * - Récupération du contenu via l'ID dans l'URL (ecoApi.getEcoContent)
 * - Gestion des états de chargement / erreur avec messages dédiés
 * - Bouton retour (router.back) pour revenir à la page précédente
 * - Lien vers la source externe du contenu
 * - Affichage des KPI sous forme de liste clé/valeur
 *
 * UX:
 * - Mise en page simple avec Card + badges (type, langue, date de publication)
 * - Utilisation de date-fns pour formater la date en français
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ecoApi } from '@/lib/eco.api';
import { Container } from '@/components/common/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ExternalLink,
  Tag,
  FileText,
  Play,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EcoContentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['eco-content', id],
    queryFn: () => ecoApi.getEcoContent(id),
    enabled: !!id,
  });

  const kindMeta = (kind?: string) => {
    switch (kind) {
      case 'ARTICLE':
        return { label: 'Article', icon: <FileText className="h-4 w-4" /> };
      case 'VIDEO':
        return { label: 'Vidéo', icon: <Play className="h-4 w-4" /> };
      case 'STAT':
        return {
          label: 'Statistique',
          icon: <BarChart3 className="h-4 w-4" />,
        };
      default:
        return {
          label: kind || 'Contenu',
          icon: <FileText className="h-4 w-4" />,
        };
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="py-10 text-center text-muted-foreground">
          Chargement…
        </div>
      </Container>
    );
  }

  if (error || !content) {
    return (
      <Container>
        <div className="py-10 text-center">
          <p className="mb-4 text-muted-foreground">Contenu introuvable.</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </Container>
    );
  }

  const meta = kindMeta(content.kind);

  return (
    <Container>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              {meta.icon}
              {meta.label}
            </Badge>
            {content.locale && (
              <Badge variant="outline">{content.locale.toUpperCase()}</Badge>
            )}
            {content.publishedAt && (
              <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(content.publishedAt), 'dd MMM yyyy', {
                  locale: fr,
                })}
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">{content.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {content.source && (
            <div className="text-sm text-muted-foreground">
              Source: <span className="font-medium">{content.source}</span>
            </div>
          )}

          {content.summary && (
            <p className="whitespace-pre-line leading-relaxed">
              {content.summary}
            </p>
          )}

          {content.kpis && (
            <div className="space-y-1">
              {Object.entries(content.kpis).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          )}

          {content.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {content.url && (
            <div>
              <Button asChild>
                <Link
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir la source
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

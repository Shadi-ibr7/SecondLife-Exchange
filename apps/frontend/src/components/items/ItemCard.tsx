/**
 * FICHIER: ItemCard.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche une carte d'item (objet) dans une grille ou une liste.
 * Il présente les informations essentielles de l'item : photo, titre, description,
 * catégorie, condition, localisation, et tags.
 *
 * FONCTIONNALITÉS:
 * - Affichage de la première photo de l'item
 * - Lien vers la page de détail de l'item
 * - Animation d'apparition avec délai progressif
 * - Gestion des items mock (aperçu) avec toast informatif
 * - Formatage du temps relatif (ex: "il y a 2 jours")
 * - Affichage des badges de catégorie, condition et tags
 */

'use client';

// Import de Next.js pour la navigation
import Link from 'next/link';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import des types
import { Item } from '@/types';

// Import des constantes pour les labels
import { ITEM_CATEGORY_LABELS, ITEM_CONDITION_LABELS } from '@/lib/constants';

// Import des icônes
import { MapPin, Calendar } from 'lucide-react';

// Import de date-fns pour le formatage des dates
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import de react-hot-toast pour les notifications
import { toast } from 'react-hot-toast';

/**
 * INTERFACE: ItemCardProps
 *
 * Définit les propriétés acceptées par le composant.
 */
interface ItemCardProps {
  item: Item; // L'item à afficher
  index?: number; // Index pour l'animation progressive (défaut: 0)
}

/**
 * COMPOSANT: ItemCard
 *
 * Affiche une carte d'item avec toutes ses informations essentielles.
 *
 * @param item - L'item à afficher
 * @param index - Index pour l'animation progressive
 */
export function ItemCard({ item, index = 0 }: ItemCardProps) {
  // ============================================
  // FONCTION: formatRelativeTime
  // ============================================

  /**
   * Formate une date en temps relatif en français (ex: "il y a 2 jours").
   *
   * @param date - Date à formater (string ISO)
   * @returns Temps relatif formaté en français
   */
  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true, // Ajouter "il y a" ou "dans"
      locale: fr, // Utiliser la locale française
    });
  };

  // ============================================
  // GESTION DES ITEMS MOCK (APERÇU)
  // ============================================

  /**
   * Vérifie si l'item est un item mock (aperçu).
   * Les items mock ont un ID qui commence par "mock-".
   */
  const isMock = item.id.startsWith('mock-');

  /**
   * Gestionnaire de clic pour les items mock.
   * Empêche la navigation et affiche un toast informatif.
   *
   * @param e - Événement de clic
   */
  const handleMockClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (isMock) {
      e.preventDefault(); // Empêcher la navigation
      toast("Aperçu d'annonce. Publiez un objet pour voir la fiche détaillée.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
        <Link
          href={isMock ? '/explore' : `/item/${item.id}`}
          onClick={handleMockClick}
        >
          <div className="flex aspect-square items-center justify-center rounded-t-lg bg-muted">
            {item.photos.length > 0 ? (
              <img
                src={item.photos[0].url}
                alt={item.title}
                className="h-full w-full rounded-t-lg object-cover"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="mb-2 text-4xl">📦</div>
                <p>Aucune image</p>
              </div>
            )}
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{item.owner.location || 'Localisation non précisée'}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {ITEM_CATEGORY_LABELS[item.category] || item.category}
              </Badge>
              <Badge variant="outline">
                {ITEM_CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Par {item.owner.displayName}</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </div>
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}

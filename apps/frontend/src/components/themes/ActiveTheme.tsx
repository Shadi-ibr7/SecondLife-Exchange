/**
 * FICHIER: ActiveTheme.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche le thème hebdomadaire actif de manière mise en avant.
 * Il présente le titre, la période, et l'impact écologique du thème.
 *
 * FONCTIONNALITÉS:
 * - Affichage du thème actif avec style spécial (bordure primaire)
 * - Formatage de la période (semaine)
 * - Animation d'apparition
 * - Badge avec icône calendrier
 *
 * UTILISATION:
 * Utilisé dans la page d'accueil et la page des thèmes pour mettre en avant
 * le thème de la semaine actuelle.
 */

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import des types
import { WeeklyTheme } from '@/types';

// Import des utilitaires
import { formatWeekRange } from '@/lib/date';

// Import des icônes
import { Sparkles, Calendar } from 'lucide-react';

/**
 * INTERFACE: ActiveThemeProps
 *
 * Définit les propriétés acceptées par le composant.
 */
interface ActiveThemeProps {
  theme: WeeklyTheme; // Le thème hebdomadaire à afficher
}

/**
 * COMPOSANT: ActiveTheme
 *
 * Affiche le thème hebdomadaire actif de manière mise en avant.
 *
 * @param theme - Le thème hebdomadaire à afficher
 */
export function ActiveTheme({ theme }: ActiveThemeProps) {
  const weekRange = formatWeekRange(new Date(theme.startOfWeek));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <Badge variant="secondary" className="text-sm">
              <Calendar className="mr-1 h-4 w-4" />
              {weekRange}
            </Badge>
          </div>
          <CardTitle className="mb-2 text-3xl">{theme.title}</CardTitle>
          {theme.impactText && (
            <p className="text-lg text-muted-foreground">{theme.impactText}</p>
          )}
        </CardHeader>
      </Card>
    </motion.div>
  );
}

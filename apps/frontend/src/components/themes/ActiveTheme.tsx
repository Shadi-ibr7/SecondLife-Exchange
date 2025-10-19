import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeeklyTheme } from '@/types';
import { formatWeekRange } from '@/lib/date';
import { Sparkles, Calendar } from 'lucide-react';

interface ActiveThemeProps {
  theme: WeeklyTheme;
}

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

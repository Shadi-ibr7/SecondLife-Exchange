/**
 * FICHIER: ReportModal.tsx
 *
 * DESCRIPTION:
 * Modal pour signaler un item ou un utilisateur.
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';
import { toast } from 'react-hot-toast';

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SPAM_ADVERTISEMENT = 'SPAM_ADVERTISEMENT',
  ILLEGAL_CONTENT = 'ILLEGAL_CONTENT',
  HARASSMENT = 'HARASSMENT',
  FALSE_INFORMATION = 'FALSE_INFORMATION',
  OTHER = 'OTHER',
}

const REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.INAPPROPRIATE_CONTENT]: 'Contenu inapproprié',
  [ReportReason.SPAM_ADVERTISEMENT]: 'Spam / publicité',
  [ReportReason.ILLEGAL_CONTENT]: 'Contenu illégal',
  [ReportReason.HARASSMENT]: 'Harcèlement',
  [ReportReason.FALSE_INFORMATION]: 'Fausses informations',
  [ReportReason.OTHER]: 'Autre',
};

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'ITEM' | 'USER';
  targetItemId?: string;
  targetUserId?: string;
  targetName?: string; // Nom de l'item ou de l'utilisateur pour affichage
}

export function ReportModal({
  open,
  onOpenChange,
  type,
  targetItemId,
  targetUserId,
  targetName,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Veuillez sélectionner une raison');
      return;
    }

    if (reason === ReportReason.OTHER && (!message || message.trim().length === 0)) {
      toast.error('Veuillez fournir une description lorsque vous sélectionnez "Autre"');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.createReport({
        type,
        reason: reason as ReportReason,
        message: message.trim() || undefined,
        targetItemId,
        targetUserId,
      });

      toast.success('Signalement envoyé avec succès. Merci pour votre contribution.');
      onOpenChange(false);
      setReason('');
      setMessage('');
    } catch (error: any) {
      console.error('Erreur lors du signalement:', error);
      if (error.response?.status === 409) {
        toast.error('Vous avez déjà signalé cet élément');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Données invalides');
      } else {
        toast.error('Erreur lors de l\'envoi du signalement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Signaler {type === 'ITEM' ? 'cette annonce' : 'cet utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {targetName && (
              <span className="font-medium">{targetName}</span>
            )}
            <br />
            Veuillez sélectionner la raison du signalement. Votre signalement sera examiné par notre équipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du signalement *</Label>
              <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reason === ReportReason.OTHER && (
              <div className="space-y-2">
                <Label htmlFor="message">Description détaillée *</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez le problème en détail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/500 caractères
                </p>
              </div>
            )}

            {reason && reason !== ReportReason.OTHER && (
              <div className="space-y-2">
                <Label htmlFor="message-optional">Message supplémentaire (optionnel)</Label>
                <Textarea
                  id="message-optional"
                  placeholder="Ajoutez des détails si nécessaire..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/500 caractères
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setReason('');
                setMessage('');
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !reason}>
              {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

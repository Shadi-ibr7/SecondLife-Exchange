-- AlterEnum: Ajouter les nouveaux types de notifications pour le forum
ALTER TYPE "NotificationType" ADD VALUE 'POST_LIKED';
ALTER TYPE "NotificationType" ADD VALUE 'THREAD_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'POST_REPLY';

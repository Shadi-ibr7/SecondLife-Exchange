-- Migration: Add actorRole to AdminLog
-- Description: Ajoute le champ actorRole pour stocker le rôle de l'acteur au moment de l'action (trace immuable)
-- Date: 2026-01-20
--
-- Cette migration est SAFE pour la production:
-- - Elle ajoute une colonne NOT NULL avec une valeur par défaut
-- - Les logs existants auront 'ADMIN' par défaut (tous les admins dans admin_logs sont ADMIN)
-- - Aucune donnée n'est perdue

-- Ajouter la colonne actorRole d'abord sans NOT NULL
ALTER TABLE "admin_logs" ADD COLUMN "actorRole" "UserRole";

-- Mettre à jour les logs existants avec le rôle ADMIN
UPDATE "admin_logs" SET "actorRole" = 'ADMIN' WHERE "actorRole" IS NULL;

-- Maintenant rendre la colonne NOT NULL avec valeur par défaut
ALTER TABLE "admin_logs" ALTER COLUMN "actorRole" SET NOT NULL;
ALTER TABLE "admin_logs" ALTER COLUMN "actorRole" SET DEFAULT 'ADMIN';

-- Créer un index sur actorRole pour les recherches/filtres
CREATE INDEX "admin_logs_actorRole_idx" ON "admin_logs"("actorRole");

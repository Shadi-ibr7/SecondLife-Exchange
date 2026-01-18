-- Migration: Add requestId to AdminLog
-- Description: Ajoute le champ requestId au modèle AdminLog pour la traçabilité des requêtes
-- Date: 2026-01-19

-- Ajouter le champ requestId (nullable pour rétrocompatibilité)
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "requestId" TEXT;

-- Ajouter un index sur requestId pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS "admin_logs_requestId_idx" ON "admin_logs"("requestId");

-- Ajouter un index sur action pour améliorer les performances de filtrage
CREATE INDEX IF NOT EXISTS "admin_logs_action_idx" ON "admin_logs"("action");

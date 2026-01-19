-- Migration: Ajouter le champ twoFactorBackupCodes pour stocker les backup codes hashés
-- Les backup codes sont hashés avec bcrypt et stockés dans un tableau

ALTER TABLE "users" ADD COLUMN "twoFactorBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Index pour améliorer les performances (optionnel, car les tableaux sont déjà indexés)
-- CREATE INDEX IF NOT EXISTS "users_twoFactorBackupCodes_idx" ON "users" USING GIN ("twoFactorBackupCodes");

-- Migration: Add MODERATOR role to UserRole enum
-- Description: Ajoute le rôle MODERATOR entre USER et ADMIN pour le RBAC
-- Date: 2026-01-17
-- 
-- Cette migration est SAFE pour la production:
-- - Elle ajoute une nouvelle valeur à l'enum sans modifier les existantes
-- - Les utilisateurs existants (USER ou ADMIN) ne sont pas affectés
-- - Aucune donnée n'est perdue

-- Ajouter la valeur MODERATOR à l'enum UserRole
-- On utilise ALTER TYPE pour ajouter la valeur après USER
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MODERATOR' AFTER 'USER';

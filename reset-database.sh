#!/bin/bash

set -e

echo "🔄 Réinitialisation complète de la base de données..."

cd /Users/shadiibrahim/SecondLife-Exchange

# 1. Arrêter le backend si nécessaire
echo ""
echo "⏸️  Vérification du backend..."
if lsof -ti:4000 > /dev/null 2>&1; then
    echo "⚠️  Le backend tourne sur le port 4000. Arrêtez-le d'abord (Ctrl+C)."
    read -p "Appuyez sur Entrée une fois le backend arrêté..."
fi

# 2. Supprimer et recréer la base de données
echo ""
echo "🗄️  Recréation de la base de données..."
docker exec secondlife-postgres psql -U postgres -d postgres <<EOF
-- Arrêter toutes les connexions actives
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'secondlife'
  AND pid <> pg_backend_pid();

-- Supprimer et recréer la base
DROP DATABASE IF EXISTS secondlife;
CREATE DATABASE secondlife OWNER postgres;
EOF

# 3. Accorder toutes les permissions
echo ""
echo "🔐 Attribution des permissions..."
docker exec secondlife-postgres psql -U postgres -d secondlife <<EOF
-- Permissions sur le schéma public
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;

-- Permissions par défaut
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

-- S'assurer que postgres est propriétaire
ALTER SCHEMA public OWNER TO postgres;
ALTER DATABASE secondlife OWNER TO postgres;

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF

# 4. Appliquer les migrations Prisma
echo ""
echo "📦 Application des migrations Prisma..."
cd apps/backend
pnpm prisma migrate deploy || pnpm prisma migrate dev

echo ""
echo "✅ Base de données réinitialisée avec succès !"
echo ""
echo "🚀 Redémarrez maintenant le backend :"
echo "   pnpm -C apps/backend start:dev"


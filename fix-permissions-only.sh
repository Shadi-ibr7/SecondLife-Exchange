#!/bin/bash

echo "🔧 Correction des permissions PostgreSQL uniquement..."

docker exec secondlife-postgres psql -U postgres -d secondlife <<EOF
-- Donner toutes les permissions sur le schéma public
GRANT ALL ON SCHEMA public TO postgres;

-- Permissions sur toutes les tables existantes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Permissions sur toutes les séquences existantes
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Permissions par défaut pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Donner la propriété de la base de données
ALTER DATABASE secondlife OWNER TO postgres;

-- S'assurer que l'utilisateur peut créer des objets
ALTER SCHEMA public OWNER TO postgres;
EOF

echo ""
echo "✅ Permissions PostgreSQL corrigées !"
echo ""
echo "Redémarrez le backend maintenant :"
echo "   Ctrl+C puis pnpm -C apps/backend start:dev"


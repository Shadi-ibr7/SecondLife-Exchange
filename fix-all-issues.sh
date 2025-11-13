#!/bin/bash

set -e

echo "🔧 Correction de tous les problèmes..."

cd /Users/shadiibrahim/SecondLife-Exchange

# 1. Corriger les permissions PostgreSQL
echo ""
echo "📊 Correction des permissions PostgreSQL..."
docker exec secondlife-postgres psql -U postgres -d secondlife <<EOF
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DATABASE secondlife OWNER TO postgres;
EOF

echo "✅ Permissions PostgreSQL corrigées"

# 2. Vérifier que @types/node est installé
echo ""
echo "📦 Vérification de @types/node..."
if ! pnpm -C apps/backend list @types/node 2>&1 | grep -q "@types/node"; then
    echo "⚠️  Installation de @types/node..."
    pnpm -C apps/backend add -D @types/node@^20.10.0
else
    echo "✅ @types/node est installé"
fi

# 3. Réinstaller les dépendances pour s'assurer que tout est à jour
echo ""
echo "📦 Réinstallation des dépendances..."
pnpm install

# 4. Générer Prisma Client
echo ""
echo "🗄️  Génération du client Prisma..."
pnpm -C apps/backend prisma:generate

echo ""
echo "✅ Toutes les corrections sont terminées !"
echo ""
echo "🚀 Redémarrez le backend avec :"
echo "   pnpm -C apps/backend start:dev"
echo ""
echo "Le backend devrait maintenant démarrer sans erreur de permissions PostgreSQL."
echo "Les erreurs TypeScript ne bloquent pas le démarrage, elles sont juste des avertissements."


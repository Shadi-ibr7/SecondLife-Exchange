#!/bin/bash

echo "🔧 Correction des problèmes du backend..."

# 1. Corriger les permissions de la base de données
echo ""
echo "📊 Correction des permissions de la base de données..."
docker exec secondlife-postgres psql -U postgres -d secondlife -c "GRANT ALL ON SCHEMA public TO postgres;" 2>/dev/null
docker exec secondlife-postgres psql -U postgres -d secondlife -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;" 2>/dev/null
docker exec secondlife-postgres psql -U postgres -d secondlife -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;" 2>/dev/null
docker exec secondlife-postgres psql -U postgres -d secondlife -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;" 2>/dev/null
echo "✅ Permissions corrigées"

# 2. Vérifier que les dépendances sont installées
echo ""
echo "📦 Vérification des dépendances..."
cd apps/backend
if [ ! -d "node_modules" ]; then
    echo "⚠️  Installation des dépendances..."
    cd ../..
    pnpm install
    cd apps/backend
fi

# 3. Générer Prisma Client
echo ""
echo "🗄️  Génération du client Prisma..."
pnpm prisma:generate

# 4. Vérifier les migrations
echo ""
echo "🔄 Vérification des migrations..."
pnpm prisma:migrate deploy 2>/dev/null || pnpm prisma:migrate dev --name init

echo ""
echo "✅ Toutes les corrections sont terminées !"
echo ""
echo "🚀 Pour démarrer le backend, exécutez :"
echo "   pnpm -C apps/backend start:dev"


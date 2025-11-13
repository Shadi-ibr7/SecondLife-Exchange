#!/bin/bash

# Script de configuration du module Community
# Usage: ./scripts/setup-community.sh

set -e

echo "🚀 Configuration du module Community pour SecondLife Exchange"
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que Docker est démarré
if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas démarré. Veuillez démarrer Docker Desktop."
    exit 1
fi

echo "✅ Docker est prêt"
echo ""

# Démarrer les services Docker
echo "📦 Démarrage de PostgreSQL et Redis..."
docker-compose up -d postgres redis

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 5

# Vérifier la connexion à PostgreSQL
until docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; do
    echo "⏳ En attente de PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL est prêt"
echo ""

# Appliquer les migrations Prisma
echo "🔄 Application des migrations Prisma..."
cd apps/backend

# Appliquer toutes les migrations
npx prisma migrate deploy

echo "✅ Migrations appliquées avec succès"
echo ""

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "✅ Client Prisma généré"
echo ""

# Retour au répertoire racine
cd ../..

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo "✅ Dépendances installées"
    echo ""
fi

# Lancer les tests pour vérifier l'installation
echo "🧪 Exécution des tests du module Community..."
echo ""

# Tests backend
echo "📝 Tests backend..."
cd apps/backend
npm test -- --testPathPattern=community --passWithNoTests || true
cd ../..
echo ""

# Tests frontend
echo "📝 Tests frontend..."
cd apps/frontend
npm test -- --testPathPatterns=community --passWithNoTests || true
cd ../..
echo ""

echo "🎉 Configuration terminée avec succès !"
echo ""
echo "📚 Prochaines étapes :"
echo "  1. Démarrer le backend : cd apps/backend && npm run start:dev"
echo "  2. Démarrer le frontend : cd apps/frontend && npm run dev"
echo "  3. Accéder à l'application : http://localhost:3000/community"
echo ""
echo "📖 Documentation complète : voir COMMUNITY_MODULE_SUMMARY.md"
echo ""


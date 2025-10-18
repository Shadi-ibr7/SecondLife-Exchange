#!/bin/bash

# Script de démarrage rapide pour SecondLife Exchange
# Usage: ./start.sh

set -e

echo "🚀 Démarrage de SecondLife Exchange..."

# Vérifier que Docker est installé et en cours d'exécution
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker d'abord."
    exit 1
fi

# Vérifier que pnpm est installé
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm n'est pas installé. Veuillez installer pnpm d'abord."
    echo "   npm install -g pnpm"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie du fichier d'exemple..."
    cp env.example .env
    echo "📝 Veuillez éditer le fichier .env avec vos clés API avant de continuer."
    echo "   nano .env"
    read -p "Appuyez sur Entrée une fois le fichier .env configuré..."
fi

echo "🐳 Démarrage des services Docker..."
docker compose up -d

echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 10

echo "📦 Installation des dépendances..."
pnpm install

echo "🗄️  Configuration de la base de données..."
pnpm -C apps/backend prisma:generate
pnpm -C apps/backend prisma:migrate dev

echo "🎉 Configuration terminée !"
echo ""
echo "Pour démarrer l'application :"
echo "  Backend:  pnpm -C apps/backend start:dev"
echo "  Frontend: pnpm -C apps/frontend dev"
echo ""
echo "URLs d'accès :"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000/api/v1"
echo "  Health:   http://localhost:4000/api/v1/health"
echo ""
echo "Pour arrêter les services Docker :"
echo "  docker compose down"

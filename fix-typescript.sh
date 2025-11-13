#!/bin/bash

echo "🔧 Correction des problèmes TypeScript..."

cd /Users/shadiibrahim/SecondLife-Exchange

# 1. S'assurer que @types/node est installé
echo "📦 Vérification de @types/node..."
pnpm -C apps/backend add -D @types/node@^20.10.0

# 2. Réinstaller les dépendances si nécessaire
echo "📦 Réinstallation des dépendances..."
pnpm install

# 3. Générer Prisma Client
echo "🗄️  Génération du client Prisma..."
pnpm -C apps/backend prisma:generate

echo ""
echo "✅ Corrections terminées !"
echo ""
echo "🚀 Redémarrez le backend avec :"
echo "   pnpm -C apps/backend start:dev"


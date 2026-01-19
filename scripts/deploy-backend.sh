#!/bin/bash

# Script de déploiement du backend
# Usage: ./scripts/deploy-backend.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du backend..."

# Aller à la racine du projet
cd /var/www/SecondLife-Exchange || exit 1

# 1. Pull depuis GitHub
echo "📥 Pull depuis GitHub..."
git pull origin main

# 2. Aller dans le dossier backend
cd apps/backend || exit 1

# 3. Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
pnpm install --frozen-lockfile

# 4. Générer Prisma Client
echo "🗄️ Génération Prisma Client..."
npx prisma generate

# 5. Build du backend
echo "🔨 Build du backend..."
pnpm build

# 6. Redémarrer PM2 avec --update-env pour recharger les variables d'environnement
echo "🔄 Redémarrage PM2 avec mise à jour des variables d'environnement..."
pm2 restart secondlife-backend --update-env

# 7. Attendre un peu pour que le serveur démarre
sleep 3

# 8. Afficher les logs récents
echo "📋 Logs récents (CORS/ENV/CONFIG):"
pm2 logs secondlife-backend --lines 50 --nostream | grep -E "ENV|CONFIG|CORS|FRONTEND_ORIGINS|Bootstrap" || echo "Aucun log trouvé"

echo "✅ Déploiement terminé !"
echo ""
echo "Pour voir tous les logs en temps réel:"
echo "  pm2 logs secondlife-backend"

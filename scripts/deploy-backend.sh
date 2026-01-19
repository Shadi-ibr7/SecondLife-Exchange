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

# 2. Synchroniser FRONTEND_ORIGINS du .env racine vers apps/backend/.env
# (PM2 charge le .env depuis apps/backend, donc il doit être synchronisé)
echo "🔄 Synchronisation FRONTEND_ORIGINS..."
if [ -f .env ] && [ -f apps/backend/.env ]; then
  FRONTEND_ORIGINS_ROOT=$(grep "^FRONTEND_ORIGINS=" .env | cut -d'=' -f2- || echo "")
  if [ -n "$FRONTEND_ORIGINS_ROOT" ]; then
    # Mettre à jour FRONTEND_ORIGINS dans apps/backend/.env
    if grep -q "^FRONTEND_ORIGINS=" apps/backend/.env; then
      sed -i "s|^FRONTEND_ORIGINS=.*|FRONTEND_ORIGINS=$FRONTEND_ORIGINS_ROOT|" apps/backend/.env
    else
      echo "FRONTEND_ORIGINS=$FRONTEND_ORIGINS_ROOT" >> apps/backend/.env
    fi
    echo "✅ FRONTEND_ORIGINS synchronisé"
  fi
fi

# 3. Aller dans le dossier backend
cd apps/backend || exit 1

# 4. Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
pnpm install --frozen-lockfile

# 5. Générer Prisma Client
echo "🗄️ Génération Prisma Client..."
npx prisma generate

# 6. Build du backend
echo "🔨 Build du backend..."
pnpm build

# 7. Redémarrer PM2 avec --update-env pour recharger les variables d'environnement
echo "🔄 Redémarrage PM2 avec mise à jour des variables d'environnement..."
pm2 restart secondlife-backend --update-env

# 8. Attendre un peu pour que le serveur démarre
sleep 3

# 9. Afficher les logs récents
echo "📋 Logs récents (CORS/ENV/CONFIG):"
pm2 logs secondlife-backend --lines 50 --nostream | grep -E "ENV|CONFIG|CORS|FRONTEND_ORIGINS|Bootstrap" || echo "Aucun log trouvé"

echo "✅ Déploiement terminé !"
echo ""
echo "Pour voir tous les logs en temps réel:"
echo "  pm2 logs secondlife-backend"

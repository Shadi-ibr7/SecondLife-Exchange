#!/bin/bash

# Script de déploiement Backend pour VPS Hostinger
# Usage: ./scripts/deploy-backend.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du backend SecondLife Exchange..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "apps/backend/package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# Aller dans le dossier backend
cd apps/backend

echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
pnpm install

echo -e "${YELLOW}🔧 Génération du client Prisma...${NC}"
pnpm prisma:generate

echo -e "${YELLOW}🗄️  Application des migrations...${NC}"
pnpm prisma:deploy

echo -e "${YELLOW}🏗️  Build du backend...${NC}"
pnpm build

echo -e "${YELLOW}🔄 Redémarrage avec PM2...${NC}"
if pm2 list | grep -q "secondlife-backend"; then
    pm2 restart secondlife-backend
    echo -e "${GREEN}✅ Backend redémarré${NC}"
else
    pm2 start dist/main.js --name "secondlife-backend"
    pm2 save
    echo -e "${GREEN}✅ Backend démarré${NC}"
fi

echo -e "${GREEN}✨ Déploiement terminé avec succès!${NC}"
echo -e "${YELLOW}📊 Statut:${NC}"
pm2 status secondlife-backend

echo -e "${YELLOW}📝 Logs (dernières 20 lignes):${NC}"
pm2 logs secondlife-backend --lines 20 --nostream


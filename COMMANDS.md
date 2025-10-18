# Commandes utiles - SecondLife Exchange

## 🚀 Démarrage rapide

```bash
# Script de démarrage automatique
./start.sh

# Ou démarrage manuel
docker compose up -d
cp env.example .env
pnpm install
pnpm -C apps/backend prisma:migrate dev
```

## 📦 Gestion des dépendances

```bash
# Installer toutes les dépendances
pnpm install

# Ajouter une dépendance au backend
pnpm -C apps/backend add <package>

# Ajouter une dépendance au frontend
pnpm -C apps/frontend add <package>

# Ajouter une dépendance de développement à la racine
pnpm add -D <package>
```

## 🗄️ Base de données

```bash
# Générer le client Prisma
pnpm -C apps/backend prisma:generate

# Créer une nouvelle migration
pnpm -C apps/backend prisma:migrate dev --name <nom-migration>

# Appliquer les migrations en production
pnpm -C apps/backend prisma:migrate deploy

# Réinitialiser la base de données
pnpm -C apps/backend prisma:migrate reset

# Ouvrir Prisma Studio
pnpm -C apps/backend prisma:studio
```

## 🏃‍♂️ Développement

```bash
# Démarrer le backend en mode développement
pnpm -C apps/backend start:dev

# Démarrer le frontend en mode développement
pnpm -C apps/frontend dev

# Démarrer les deux en parallèle (depuis la racine)
pnpm dev
```

## 🧪 Tests

```bash
# Tests backend
pnpm -C apps/backend test
pnpm -C apps/backend test:watch
pnpm -C apps/backend test:cov
pnpm -C apps/backend test:e2e

# Tests frontend (à implémenter)
pnpm -C apps/frontend test
pnpm -C apps/frontend test:e2e
```

## 🔧 Qualité du code

```bash
# Linter
pnpm -w lint

# Formatage
pnpm -w format
pnpm -w format:check

# Vérification TypeScript
pnpm -w typecheck
```

## 🏗️ Build et déploiement

```bash
# Build complet
pnpm -w build

# Build backend uniquement
pnpm -C apps/backend build

# Build frontend uniquement
pnpm -C apps/frontend build

# Démarrer en production
pnpm -C apps/backend start:prod
pnpm -C apps/frontend start
```

## 🐳 Docker

```bash
# Démarrer les services
docker compose up -d

# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down

# Reconstruire les images
docker compose up -d --build

# Nettoyer les volumes
docker compose down -v
```

## 🔍 Debug et monitoring

```bash
# Vérifier la santé de l'API
curl http://localhost:4000/api/v1/health

# Voir les logs du backend
pnpm -C apps/backend start:dev

# Voir les logs du frontend
pnpm -C apps/frontend dev

# Ouvrir Prisma Studio
pnpm -C apps/backend prisma:studio
```

## 📊 Base de données

```bash
# Se connecter à PostgreSQL
docker exec -it secondlife-postgres psql -U postgres -d secondlife

# Voir les tables
\dt

# Voir la structure d'une table
\d users

# Exécuter une requête
SELECT * FROM users LIMIT 5;

# Se déconnecter
\q
```

## 🔐 Sécurité

```bash
# Audit des dépendances
pnpm audit

# Audit avec correction automatique
pnpm audit --fix

# Vérifier les vulnérabilités
pnpm audit --audit-level moderate
```

## 📝 Git et CI/CD

```bash
# Préparer un commit (lint + format automatique)
git add .
git commit -m "feat: nouvelle fonctionnalité"

# Voir le statut des workflows GitHub Actions
gh run list

# Voir les logs d'un workflow
gh run view <run-id>
```

## 🆘 Dépannage

```bash
# Nettoyer le cache pnpm
pnpm store prune

# Nettoyer node_modules
rm -rf node_modules apps/*/node_modules
pnpm install

# Nettoyer les builds
rm -rf apps/*/dist apps/*/.next
pnpm -w build

# Redémarrer Docker
docker compose down
docker compose up -d

# Vérifier les ports utilisés
lsof -i :3000  # Frontend
lsof -i :4000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

## 📚 Documentation

```bash
# Ouvrir la documentation
open README.md
open docs/architecture.md

# Générer la documentation API (Swagger)
# Accessible sur http://localhost:4000/api/v1/docs
```

## 🎯 Commandes métier

```bash
# Générer manuellement les suggestions IA
curl -X POST http://localhost:4000/api/v1/ai/generate-suggestions \
  -H "Authorization: Bearer <token>"

# Voir le thème hebdomadaire actuel
curl http://localhost:4000/api/v1/ai/theme

# Lister les utilisateurs
curl http://localhost:4000/api/v1/users \
  -H "Authorization: Bearer <token>"
```

Ces commandes couvrent tous les aspects du développement et de la maintenance de SecondLife Exchange.

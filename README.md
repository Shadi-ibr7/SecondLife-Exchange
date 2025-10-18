# SecondLife Exchange

> Plateforme d'échange d'objets avec suggestions IA pour donner une seconde vie à vos biens

[![CI/CD Pipeline](https://github.com/shadiibrahim/SecondLife-Exchange/actions/workflows/ci.yml/badge.svg)](https://github.com/shadiibrahim/SecondLife-Exchange/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)

## 🎯 Contexte

SecondLife Exchange est une plateforme innovante qui permet aux utilisateurs d'échanger leurs objets de manière intelligente et sécurisée. Grâce à l'intégration de l'IA Gemini 1.5 Pro, la plateforme génère automatiquement des suggestions d'objets à échanger basées sur des thèmes hebdomadaires créatifs.

### ✨ Fonctionnalités principales

- 🔄 **Échanges sécurisés** : Système d'échange avec chat en temps réel et suivi des transactions
- 🤖 **Suggestions IA** : Génération automatique de suggestions d'objets via Gemini 1.5 Pro
- 📱 **PWA moderne** : Application web progressive installable sur mobile et desktop
- 🎨 **Thèmes hebdomadaires** : Nouveaux thèmes créatifs chaque semaine pour inspirer les échanges
- 💬 **Chat temps réel** : Communication instantanée entre utilisateurs via WebSocket
- 🔐 **Authentification JWT** : Sécurité robuste avec tokens d'accès et de rafraîchissement
- 📊 **Dashboard utilisateur** : Suivi des échanges, statistiques et gestion du profil

## 🛠️ Stack technique

### Frontend
- **Next.js 15** avec App Router pour une expérience utilisateur optimale
- **Tailwind CSS** + **shadcn/ui** pour un design moderne et responsive
- **Framer Motion** pour des animations fluides et des micro-interactions
- **Zustand** pour la gestion d'état côté client
- **React Hook Form** + **Zod** pour la validation des formulaires
- **Socket.io Client** pour la communication temps réel
- **next-pwa** pour les fonctionnalités PWA (offline, installable)

### Backend
- **NestJS** framework Node.js robuste et scalable
- **Prisma** ORM moderne avec PostgreSQL
- **JWT** pour l'authentification sécurisée
- **Socket.io** pour les WebSockets temps réel
- **Helmet** + **CORS** + **Rate Limiting** pour la sécurité
- **Class Validator** + **Zod** pour la validation des données
- **Cron Jobs** pour la génération automatique des suggestions IA

### IA & Services
- **Google Gemini 1.5 Pro** pour la génération de contenu intelligent
- **Cloudinary** pour la gestion des images (placeholder)
- **Firebase Cloud Messaging** pour les notifications push (placeholder)
- **Redis** pour le cache et les sessions

### Infrastructure & DevOps
- **Docker Compose** pour PostgreSQL et Redis
- **GitHub Actions** pour la CI/CD automatisée
- **ESLint** + **Prettier** + **Husky** pour la qualité du code
- **Jest** + **Supertest** pour les tests backend
- **TypeScript** strict pour la sécurité des types

## 🚀 Getting Started

### Prérequis

- **Node.js** 20 LTS ou supérieur
- **pnpm** 8.0 ou supérieur
- **Docker** et **Docker Compose** pour la base de données
- **Git** pour le versioning

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/shadiibrahim/SecondLife-Exchange.git
   cd SecondLife-Exchange
   ```

2. **Démarrer les services de base de données**
   ```bash
   docker compose up -d
   ```

3. **Configurer les variables d'environnement**
   ```bash
   # Copier le fichier d'exemple
   cp env.example .env
   
   # Éditer le fichier .env et renseigner vos clés API
   nano .env
   ```

4. **Installer les dépendances**
   ```bash
   pnpm install
   ```

5. **Configurer la base de données**
   ```bash
   # Générer le client Prisma
   pnpm -C apps/backend prisma:generate
   
   # Appliquer les migrations
   pnpm -C apps/backend prisma:migrate dev
   ```

6. **Démarrer l'application**
   ```bash
   # Démarrer le backend (port 4000)
   pnpm -C apps/backend start:dev
   
   # Dans un autre terminal, démarrer le frontend (port 3000)
   pnpm -C apps/frontend dev
   ```

7. **Accéder à l'application**
   - Frontend : http://localhost:3000
   - Backend API : http://localhost:4000/api/v1
   - Documentation API : http://localhost:4000/api/v1/docs (Swagger)

### Variables d'environnement requises

```env
# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/secondlife

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# IA Gemini
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
```

## 📁 Architecture

```
SecondLife-Exchange/
├── apps/
│   ├── backend/                 # API NestJS
│   │   ├── src/
│   │   │   ├── modules/         # Modules métier
│   │   │   │   ├── auth/        # Authentification JWT
│   │   │   │   ├── users/       # Gestion utilisateurs
│   │   │   │   ├── items/       # CRUD objets
│   │   │   │   ├── exchanges/   # Gestion échanges
│   │   │   │   ├── chat/        # WebSocket chat
│   │   │   │   └── ai/          # Intégration Gemini
│   │   │   └── common/          # Utilitaires partagés
│   │   └── prisma/              # Schéma base de données
│   └── frontend/                # PWA Next.js
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   ├── components/      # Composants React
│       │   ├── lib/             # Utilitaires et API client
│       │   └── store/           # État global Zustand
│       └── public/              # Assets statiques
├── .github/workflows/           # CI/CD GitHub Actions
├── docs/                        # Documentation
└── docker-compose.yml           # Services infrastructure
```

## 🔒 Sécurité

### Mesures implémentées

- **OWASP Top 10** : Protection contre les vulnérabilités courantes
- **Helmet.js** : Headers de sécurité HTTP
- **CORS** : Configuration stricte des origines autorisées
- **Rate Limiting** : Protection contre les attaques par déni de service
- **Validation stricte** : Validation des entrées avec Zod et Class Validator
- **JWT sécurisé** : Tokens d'accès courts + refresh tokens
- **Hashage des mots de passe** : bcrypt avec salt rounds élevés

### Conformité RGPD

- **Minimisation des données** : Collecte uniquement des données nécessaires
- **Consentement explicite** : Opt-in pour les notifications et communications
- **Droit à l'effacement** : Suppression complète des données utilisateur
- **Portabilité** : Export des données utilisateur
- **Chiffrement** : Données sensibles chiffrées en transit et au repos

## 📱 PWA (Progressive Web App)

### Fonctionnalités PWA

- **Installable** : Installation sur mobile et desktop
- **Offline-first** : Fonctionnement hors ligne avec cache intelligent
- **Push notifications** : Notifications pour les nouveaux messages (placeholder)
- **App-like experience** : Interface native avec splash screen
- **Lighthouse score** : Optimisé pour un score PWA ≥ 90

### Configuration

- **Service Worker** : Cache automatique des ressources
- **Web App Manifest** : Métadonnées pour l'installation
- **Icons** : Icônes adaptatives pour tous les appareils
- **Theme color** : Couleurs cohérentes avec le thème système

## 🧪 Tests

### Backend
```bash
# Tests unitaires
pnpm -C apps/backend test

# Tests e2e
pnpm -C apps/backend test:e2e

# Couverture de code
pnpm -C apps/backend test:cov
```

### Frontend
```bash
# Tests (à implémenter)
pnpm -C apps/frontend test

# Tests e2e avec Playwright (à implémenter)
pnpm -C apps/frontend test:e2e
```

## 🚀 Déploiement

### Production

1. **Variables d'environnement de production**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@prod-db:5432/secondlife
   JWT_ACCESS_SECRET=strong_production_secret
   GEMINI_API_KEY=production_gemini_key
   ```

2. **Build des applications**
   ```bash
   pnpm build
   ```

3. **Déploiement avec Docker** (à implémenter)
   ```bash
   docker build -t secondlife-exchange .
   docker run -p 3000:3000 -p 4000:4000 secondlife-exchange
   ```

### CI/CD

Le pipeline GitHub Actions exécute automatiquement :
- ✅ Linting et formatage du code
- ✅ Tests unitaires et e2e
- ✅ Build des applications
- ✅ Audit de sécurité
- ✅ Tests Lighthouse PWA

## 📈 Roadmap

### Sprint 1 - MVP (Actuel)
- [x] Authentification JWT
- [x] CRUD objets et utilisateurs
- [x] Système d'échanges basique
- [x] Chat temps réel
- [x] Suggestions IA hebdomadaires
- [x] PWA installable

### Sprint 2 - Améliorations UX
- [ ] Interface mobile optimisée
- [ ] Notifications push
- [ ] Système de notation utilisateurs
- [ ] Recherche avancée avec filtres
- [ ] Upload d'images avec Cloudinary

### Sprint 3 - Fonctionnalités avancées
- [ ] Géolocalisation pour échanges locaux
- [ ] Système de recommandations personnalisées
- [ ] Analytics et dashboard admin
- [ ] API publique pour intégrations
- [ ] Mode hors ligne complet

### Sprint 4 - Échelle et performance
- [ ] Cache Redis optimisé
- [ ] CDN pour les images
- [ ] Monitoring et alertes
- [ ] Tests de charge
- [ ] Optimisations SEO

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Standards de code

- **ESLint** + **Prettier** pour la cohérence
- **Conventional Commits** pour les messages de commit
- **Tests** requis pour les nouvelles fonctionnalités
- **Documentation** mise à jour

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Shadi Ibrahim** - Développeur Full-Stack & Architecte

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/shadiibrahim/SecondLife-Exchange/issues)
- **Discussions** : [GitHub Discussions](https://github.com/shadiibrahim/SecondLife-Exchange/discussions)
- **Email** : [votre-email@example.com]

---

<div align="center">
  <p>Fait avec ❤️ pour donner une seconde vie aux objets</p>
  <p>⭐ N'hésitez pas à star le projet si vous l'aimez !</p>
</div>

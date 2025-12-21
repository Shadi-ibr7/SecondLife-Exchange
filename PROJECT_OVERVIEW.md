# PROJECT_OVERVIEW.md - SecondLife Exchange

Documentation technique complète du projet SecondLife Exchange - Plateforme d'échange d'objets d'occasion avec IA, matching intelligent, PWA, messagerie temps réel, suggestions hebdomadaires via Gemini, et tableau de bord admin secret.

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Objectifs du projet](#2-objectifs-du-projet)
3. [Fonctionnalités principales (côté Utilisateur)](#3-fonctionnalités-principales-côté-utilisateur)
4. [Fonctionnalités Admin (accès secret)](#4-fonctionnalités-admin-accès-secret)
5. [Architecture globale](#5-architecture-globale)
6. [Stack technique complète](#6-stack-technique-complète)
7. [Base de données (Prisma)](#7-base-de-données-prisma)
8. [APIs Backend (liste complète des endpoints)](#8-apis-backend-liste-complète-des-endpoints)
9. [Architecture des dossiers](#9-architecture-des-dossiers)
10. [Sécurité du projet](#10-sécurité-du-projet)
11. [PWA](#11-pwa)
12. [Déploiement & Serveur](#12-déploiement--serveur)
13. [Tests](#13-tests)
14. [Limitations techniques](#14-limitations-techniques)
15. [Améliorations futures](#15-améliorations-futures)
16. [Conclusion](#16-conclusion)

---

## 1. Présentation du projet

### Nom
**SecondLife Exchange**

### Résumé
Plateforme d'échange d'objets d'occasion innovante qui permet aux utilisateurs d'échanger leurs biens de manière intelligente et sécurisée. La plateforme intègre l'intelligence artificielle (Google Gemini 1.5 Pro) pour générer automatiquement des suggestions d'objets basées sur des thèmes hebdomadaires créatifs, un système de matching intelligent pour proposer des échanges pertinents, une messagerie en temps réel via WebSocket, et un tableau de bord d'administration secret pour la gestion complète de la plateforme.

### Vision
Créer une plateforme éco-responsable qui encourage la réutilisation et le réemploi d'objets, réduisant ainsi l'impact environnemental tout en créant une communauté engagée autour de l'économie circulaire.

### Technologies principales
- **Frontend** : Next.js 15 (App Router), React 18, TypeScript
- **Backend** : NestJS 10, TypeScript, Prisma ORM
- **Base de données** : PostgreSQL
- **IA** : Google Gemini 1.5 Pro
- **Temps réel** : Socket.io
- **Images** : Cloudinary
- **PWA** : next-pwa, Service Worker

---

## 2. Objectifs du projet

### Objectifs techniques
- **Architecture modulaire** : Séparation claire frontend/backend avec monorepo
- **Performance** : Optimisation des temps de chargement, code splitting, lazy loading
- **Scalabilité** : Architecture prête pour la montée en charge
- **Type-safety** : TypeScript strict sur tout le projet
- **PWA** : Application installable, fonctionnelle hors ligne
- **Temps réel** : Communication instantanée via WebSocket

### Objectifs fonctionnels
- **Échanges sécurisés** : Système complet de gestion des échanges avec suivi des statuts
- **Suggestions IA** : Génération automatique de suggestions basées sur des thèmes hebdomadaires
- **Matching intelligent** : Algorithme de recommandation d'objets pertinents
- **Messagerie temps réel** : Chat intégré par échange avec support images
- **Découverte** : Exploration avec filtres avancés, recherche textuelle
- **Communauté** : Forums de discussion, threads et posts
- **Contenu éco-éducatif** : Articles, vidéos, statistiques sur l'impact environnemental

### Objectifs sécurité
- **Authentification robuste** : JWT avec refresh tokens, séparation admin/user
- **Protection des données** : Validation stricte, sanitisation, protection CSRF/XSS
- **Rate limiting** : Protection contre les abus et attaques DDoS
- **Audit trail** : Logs complets des actions admin
- **Isolation admin** : Chemin secret, authentification séparée, tokens distincts

### Objectifs performance
- **Temps de réponse** : < 200ms pour les requêtes API courantes
- **Lighthouse score** : ≥ 90 pour PWA, Performance, Accessibilité
- **Optimisation images** : Compression, formats modernes (WebP), lazy loading
- **Cache intelligent** : Service Worker avec stratégies adaptées

### Objectifs UX
- **Interface moderne** : Design system cohérent avec shadcn/ui
- **Responsive** : Adaptation mobile, tablette, desktop
- **Accessibilité** : Conformité WCAG 2.1 niveau AA
- **Animations fluides** : Framer Motion pour les micro-interactions
- **Feedback utilisateur** : Toasts, états de chargement, messages d'erreur clairs

---

## 3. Fonctionnalités principales (côté Utilisateur)

### 3.1 Authentification / Profil

#### Inscription
- Formulaire avec validation Zod (email, mot de passe ≥ 10 caractères)
- Hashage bcrypt côté serveur (12 salt rounds)
- Génération automatique d'un profil utilisateur
- Redirection automatique après inscription

#### Connexion
- Authentification JWT (access token 15min + refresh token 7 jours)
- Rate limiting : 5 tentatives par minute
- Gestion des erreurs avec messages clairs
- Redirection intelligente (paramètre `next` dans l'URL)

#### Profil utilisateur
- **Informations** : Nom d'affichage, avatar, bio, localisation
- **Préférences** : Catégories préférées, conditions, rayon de recherche
- **Statistiques** : Nombre d'objets, échanges réalisés, évaluations
- **Historique** : Liste des échanges (requis, reçus, complétés)
- **Gestion** : Modification profil, suppression compte

### 3.2 Gestion objets (CRUD + upload photos)

#### Création d'objet
- Formulaire complet : titre, description, catégorie, condition, tags
- Upload multiple de photos (max 6 par objet, 3MB par photo)
- Analyse IA automatique : catégorisation, tags, résumé, conseils réparation
- Validation en temps réel avec feedback visuel

#### Liste des objets
- Affichage paginé avec grille responsive
- Filtres : catégorie, condition, statut, recherche textuelle
- Tri : date, popularité, pertinence
- Mode propriétaire : vue "Mes objets" avec actions rapides

#### Détail d'un objet
- Galerie photos avec lightbox
- Informations complètes : propriétaire, localisation, tags, analyse IA
- Actions contextuelles :
  - **Propriétaire** : Édition, archivage, suppression
  - **Visiteur** : Proposition d'échange (si connecté)

#### Upload photos
- Intégration Cloudinary avec signature sécurisée
- Upload direct depuis le navigateur (pas de transit serveur)
- Compression automatique, formats optimisés
- Prévisualisation avant upload

### 3.3 Suggestions IA

#### Thèmes hebdomadaires
- Nouveau thème chaque semaine (ex: "Objets vintage français", "Électronique réparable")
- Génération automatique via Gemini 1.5 Pro
- Photo Unsplash associée, texte d'impact écologique
- Calendrier des thèmes passés et à venir

#### Suggestions d'objets
- 20 suggestions par thème, générées pour plusieurs pays
- Informations enrichies : époque, matériaux, raison écologique, difficulté réparation
- Filtrage par diversité pour éviter les doublons
- Statistiques de popularité et tags

#### Affichage
- Page dédiée `/themes` avec calendrier visuel
- Cartes de suggestions avec photos, catégories, raisons écologiques
- Filtres par pays, catégorie, époque

### 3.4 Matching d'échanges

#### Algorithme de matching
- Analyse des préférences utilisateur (catégories, conditions)
- Scoring basé sur la compatibilité des objets
- Recommandations personnalisées dans la page dédiée
- Badge "Recommandé" sur les objets pertinents

#### Page Matching
- Liste des objets recommandés avec score de compatibilité
- Filtres par catégorie, condition, localisation
- Actions rapides : voir détails, proposer échange

### 3.5 Explorer avec filtres

#### Fonctionnalités de recherche
- **Recherche textuelle** : Titre et description (recherche full-text)
- **Filtres avancés** :
  - Catégorie (CLOTHING, ELECTRONICS, BOOKS, HOME, etc.)
  - Condition (NEW, GOOD, FAIR, TO_REPAIR)
  - Statut (AVAILABLE, PENDING, TRADED, ARCHIVED)
  - Propriétaire (optionnel)
- **Tri** : Date, popularité, pertinence
- **Pagination** : 20 items par page avec navigation

#### Synchronisation URL
- Filtres synchronisés avec les paramètres de requête
- Partage de liens avec filtres appliqués
- Navigation arrière/avant avec état conservé

### 3.6 Chat temps réel par échange

#### Fonctionnalités
- **Rooms par échange** : Chaque échange a sa propre salle WebSocket
- **Messages texte** : Support markdown basique
- **Images** : Upload et partage d'images dans le chat
- **Typing indicator** : Indicateur "en train d'écrire"
- **Historique** : Chargement des messages précédents avec pagination
- **Notifications** : Alertes pour nouveaux messages (si PWA installée)

#### Interface
- Page dédiée `/exchange/[id]` avec chat intégré
- Affichage des participants, statut de l'échange
- Actions contextuelles : accepter, refuser, compléter l'échange

### 3.7 Échanges (workflow)

#### Création d'un échange
1. Utilisateur A propose un échange depuis la page d'un objet
2. Sélection de son objet à échanger
3. Message optionnel pour le propriétaire
4. Création de l'échange avec statut `PENDING`

#### Gestion des échanges
- **Statuts** :
  - `PENDING` : En attente de réponse
  - `ACCEPTED` : Échange accepté
  - `COMPLETED` : Échange complété
  - `DECLINED` : Échange refusé
  - `CANCELLED` : Échange annulé

#### Actions disponibles
- **Accepter** : Passe le statut à `ACCEPTED`, notifie l'autre partie
- **Refuser** : Passe le statut à `DECLINED`
- **Compléter** : Marque l'échange comme `COMPLETED`
- **Annuler** : Annule l'échange (uniquement par le demandeur)

#### Suivi
- Page `/exchanges` avec liste de tous les échanges
- Filtres : statut, rôle (requis/reçu)
- Détails complets : objets concernés, messages, dates

### 3.8 Thèmes hebdomadaires

#### Affichage
- Page `/themes` avec calendrier visuel (grille mensuelle)
- Thème actif mis en avant
- Navigation entre les semaines/mois
- Historique des thèmes passés

#### Détails d'un thème
- Titre, description, photo Unsplash
- Texte d'impact écologique avec exemples concrets
- Liste des suggestions associées
- Statistiques : nombre de suggestions, pays couverts

### 3.9 Découverte écologique (articles/vidéos/stats)

#### Contenu éco-éducatif
- **Articles** : Guides, tutoriels, actualités
- **Vidéos** : Contenu vidéo éducatif (URLs externes)
- **Statistiques** : KPIs sur l'impact environnemental
- **Tags** : Catégorisation pour faciliter la découverte

#### Page Découvrir
- `/discover` : Liste paginée du contenu
- Filtres : type (article/vidéo), tags, locale
- Statistiques globales : objets échangés, CO2 économisé, etc.

### 3.10 Notifications PWA

#### Types de notifications
- Nouveaux messages dans un échange
- Changement de statut d'échange
- Nouvelles suggestions de matching
- Nouveau thème hebdomadaire

#### Configuration
- Inscription aux notifications push (Firebase Cloud Messaging)
- Préférences utilisateur (types de notifications)
- Gestion des tokens de notification

### 3.11 Système de report

#### Signalements
- **Types** : Utilisateur, objet, échange, post
- **Raison** : Spam, contenu inapproprié, comportement abusif
- **Message** : Description détaillée du problème
- **Anonyme** : Les signalements peuvent être anonymes

#### Traitement
- Notification admin automatique
- Suivi du statut (non résolu / résolu)
- Actions possibles : bannissement, suppression de contenu

### 3.12 Espace discussion communautaire

#### Forums
- **Threads** : Sujets de discussion
- **Posts** : Messages dans les threads
- **Réponses** : Système de réponses imbriquées
- **Scopes** : Threads globaux ou liés à un objet/échange

#### Fonctionnalités
- Création de threads avec titre et contenu
- Réponses aux posts avec support markdown
- Édition/suppression de ses propres posts
- Navigation par catégories/thèmes

---

## 4. Fonctionnalités Admin (accès secret)

### 4.1 Chemin secret admin

#### Configuration
- **Variable d'environnement** : `ADMIN_BASE_PATH` (ex: `greenroom-core-qlf18scha7`)
- **Route backend** : `/api/v1/{ADMIN_BASE_PATH}/*`
- **Route frontend** : `/{ADMIN_BASE_PATH}/*`
- **Middleware** : `AdminMiddleware` vérifie le chemin avant traitement

#### Sécurité
- Chemin non documenté publiquement
- Middleware de protection contre les scans
- Logs des tentatives d'accès non autorisées

### 4.2 Connexion admin dédiée

#### Authentification séparée
- **Endpoint** : `POST /api/v1/auth/admin/login`
- **Secret JWT distinct** : `ADMIN_JWT_SECRET` (différent de `JWT_ACCESS_SECRET`)
- **Durée token** : 24h (vs 15min pour les users)
- **Vérification rôle** : Seuls les utilisateurs avec `roles: ADMIN` peuvent se connecter

#### Stratégie JWT admin
- `AdminJwtStrategy` : Stratégie Passport dédiée
- Validation du rôle ADMIN dans le payload
- Guard `AdminJwtGuard` pour protéger les routes

### 4.3 Dashboard analytics

#### Statistiques globales
- **Utilisateurs** : Total, actifs (30j), nouveaux (7j)
- **Objets** : Total, disponibles, échangés, archivés
- **Échanges** : Total, en cours, complétés, refusés
- **Signalements** : Non résolus, résolus (7j)
- **Thèmes** : Actifs, générés (mois)
- **Suggestions** : Total, par thème, par pays

#### Graphiques
- Évolution des utilisateurs (30j, 90j)
- Répartition des catégories d'objets
- Taux de conversion des échanges
- Activité par jour/semaine

### 4.4 Gestion utilisateurs (CRUD + bannissement)

#### Liste utilisateurs
- Pagination (20 par page)
- Recherche par email, nom d'affichage
- Filtres : rôle, statut (banni/non banni)
- Tri : date d'inscription, activité

#### Détails utilisateur
- Informations complètes : profil, préférences, statistiques
- Liste des objets publiés
- Historique des échanges
- Historique des signalements (reçus/faits)

#### Bannissement
- **Bannir** : `PATCH /api/v1/{ADMIN_BASE_PATH}/users/:id/ban`
  - Création d'un enregistrement `Ban`
  - Raison obligatoire
  - Log admin automatique
- **Débannir** : `PATCH /api/v1/{ADMIN_BASE_PATH}/users/:id/unban`
  - Suppression de l'enregistrement `Ban`
  - Log admin automatique

### 4.5 Gestion items

#### Liste objets
- Pagination, filtres : propriétaire, catégorie, statut
- Recherche par titre, description
- Actions rapides : archiver, supprimer

#### Actions
- **Archiver** : `PATCH /api/v1/{ADMIN_BASE_PATH}/items/:id/archive`
  - Change le statut à `ARCHIVED`
  - Log admin
- **Supprimer** : `DELETE /api/v1/{ADMIN_BASE_PATH}/items/:id`
  - Suppression définitive (cascade sur photos, échanges)
  - Log admin

### 4.6 Gestion échanges

#### Liste échanges
- Filtres : statut, participants, dates
- Détails : objets concernés, messages, historique

#### Actions
- Visualisation des messages
- Modification de statut (si nécessaire)
- Annulation d'échanges problématiques

### 4.7 Gestion signalements

#### Liste signalements
- Filtres : résolu/non résolu, type, date
- Tri : date, priorité
- Détails : contenu signalé, auteur, raison

#### Résolution
- **Résoudre** : `PATCH /api/v1/{ADMIN_BASE_PATH}/reports/:id/resolve`
  - Marque comme résolu
  - Option : bannir l'utilisateur signalé
  - Log admin avec décision

### 4.8 Gestion thèmes IA + génération suggestions

#### Liste thèmes
- Tous les thèmes (actifs et passés)
- Détails : titre, slug, dates, photo, suggestions

#### Génération thèmes
- **Générer un thème** : `POST /api/v1/{ADMIN_BASE_PATH}/themes/generate`
  - Appel à Gemini pour générer un thème
  - Récupération photo Unsplash
  - Sauvegarde en base
- **Générer 4 thèmes mensuels** : `POST /api/v1/{ADMIN_BASE_PATH}/themes/generate-monthly`
  - Génère les 4 thèmes de la semaine pour un mois
  - Planification automatique

#### Gestion suggestions
- **Générer suggestions** : `POST /api/v1/{ADMIN_BASE_PATH}/themes/:id/suggestions`
  - Génération pour un thème spécifique
  - Paramètres : locales (pays), nombre max
- **Liste suggestions** : `GET /api/v1/{ADMIN_BASE_PATH}/themes/:id/suggestions`
  - Pagination, filtres, tri
- **Statistiques** : `GET /api/v1/{ADMIN_BASE_PATH}/themes/:id/suggestions/stats`
  - Répartition par pays, catégorie, époque

#### CRUD thèmes
- **Créer** : `POST /api/v1/{ADMIN_BASE_PATH}/themes`
- **Modifier** : `PATCH /api/v1/{ADMIN_BASE_PATH}/themes/:id`
- **Activer** : `PATCH /api/v1/{ADMIN_BASE_PATH}/themes/:id/activate`
- **Supprimer** : `DELETE /api/v1/{ADMIN_BASE_PATH}/themes/:id`

### 4.9 Gestion contenu écologique

#### Liste contenu
- Pagination, filtres : type, tags, locale
- Recherche par titre, description

#### CRUD
- **Créer** : `POST /api/v1/{ADMIN_BASE_PATH}/eco`
- **Modifier** : `PATCH /api/v1/{ADMIN_BASE_PATH}/eco/:id`
- **Supprimer** : `DELETE /api/v1/{ADMIN_BASE_PATH}/eco/:id`
- **Enrichir avec IA** : `POST /api/v1/{ADMIN_BASE_PATH}/eco/:id/enrich`
  - Génération automatique de résumé, tags, KPIs via Gemini

### 4.10 Logs sécurité

#### Logs admin
- **Endpoint** : `GET /api/v1/{ADMIN_BASE_PATH}/logs`
- **Filtres** : admin, type d'action, date
- **Informations** : action, ressource, admin, IP, user agent, métadonnées
- **Pagination** : 50 par page

#### Types d'actions loggées
- Bannissement/débannissement
- Suppression d'objets
- Résolution de signalements
- Génération de thèmes/suggestions
- Modifications de contenu

### 4.11 Architecture de sécurité

#### Middleware secret
- `AdminMiddleware` : Vérifie le chemin avant traitement
- Protection contre les scans de chemins
- Logs des tentatives d'accès

#### Guards
- `AdminJwtGuard` : Vérifie le token JWT admin
- `AdminRoleGuard` : Vérifie le rôle ADMIN
- Application globale sur toutes les routes admin

#### Honeypot (si présent)
- Routes factices pour détecter les scans
- Logs des tentatives d'accès aux honeypots
- Alertes automatiques

---

## 5. Architecture globale

### 5.1 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  PWA     │  │  Mobile  │  │ Desktop  │                │
│  │ Next.js  │  │ Browser  │  │ Browser  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY (NGINX)                     │
│  - SSL/TLS termination                                      │
│  - Load balancing                                            │
│  - Static file serving                                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────────┐          ┌──────────────────────┐
│   FRONTEND (Next.js)  │          │   BACKEND (NestJS)    │
│  - Port 3000         │          │  - Port 4000         │
│  - SSR/SSG            │          │  - REST API          │
│  - PWA                │          │  - WebSocket          │
└──────────────────────┘          └──────────────────────┘
        │                                       │
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis    │  │  Cloudinary  │     │
│  │   (Prisma)    │  │   (Cache)   │  │   (Images)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Gemini     │  │  Unsplash    │  │  Firebase    │     │
│  │  (Google AI) │  │   (Photos)   │  │   (FCM)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Flux de données

#### Authentification
1. Client → Frontend : Credentials
2. Frontend → Backend : `POST /api/v1/auth/login`
3. Backend → Database : Validation user
4. Backend → Frontend : JWT tokens
5. Frontend : Stockage tokens (localStorage)

#### Création d'échange
1. Client → Frontend : Formulaire échange
2. Frontend → Backend : `POST /api/v1/exchanges`
3. Backend → Database : Création échange
4. Backend → WebSocket : Notification autre partie
5. WebSocket → Frontend : Message temps réel

#### Génération suggestions IA
1. Cron Job → Backend : Déclenchement hebdomadaire
2. Backend → Gemini API : Requête génération
3. Gemini → Backend : Suggestions JSON
4. Backend → Database : Sauvegarde suggestions
5. Frontend → Backend : `GET /api/v1/themes/:id/suggestions`
6. Backend → Frontend : Liste suggestions

---

## 6. Stack technique complète

### 6.1 Backend (NestJS)

#### Framework
- **NestJS 10** : Framework Node.js modulaire et scalable
- **TypeScript 5.3** : Type-safety strict
- **Express** : Serveur HTTP sous-jacent

#### Modules principaux
- **AuthModule** : Authentification JWT (user + admin)
- **UsersModule** : Gestion utilisateurs
- **ProfilesModule** : Profils utilisateurs
- **ItemsModule** : CRUD objets + upload photos
- **ExchangesModule** : Gestion échanges + WebSocket chat
- **ThemesModule** : Thèmes hebdomadaires
- **SuggestionsModule** : Suggestions IA
- **MatchingModule** : Algorithme de matching
- **EcoModule** : Contenu éco-éducatif
- **CommunityModule** : Forums et discussions
- **NotificationsModule** : Notifications push
- **AdminModule** : Administration complète
- **SchedulerModule** : Tâches planifiées (cron)
- **AIModule** : Intégration Gemini
- **UnsplashModule** : Intégration Unsplash

#### Auth (JWT + refresh)
- **Access tokens** : 15 minutes, secret `JWT_ACCESS_SECRET`
- **Refresh tokens** : 7 jours, secret `JWT_REFRESH_SECRET`
- **Stratégies Passport** :
  - `JwtAccessStrategy` : Validation access tokens
  - `JwtRefreshStrategy` : Validation refresh tokens
  - `AdminJwtStrategy` : Validation tokens admin (secret distinct)

#### Admin auth (token séparé)
- **Secret distinct** : `ADMIN_JWT_SECRET`
- **Durée** : 24 heures
- **Endpoint** : `/api/v1/auth/admin/login`
- **Guard** : `AdminJwtGuard` + `AdminRoleGuard`

#### Prisma
- **Version** : 6.18.0
- **ORM** : Type-safe, migrations automatiques
- **Client généré** : `@prisma/client`
- **Migrations** : Dossier `prisma/migrations/`

#### Services externes
- **Gemini** : Google Gemini 1.5 Pro API
  - Modèle : `gemini-2.5-flash` (par défaut)
  - Timeout : 10 secondes
  - Retries : 1
- **Cloudinary** : Gestion images
  - Upload direct depuis client (signature)
  - Compression automatique
  - Formats optimisés (WebP)

#### Sécurité
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Configuration stricte (origine unique)
- **Rate Limiting** : ThrottlerModule
  - Default : 100 req/min
  - Login : 5 req/min
  - Recommendations : 10 req/min
- **Validation** : Zod + Class Validator
- **Bcrypt** : Hashage mots de passe (12 rounds)

#### Logs Admin
- **Modèle** : `AdminLog` (Prisma)
- **Champs** : action, resourceType, resourceId, adminId, IP, userAgent, meta
- **Indexation** : Par admin, ressource, date

### 6.2 Frontend (Next.js)

#### Framework
- **Next.js 15** : App Router, Server Components
- **React 18** : Hooks, Suspense, Concurrent features
- **TypeScript 5.3** : Type-safety strict

#### Styling
- **Tailwind CSS 3.3** : Utility-first CSS
- **shadcn/ui** : Composants UI accessibles
- **Framer Motion 10** : Animations fluides
- **Lucide React** : Icônes

#### State Management
- **Zustand 4.4** : Store global léger
  - `authStore` : Authentification
  - `notificationsStore` : Notifications
- **React Query 5.9** : Cache serveur, synchronisation
- **React Hook Form 7.4** : Gestion formulaires

#### PWA
- **next-pwa 5.6** : Configuration PWA
- **Service Worker** : Cache stratégies
- **Manifest** : `manifest.webmanifest`
- **Icons** : Génération automatique

#### API Client
- **Axios 1.6** : Requêtes HTTP
- **Interceptors** : Gestion tokens, erreurs
- **Type-safe** : Types générés depuis API

#### Responsive
- **Mobile-first** : Design adaptatif
- **Navbar mobile** : Dock en bas
- **Breakpoints** : sm, md, lg, xl, 2xl

### 6.3 Socket.io

#### Configuration
- **CORS** : Origine frontend autorisée
- **Credentials** : Support cookies/tokens
- **Rooms** : `exchange:{exchangeId}`

#### Événements
- **`join`** : Rejoindre une room d'échange
- **`leave`** : Quitter une room
- **`message:new`** : Nouveau message
- **`error`** : Erreur de traitement

#### Sécurité
- Validation des données avant sauvegarde
- Vérification de la participation à l'échange
- Isolation des rooms par échange

### 6.4 IA – Gemini

#### Génération suggestions
- **Prompt structuré** : Template avec contexte thème
- **Validation Zod** : Schéma strict pour les réponses
- **Diversité** : Filtrage des doublons
- **Multi-pays** : Génération pour plusieurs locales

#### Enrichissement contenu
- **Analyse items** : Catégorisation, tags, résumé, conseils
- **Enrichissement éco** : Résumé, tags, KPIs automatiques
- **Thèmes** : Génération créative avec exemples

#### Catégorisation objet
- **Analyse automatique** : Lors de la création d'item
- **Suggestion catégorie** : Basée sur titre + description
- **Tags** : Génération automatique (3-4 tags)
- **Résumé IA** : Max 240 caractères
- **Conseils réparation** : Max 240 caractères

---

## 7. Base de données (Prisma)

### 7.1 Modèles principaux

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  displayName   String
  passwordHash  String
  avatarUrl     String?
  roles         UserRole @default(USER)
  createdAt     DateTime @default(now())
  
  // Relations
  items              Item[]
  exchangesRequested Exchange[] @relation("ExchangeRequester")
  exchangesResponded Exchange[] @relation("ExchangeResponder")
  refreshTokens      RefreshToken[]
  profile            UserProfile?
  preferences        Preference?
  threads            Thread[]
  posts              Post[]
  notificationTokens NotificationToken[]
  chatMessages       ChatMessage[]
  ban                Ban?
  adminLogs          AdminLog[]
}
```

#### Item
```prisma
model Item {
  id              String        @id @default(cuid())
  ownerId         String
  title           String
  description     String
  category        ItemCategory
  condition       ItemCondition
  status          ItemStatus    @default(AVAILABLE)
  tags            String[]
  aiSummary       String?
  aiRepairTip     String?
  popularityScore Int           @default(0)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  owner   User        @relation(fields: [ownerId], references: [id])
  photos  ItemPhoto[]
}
```

#### Exchange
```prisma
model Exchange {
  id                 String         @id @default(cuid())
  status             ExchangeStatus @default(PENDING)
  requesterId        String
  responderId        String
  offeredItemTitle   String
  requestedItemTitle String
  message            String?
  createdAt          DateTime       @default(now())
  completedAt        DateTime?
  
  // Relations
  requester User          @relation("ExchangeRequester", fields: [requesterId])
  responder User          @relation("ExchangeResponder", fields: [responderId])
  messages  ChatMessage[]
}
```

#### ChatMessage
```prisma
model ChatMessage {
  id         String   @id @default(cuid())
  exchangeId String
  senderId   String
  content    String
  images     String[]
  createdAt  DateTime @default(now())
  
  // Relations
  exchange Exchange @relation(fields: [exchangeId], references: [id])
  sender   User     @relation("MessageSender", fields: [senderId])
}
```

#### WeeklyTheme
```prisma
model WeeklyTheme {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  startOfWeek     DateTime
  impactText      String?
  photoUrl        String?
  photoUnsplashId String?
  targetCategories Json?
  isActive        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  suggestions SuggestedItem[]
}
```

#### SuggestedItem
```prisma
model SuggestedItem {
  id               String   @id @default(cuid())
  themeId          String
  name             String
  category         String
  country          String
  era              String?
  materials        String?
  ecoReason        String?
  repairDifficulty String?
  popularity       Int?
  tags             String[]
  photoRef         String?
  aiModel          String?
  aiPromptHash     String?
  aiRaw            Json?
  createdAt        DateTime @default(now())
  
  // Relations
  theme WeeklyTheme @relation(fields: [themeId], references: [id])
}
```

#### Report
```prisma
model Report {
  id               String   @id @default(cuid())
  type             String
  message          String
  targetUserId     String?
  targetItemId     String?
  targetExchangeId String?
  targetPostId     String?
  reporterId       String?
  resolved         Boolean  @default(false)
  resolvedAt       DateTime?
  resolvedBy       String?
  createdAt        DateTime @default(now())
}
```

#### Ban
```prisma
model Ban {
  id        String   @id @default(cuid())
  userId    String   @unique
  reason    String?
  createdAt DateTime @default(now())
  
  // Relations
  user User @relation(fields: [userId], references: [id])
}
```

#### AdminLog
```prisma
model AdminLog {
  id           String   @id @default(cuid())
  action       String
  resourceType String
  resourceId   String?
  adminId      String
  meta         Json?
  ip           String?
  userAgent    String?
  createdAt    DateTime @default(now())
  
  // Relations
  admin User @relation("AdminLogs", fields: [adminId], references: [id])
}
```

### 7.2 Enums

```prisma
enum UserRole {
  USER
  ADMIN
}

enum ExchangeStatus {
  PENDING
  ACCEPTED
  COMPLETED
  CANCELLED
  DECLINED
}

enum ItemCondition {
  NEW
  GOOD
  FAIR
  TO_REPAIR
}

enum ItemStatus {
  AVAILABLE
  PENDING
  TRADED
  ARCHIVED
}

enum ItemCategory {
  CLOTHING
  ELECTRONICS
  BOOKS
  HOME
  TOOLS
  TOYS
  SPORTS
  ART
  VINTAGE
  HANDCRAFT
  OTHER
}
```

### 7.3 Schéma relationnel

```
User (1) ──< (N) Item
User (1) ──< (N) Exchange (requester)
User (1) ──< (N) Exchange (responder)
User (1) ──< (N) ChatMessage
User (1) ──< (1) UserProfile
User (1) ──< (1) Preference
User (1) ──< (1) Ban
User (1) ──< (N) AdminLog
User (1) ──< (N) RefreshToken
User (1) ──< (N) Thread
User (1) ──< (N) Post
User (1) ──< (N) NotificationToken

Item (1) ──< (N) ItemPhoto
Exchange (1) ──< (N) ChatMessage
WeeklyTheme (1) ──< (N) SuggestedItem
Thread (1) ──< (N) Post
Post (1) ──< (N) Post (replies)
```

### 7.4 Index

- **User** : `email` (unique)
- **Item** : `ownerId`, `[category, condition, status]`, `popularityScore`
- **Exchange** : `requesterId`, `responderId`, `status`, `createdAt`
- **ChatMessage** : `exchangeId`, `senderId`, `createdAt`
- **WeeklyTheme** : `startOfWeek`, `isActive`
- **SuggestedItem** : `[themeId, country]`, `category`, `name`
- **Report** : `targetUserId`, `targetItemId`, `resolved`, `createdAt`
- **AdminLog** : `adminId`, `[resourceType, resourceId]`, `createdAt`

---

## 8. APIs Backend (liste complète des endpoints)

### 8.1 Auth User

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| POST | `/api/v1/auth/register` | Inscription | Public |
| POST | `/api/v1/auth/login` | Connexion | Public (rate limit: 5/min) |
| POST | `/api/v1/auth/refresh` | Rafraîchir token | Public (refresh token) |
| POST | `/api/v1/auth/logout` | Déconnexion | Auth (refresh token) |

### 8.2 Auth Admin

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| POST | `/api/v1/auth/admin/login` | Connexion admin | Public (rate limit: 5/min) |

### 8.3 Users

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/users/me` | Profil utilisateur | Auth |
| PATCH | `/api/v1/users/me` | Modifier profil | Auth |
| DELETE | `/api/v1/users/me` | Supprimer compte | Auth |

### 8.4 Items

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| POST | `/api/v1/items` | Créer un objet | Auth |
| GET | `/api/v1/items` | Lister les objets | Public |
| GET | `/api/v1/items/:id` | Détails d'un objet | Public |
| PATCH | `/api/v1/items/:id` | Modifier un objet | Auth (propriétaire) |
| DELETE | `/api/v1/items/:id` | Supprimer un objet | Auth (propriétaire) |
| PATCH | `/api/v1/items/:id/status` | Modifier statut | Auth (propriétaire) |
| GET | `/api/v1/items/user/me` | Mes objets | Auth |
| POST | `/api/v1/items/uploads/signature` | Signature Cloudinary | Auth |
| POST | `/api/v1/items/:id/photos` | Attacher photos | Auth (propriétaire) |
| DELETE | `/api/v1/items/photos/:photoId` | Supprimer photo | Auth (propriétaire) |

### 8.5 Exchanges

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| POST | `/api/v1/exchanges` | Créer un échange | Auth |
| GET | `/api/v1/exchanges/me` | Mes échanges | Auth |
| GET | `/api/v1/exchanges/:id` | Détails échange | Auth (participant) |
| PATCH | `/api/v1/exchanges/:id/status` | Modifier statut | Auth (participant) |

### 8.6 Chat (WebSocket)

| Événement | Description | Permissions |
|-----------|-------------|-------------|
| `join` | Rejoindre room échange | Auth (participant) |
| `leave` | Quitter room | Auth |
| `message:new` | Envoyer message | Auth (participant) |

### 8.7 Matching

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/matching/recommendations` | Recommandations | Auth |
| POST | `/api/v1/matching/preferences` | Mettre à jour préférences | Auth |
| GET | `/api/v1/matching/preferences` | Mes préférences | Auth |

### 8.8 Reports

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| POST | `/api/v1/reports` | Signaler | Public (optionnel auth) |

### 8.9 Themes

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/themes/active` | Thème actif | Public |
| GET | `/api/v1/themes` | Liste thèmes | Public |
| GET | `/api/v1/themes/calendar` | Calendrier thèmes | Public |
| GET | `/api/v1/themes/calendar/month` | Calendrier mensuel | Public |
| GET | `/api/v1/themes/:id` | Détails thème | Public |
| POST | `/api/v1/themes` | Créer thème | Admin |
| PATCH | `/api/v1/themes/:id` | Modifier thème | Admin |
| PATCH | `/api/v1/themes/:id/activate` | Activer thème | Admin |
| DELETE | `/api/v1/themes/:id` | Supprimer thème | Admin |

### 8.10 Suggestions

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/themes/:id/suggestions` | Suggestions d'un thème | Public |
| GET | `/api/v1/themes/:id/suggestions/stats` | Statistiques suggestions | Public |

### 8.11 Eco-content

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/eco` | Liste contenu | Public |
| GET | `/api/v1/eco/stats` | Statistiques | Public |
| GET | `/api/v1/eco/tags` | Tags populaires | Public |
| GET | `/api/v1/eco/:id` | Détails contenu | Public |
| POST | `/api/v1/eco` | Créer contenu | Admin |
| PATCH | `/api/v1/eco/:id` | Modifier contenu | Admin |
| DELETE | `/api/v1/eco/:id` | Supprimer contenu | Admin |
| POST | `/api/v1/eco/:id/enrich` | Enrichir avec IA | Admin |

### 8.12 Notifications

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| POST | `/api/v1/notifications/register` | Enregistrer token | Auth |
| POST | `/api/v1/notifications/test` | Tester notification | Auth |

### 8.13 Community

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/threads` | Liste threads | Public |
| GET | `/api/v1/threads/:id` | Détails thread | Public |
| POST | `/api/v1/threads` | Créer thread | Auth |
| DELETE | `/api/v1/threads/:id` | Supprimer thread | Auth (auteur) |
| GET | `/api/v1/threads/:threadId/posts` | Posts d'un thread | Public |
| GET | `/api/v1/threads/:threadId/posts/:id` | Détails post | Public |
| POST | `/api/v1/threads/:threadId/posts` | Créer post | Auth |
| PATCH | `/api/v1/threads/:threadId/posts/:id` | Modifier post | Auth (auteur) |
| DELETE | `/api/v1/threads/:threadId/posts/:id` | Supprimer post | Auth (auteur) |

### 8.14 Admin (chemin secret : `{ADMIN_BASE_PATH}`)

| Méthode | Chemin | Description | Permissions |
|---------|--------|-------------|-------------|
| GET | `/api/v1/{ADMIN_BASE_PATH}/dashboard` | Statistiques | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/users` | Liste utilisateurs | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/users/:id` | Détails utilisateur | Admin |
| PATCH | `/api/v1/{ADMIN_BASE_PATH}/users/:id/ban` | Bannir utilisateur | Admin |
| PATCH | `/api/v1/{ADMIN_BASE_PATH}/users/:id/unban` | Débannir utilisateur | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/items` | Liste objets | Admin |
| PATCH | `/api/v1/{ADMIN_BASE_PATH}/items/:id/archive` | Archiver objet | Admin |
| DELETE | `/api/v1/{ADMIN_BASE_PATH}/items/:id` | Supprimer objet | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/reports` | Liste signalements | Admin |
| PATCH | `/api/v1/{ADMIN_BASE_PATH}/reports/:id/resolve` | Résoudre signalement | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/themes` | Liste thèmes | Admin |
| POST | `/api/v1/{ADMIN_BASE_PATH}/themes/generate` | Générer thème IA | Admin |
| POST | `/api/v1/{ADMIN_BASE_PATH}/themes/generate-monthly` | Générer 4 thèmes mensuels | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/themes/:id` | Détails thème | Admin |
| POST | `/api/v1/{ADMIN_BASE_PATH}/themes` | Créer thème | Admin |
| PATCH | `/api/v1/{ADMIN_BASE_PATH}/themes/:id` | Modifier thème | Admin |
| PATCH | `/api/v1/{ADMIN_BASE_PATH}/themes/:id/activate` | Activer thème | Admin |
| DELETE | `/api/v1/{ADMIN_BASE_PATH}/themes/:id` | Supprimer thème | Admin |
| POST | `/api/v1/{ADMIN_BASE_PATH}/themes/:id/suggestions` | Générer suggestions | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/themes/:id/suggestions` | Liste suggestions | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/themes/:id/suggestions/stats` | Stats suggestions | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/eco` | Liste contenu éco | Admin |
| GET | `/api/v1/{ADMIN_BASE_PATH}/logs` | Logs admin | Admin |

---

## 9. Architecture des dossiers

### 9.1 Frontend

```
apps/frontend/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── layout.tsx         # Layout racine
│   │   ├── page.tsx           # Page d'accueil
│   │   ├── (admin)/           # Routes admin (chemin secret)
│   │   │   └── [adminSlug]/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/
│   │   │       ├── users/
│   │   │       ├── items/
│   │   │       ├── exchanges/
│   │   │       ├── reports/
│   │   │       ├── themes/
│   │   │       ├── eco/
│   │   │       └── logs/
│   │   ├── login/             # Authentification
│   │   ├── register/
│   │   ├── explore/           # Exploration objets
│   │   ├── item/              # Gestion objets
│   │   │   ├── [id]/
│   │   │   └── new/
│   │   ├── exchange/          # Échanges
│   │   │   └── [id]/
│   │   ├── exchanges/          # Liste échanges
│   │   ├── themes/             # Thèmes hebdomadaires
│   │   ├── discover/          # Découverte éco
│   │   ├── matching/          # Matching intelligent
│   │   ├── community/         # Forums
│   │   ├── thread/            # Threads
│   │   │   └── [id]/
│   │   ├── profile/           # Profil utilisateur
│   │   └── notifications/      # Notifications
│   ├── components/            # Composants React
│   │   ├── ui/               # Composants UI (shadcn/ui)
│   │   ├── layout/           # Layout (Navbar, Footer)
│   │   ├── forms/            # Formulaires
│   │   ├── items/            # Composants items
│   │   ├── exchanges/        # Composants échanges
│   │   ├── themes/           # Composants thèmes
│   │   ├── chat/            # Composants chat
│   │   ├── admin/           # Composants admin
│   │   └── community/       # Composants communauté
│   ├── lib/                 # Utilitaires
│   │   ├── api.ts          # Client API (Axios)
│   │   ├── admin.api.ts    # Client API admin
│   │   ├── utils.ts        # Fonctions utilitaires
│   │   └── validations.ts  # Schémas Zod
│   ├── hooks/              # Hooks React personnalisés
│   ├── store/              # Zustand stores
│   │   ├── auth.ts
│   │   └── notifications.ts
│   ├── types/              # Types TypeScript
│   │   └── index.ts
│   └── styles/             # Styles globaux
│       └── globals.css
├── public/                 # Assets statiques
│   ├── manifest.webmanifest
│   ├── sw.js              # Service Worker
│   ├── firebase-messaging-sw.js
│   └── icons/             # Icônes PWA
├── next.config.js         # Configuration Next.js + PWA
├── tailwind.config.js     # Configuration Tailwind
└── package.json
```

### 9.2 Backend

```
apps/backend/
├── src/
│   ├── main.ts            # Point d'entrée
│   ├── app.module.ts      # Module racine
│   ├── common/            # Utilitaires partagés
│   │   ├── prisma/       # PrismaService
│   │   ├── dtos/         # DTOs partagés
│   │   ├── guards/       # Guards (JWT, Admin)
│   │   ├── interceptors/ # Intercepteurs (Logging)
│   │   ├── pipes/        # Pipes (Validation)
│   │   └── utils/        # Utilitaires
│   ├── config/           # Configurations
│   │   ├── app.config.ts
│   │   ├── security.config.ts
│   │   ├── prisma.config.ts
│   │   ├── ai.config.ts
│   │   ├── cloudinary.config.ts
│   │   └── schedule.config.ts
│   └── modules/          # Modules métier
│       ├── auth/        # Authentification
│       │   ├── auth.controller.ts
│       │   ├── auth-admin.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth-admin.service.ts
│       │   ├── strategies/
│       │   └── dtos/
│       ├── users/        # Utilisateurs
│       ├── profiles/    # Profils
│       ├── items/        # Objets
│       │   ├── items.controller.ts
│       │   ├── items.service.ts
│       │   ├── uploads/
│       │   └── dtos/
│       ├── exchanges/    # Échanges
│       │   ├── exchanges.controller.ts
│       │   ├── exchanges.gateway.ts (WebSocket)
│       │   ├── exchanges.service.ts
│       │   └── dtos/
│       ├── themes/       # Thèmes
│       ├── suggestions/  # Suggestions
│       ├── matching/    # Matching
│       ├── eco/         # Contenu éco
│       ├── community/   # Communauté
│       ├── notifications/ # Notifications
│       ├── admin/       # Administration
│       │   ├── admin.controller.ts
│       │   ├── admin.middleware.ts
│       │   ├── admin.service.ts
│       │   └── dtos/
│       ├── scheduler/   # Tâches planifiées
│       ├── ai/          # Intégration Gemini
│       └── unsplash/    # Intégration Unsplash
├── prisma/
│   ├── schema.prisma    # Schéma base de données
│   ├── migrations/      # Migrations
│   └── seed.ts          # Seed data
├── test/               # Tests
│   ├── unit/
│   └── *.e2e.spec.ts
├── scripts/            # Scripts utilitaires
└── package.json
```

---

## 10. Sécurité du projet

### 10.1 Chemin admin secret

- **Variable** : `ADMIN_BASE_PATH` (ex: `greenroom-core-qlf18scha7`)
- **Middleware** : `AdminMiddleware` vérifie le chemin avant traitement
- **Protection** : Logs des tentatives d'accès non autorisées
- **Isolation** : Routes complètement séparées des routes publiques

### 10.2 Auth admin séparée

- **Secret distinct** : `ADMIN_JWT_SECRET` (différent de `JWT_ACCESS_SECRET`)
- **Stratégie dédiée** : `AdminJwtStrategy` (Passport)
- **Guard dédié** : `AdminJwtGuard` + `AdminRoleGuard`
- **Durée token** : 24h (vs 15min pour users)
- **Vérification rôle** : Seuls les `roles: ADMIN` peuvent se connecter

### 10.3 JWT user vs JWT admin

| Aspect | User JWT | Admin JWT |
|--------|----------|-----------|
| Secret | `JWT_ACCESS_SECRET` | `ADMIN_JWT_SECRET` |
| Durée | 15 minutes | 24 heures |
| Stratégie | `JwtAccessStrategy` | `AdminJwtStrategy` |
| Guard | `JwtAccessGuard` | `AdminJwtGuard` |
| Vérification | User valide | User valide + `roles: ADMIN` |

### 10.4 Rate limiting

- **Default** : 100 requêtes/minute par IP
- **Login** : 5 tentatives/minute par IP
- **Recommendations** : 10 requêtes/minute par IP
- **Implémentation** : `ThrottlerModule` (NestJS)

### 10.5 Validation Zod + DTO

- **Validation côté client** : Schémas Zod dans les formulaires
- **Validation côté serveur** : DTOs avec `ValidationPipe` (Zod)
- **Sanitisation** : Nettoyage automatique des entrées
- **Protection injection** : Prisma ORM (paramètres préparés)

### 10.6 Stockage images sécurisé (Cloudinary)

- **Upload direct** : Signature Cloudinary côté serveur
- **Validation** : Taille max (3MB), nombre max (6 photos)
- **Compression** : Automatique côté Cloudinary
- **Formats** : WebP, optimisation automatique

### 10.7 Permissions pour chaque module

- **Guards** : `JwtAccessGuard` (auth), `AdminJwtGuard` (admin)
- **Vérifications métier** : Propriétaire, participant échange
- **Isolation données** : Users ne voient que leurs données
- **Admin** : Accès complet avec logs

### 10.8 Logs admin & audit

- **Modèle** : `AdminLog` (Prisma)
- **Champs** : action, resourceType, resourceId, adminId, IP, userAgent, meta
- **Indexation** : Par admin, ressource, date
- **Rétention** : Illimitée (à configurer selon besoins)

### 10.9 Protection WS (chat)

- **Validation données** : Avant sauvegarde
- **Vérification participation** : Seuls les participants peuvent envoyer messages
- **Isolation rooms** : Chaque échange = room séparée
- **CORS** : Configuration stricte

### 10.10 Headers de sécurité (Helmet)

- **Content Security Policy** : Restrictions strictes
- **XSS Protection** : Headers anti-XSS
- **Frame Options** : Protection clickjacking
- **HSTS** : HTTPS strict (si configuré)

---

## 11. PWA

### 11.1 Manifest.json

```json
{
  "name": "SecondLife Exchange",
  "short_name": "SecondLife",
  "description": "Plateforme d'échange d'objets avec suggestions IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "categories": ["shopping", "lifestyle", "social"],
  "lang": "fr"
}
```

### 11.2 Service Worker

- **Génération** : `next-pwa` (automatique)
- **Stratégies cache** :
  - **CacheFirst** : Fonts, audio, vidéo
  - **StaleWhileRevalidate** : Images, CSS, JS
  - **NetworkFirst** : API calls (fallback cache si timeout)
- **Offline fallback** : Page d'erreur hors ligne
- **Skip waiting** : Activation immédiate des mises à jour

### 11.3 Notifications

- **Firebase Cloud Messaging** : Intégration (placeholder)
- **Service Worker** : `firebase-messaging-sw.js`
- **Inscription** : `POST /api/v1/notifications/register`
- **Types** : Messages échange, changements statut, matching

### 11.4 Icônes

- **Génération** : Automatique via `next-pwa`
- **Formats** : PNG, multiples tailles
- **Manifest** : Référence dans `manifest.webmanifest`

### 11.5 Offline fallback

- **Page d'erreur** : Affichage si hors ligne
- **Cache API** : Stratégie NetworkFirst avec fallback
- **Assets statiques** : Cache agressif (fonts, images)

---

## 12. Déploiement & Serveur

### 12.1 VPS Hostinger / Node 20

- **Node.js** : Version 20 LTS
- **PM2** : Gestion des processus
- **Nginx** : Reverse proxy
- **SSL** : Certificats Let's Encrypt

### 12.2 Procfile / PM2

#### Procfile (si Heroku)
```
web: node apps/backend/dist/main.js
```

#### PM2 ecosystem
```javascript
{
  apps: [
    {
      name: 'secondlife-backend',
      script: 'apps/backend/dist/main.js',
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'secondlife-frontend',
      script: 'apps/frontend/server.js',
      instances: 2,
      exec_mode: 'cluster'
    }
  ]
}
```

### 12.3 Reverse proxy NGINX

```nginx
# Backend API
location /api/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Frontend Next.js
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 12.4 SSL

- **Certificats** : Let's Encrypt (gratuit)
- **Renouvellement** : Automatique via certbot
- **HTTPS** : Obligatoire en production

### 12.5 Variables d'environnement

#### Backend (.env)
```env
NODE_ENV=production
API_PORT=4000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_JWT_SECRET=...
ADMIN_BASE_PATH=greenroom-core-qlf18scha7
AI_GEMINI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.secondlife.com
NEXT_PUBLIC_ADMIN_BASE_PATH=greenroom-core-qlf18scha7
```

### 12.6 Build output Next.js + NestJS

#### Backend
```bash
cd apps/backend
npm run build
# Output: dist/
```

#### Frontend
```bash
cd apps/frontend
npm run build
# Output: .next/
```

### 12.7 Séparation front/back

- **Backend** : Port 4000 (API REST + WebSocket)
- **Frontend** : Port 3000 (Next.js SSR)
- **NGINX** : Reverse proxy unifie les deux

### 12.8 Scripts build & start

#### Package.json racine
```json
{
  "scripts": {
    "build": "pnpm -C apps/backend build && pnpm -C apps/frontend build",
    "start:backend": "pnpm -C apps/backend start:prod",
    "start:frontend": "pnpm -C apps/frontend start"
  }
}
```

---

## 13. Tests

### 13.1 Tests unitaires backend (Jest)

#### Structure
```
apps/backend/test/unit/
├── auth.service.spec.ts
├── items.service.spec.ts
└── exchanges.service.spec.ts
```

#### Exécution
```bash
pnpm -C apps/backend test
pnpm -C apps/backend test:cov  # Avec couverture
```

### 13.2 Tests API

#### Structure
```
apps/backend/test/
├── auth.e2e.spec.ts
├── items.e2e.spec.ts
└── health.e2e-spec.ts
```

#### Exécution
```bash
pnpm -C apps/backend test:e2e
```

### 13.3 Tests UI (si présents)

#### Structure
```
apps/frontend/src/components/__tests__/
```

#### Exécution
```bash
pnpm -C apps/frontend test
```

### 13.4 Tests E2E (si présents)

#### Outils
- **Playwright** : Tests end-to-end (à implémenter)
- **Cypress** : Alternative (à implémenter)

---

## 14. Limitations techniques

### 14.1 Performance

- **Base de données** : Pas de cache Redis implémenté (prévu)
- **Images** : Pas de CDN configuré (Cloudinary peut servir)
- **WebSocket** : Pas de scaling horizontal (nécessite Redis adapter)

### 14.2 Fonctionnalités

- **Notifications push** : Intégration Firebase FCM (placeholder)
- **Géolocalisation** : Pas implémentée (prévue)
- **Système de notation** : Pas implémenté (prévu)
- **Recherche avancée** : Recherche full-text basique (pas d'Elasticsearch)

### 14.3 Sécurité

- **2FA** : Pas implémenté (prévu)
- **OAuth** : Pas implémenté (prévu)
- **Rate limiting avancé** : Basique par IP (pas de sliding window)

### 14.4 Scalabilité

- **Monolithique** : Architecture monolithique (pas de microservices)
- **Base de données** : Pas de réplication (prévue)
- **Cache distribué** : Pas de Redis cluster (prévu)

---

## 15. Améliorations futures

### 15.1 Court terme

- **Cache Redis** : Mise en cache des requêtes fréquentes
- **Notifications push** : Implémentation complète Firebase FCM
- **Système de notation** : Évaluation des utilisateurs après échange
- **Géolocalisation** : Recherche par proximité
- **Recherche avancée** : Elasticsearch pour recherche full-text

### 15.2 Moyen terme

- **2FA** : Authentification à deux facteurs
- **OAuth** : Connexion via Google, Facebook, etc.
- **CDN** : Distribution globale des assets
- **Monitoring** : Intégration Sentry, Datadog
- **Analytics** : Dashboard analytics avancé

### 15.3 Long terme

- **Microservices** : Séparation des services (auth, items, exchanges)
- **Réplication DB** : Réplication PostgreSQL en lecture
- **Kubernetes** : Orchestration de conteneurs
- **GraphQL** : Alternative/complément à REST
- **Mobile apps** : Applications natives iOS/Android

---

## 16. Conclusion

SecondLife Exchange est une plateforme complète et moderne d'échange d'objets d'occasion, intégrant l'intelligence artificielle pour enrichir l'expérience utilisateur. L'architecture modulaire, la sécurité robuste, et les fonctionnalités PWA en font une solution prête pour la production, avec une base solide pour les évolutions futures.

### Points forts

- **Architecture modulaire** : Séparation claire frontend/backend
- **Sécurité** : Authentification robuste, validation stricte, logs admin
- **IA intégrée** : Suggestions automatiques, analyse d'objets
- **PWA** : Application installable, fonctionnelle hors ligne
- **Temps réel** : Chat WebSocket intégré
- **Admin complet** : Tableau de bord secret avec toutes les fonctionnalités

### Technologies modernes

- Next.js 15, NestJS 10, TypeScript strict
- Prisma ORM, PostgreSQL
- Google Gemini 1.5 Pro
- Socket.io, Cloudinary
- PWA avec Service Worker

### Prêt pour la production

Le projet est structuré, documenté, et prêt pour un déploiement en production avec les bonnes pratiques de sécurité, performance, et maintenabilité.

---

**Document généré le** : 2025-01-24  
**Version** : 1.0.0  
**Auteur** : Shadi Ibrahim


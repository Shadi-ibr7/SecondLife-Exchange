# Module Community

Ce module implémente un système de discussions communautaires en temps réel pour SecondLife Exchange.

## Fonctionnalités

### Backend (NestJS + Prisma + Socket.io)

#### Modèles Prisma
- **Thread** : Discussions avec scope (THEME, CATEGORY, ITEM, GENERAL)
- **Post** : Messages avec système de réponses hiérarchiques

#### Endpoints API
```
GET  /threads?scope=&ref=&q=&page=&limit=  // Liste des threads (public)
POST /threads                              // Créer un thread (auth)
GET  /threads/:id                          // Détails d'un thread (public)
DELETE /threads/:id                        // Supprimer un thread (auth, owner/admin)

GET  /threads/:id/posts?page=&limit=       // Liste des posts (public)
POST /threads/:id/posts                    // Créer un post (auth)
PATCH /threads/:id/posts/:postId           // Modifier un post (auth, owner/admin)
DELETE /threads/:id/posts/:postId          // Supprimer un post (auth, owner/admin)
```

#### Socket.io Gateway
Événements temps réel :
- `join-thread` / `leave-thread`
- `post:new` / `post:update` / `post:delete`
- `typing:start` / `typing:stop`
- `user-joined` / `user-left`

### Frontend (Next.js + React Query + Socket.io)

#### Pages
- `/community` : Liste des discussions avec filtres
- `/thread/[id]` : Discussion individuelle avec posts temps réel

#### Composants
- `ThreadCard` : Affichage des discussions
- `ThreadList` : Grille de discussions
- `PostCard` : Affichage des messages
- `PostList` : Liste des messages

## Migration Prisma

Pour appliquer la migration et créer les tables dans la base de données :

```bash
# Démarrer la base de données
docker-compose up -d postgres

# Appliquer la migration
cd apps/backend
npx prisma migrate deploy

# Ou en mode développement
npx prisma migrate dev
```

La migration créera les tables suivantes :
- `threads` : Stockage des discussions
- `posts` : Stockage des messages

## Tests

### Tests Unitaires Backend

```bash
cd apps/backend
npm test -- threads.service.spec
npm test -- posts.service.spec
```

Tests couverts :
- ✅ Création de threads avec premier post
- ✅ Pagination et filtres
- ✅ Permissions (auteur/admin)
- ✅ Validation des données
- ✅ Réponses hiérarchiques

### Tests E2E Backend

```bash
cd apps/backend
npm test -- community.e2e-spec
```

Tests couverts :
- ✅ Endpoints CRUD pour threads
- ✅ Endpoints CRUD pour posts
- ✅ Authentification et autorisation
- ✅ Validation des entrées

### Tests Frontend

```bash
cd apps/frontend
npm test -- community
```

Tests couverts :
- ✅ Rendu des composants ThreadCard et PostCard
- ✅ API client (requêtes HTTP)
- ✅ Gestion des états de chargement
- ✅ Interactions utilisateur

### Couverture des tests

```bash
# Backend
cd apps/backend
npm run test:cov

# Frontend
cd apps/frontend
npm run test:coverage
```

## Sécurité

- ✅ Authentification JWT pour les actions d'écriture
- ✅ Autorisation : seul l'auteur ou admin peut modifier/supprimer
- ✅ Sanitisation du contenu (protection XSS)
- ✅ Rate limiting sur les créations
- ✅ Validation stricte des entrées

## Performance

- ✅ Pagination pour toutes les listes
- ✅ Indexes sur les colonnes fréquemment requêtées
- ✅ Caching côté client avec React Query
- ✅ Optimistic updates pour l'UX

## Utilisation

### Créer une discussion

```typescript
const thread = await communityApi.createThread({
  scope: 'GENERAL',
  title: 'Ma discussion',
  contentFirst: 'Premier message...',
});
```

### Poster un message

```typescript
const post = await communityApi.createPost(threadId, {
  content: 'Mon message...',
});
```

### Répondre à un message

```typescript
const reply = await communityApi.createPost(threadId, {
  content: 'Ma réponse...',
  repliesTo: parentPostId,
});
```

## Temps Réel

Pour utiliser les fonctionnalités temps réel, se connecter au namespace `/community` :

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000/community');

// Rejoindre une discussion
socket.emit('join-thread', { threadId, userId });

// Écouter les nouveaux messages
socket.on('post:new', ({ threadId, post }) => {
  // Mettre à jour l'UI
});

// Indiquer qu'on tape
socket.emit('typing:start', { threadId, userId, userName });
```

## DoD (Definition of Done)

- ✅ Modèles Prisma créés et migrés
- ✅ Endpoints CRUD fonctionnels
- ✅ Socket.io intégré pour le temps réel
- ✅ Tests unitaires et E2E écrits
- ✅ Frontend compilé sans erreur
- ✅ Sécurité et permissions implémentées
- ✅ Documentation complète


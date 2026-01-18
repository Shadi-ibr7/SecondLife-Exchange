# 🔔 Notifications System Setup

Ce document explique comment configurer et tester le système de notifications In-App + Push Web de SecondLife Exchange.

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Variables d'environnement](#variables-denvironnement)
3. [Migration de la base de données](#migration-de-la-base-de-données)
4. [Test des endpoints (curl)](#test-des-endpoints-curl)
5. [Test via l'interface](#test-via-linterface)
6. [Déploiement Production](#déploiement-production)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Notifications In-App (DB)

```
┌─────────────────────────────────────────────────────────────┐
│                    Notifications In-App                      │
├─────────────────────────────────────────────────────────────┤
│  Table: notifications                                        │
│  ├─ id (cuid)                                               │
│  ├─ userId (FK → users.id)                                  │
│  ├─ type (enum: MESSAGE, EXCHANGE_REQUEST, etc.)            │
│  ├─ title (string)                                          │
│  ├─ body (string)                                           │
│  ├─ data (JSON: {exchangeId, itemId, url, etc.})           │
│  ├─ readAt (DateTime? - null = non lu)                     │
│  └─ createdAt (DateTime)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Push Notifications (WebPush)

```
┌─────────────────────────────────────────────────────────────┐
│                    Push Notifications                        │
├─────────────────────────────────────────────────────────────┤
│  Table: notification_tokens                                  │
│  ├─ id (cuid)                                               │
│  ├─ userId (FK → users.id)                                  │
│  ├─ provider ('webpush' | 'fcm')                           │
│  ├─ endpoint (URL du push service)                         │
│  ├─ p256dh (clé publique)                                  │
│  ├─ auth (clé d'authentification)                          │
│  └─ userAgent (optionnel)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/notifications` | Liste paginée des notifications |
| `GET` | `/api/v1/notifications/unread-count` | Nombre de non lues |
| `PATCH` | `/api/v1/notifications/:id/read` | Marquer comme lue |
| `PATCH` | `/api/v1/notifications/read-all` | Tout marquer comme lu |
| `POST` | `/api/v1/notifications/push/subscribe` | S'abonner aux push |
| `POST` | `/api/v1/notifications/push/unsubscribe` | Se désabonner |
| `POST` | `/api/v1/notifications/test` | Test (admin only) |

---

## 🔐 Variables d'environnement

### Backend (.env)

```bash
# VAPID Keys pour Web Push (générer avec: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:contact@secondlife-exchange.com
```

### Frontend (Vercel ou .env.local)

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
# Note: Même clé publique que le backend
```

### Générer les clés VAPID

```bash
# Installer web-push si pas encore fait
npm install -g web-push

# Générer les clés
npx web-push generate-vapid-keys

# Output exemple:
# Public Key: BNxk...
# Private Key: dGVz...
```

---

## 🗄️ Migration de la base de données

### En local (développement)

```bash
cd apps/backend

# Appliquer la migration
npx prisma migrate dev

# Ou si la DB est déjà baseline
npx prisma db push

# Regénérer le client
npx prisma generate
```

### En production (VPS)

```bash
cd /var/www/secondlife-api

# Appliquer les migrations
npx prisma migrate deploy

# Si erreur, appliquer manuellement le SQL:
psql -U secondlife -d secondlife -f prisma/migrations/20260114000000_add_notifications_model/migration.sql

# Puis marquer comme appliquée
npx prisma migrate resolve --applied 20260114000000_add_notifications_model
```

### Script SQL manuel (si besoin)

```sql
-- Voir le fichier:
-- prisma/migrations/20260114000000_add_notifications_model/migration.sql
```

---

## 🧪 Test des endpoints (curl)

### 1. Obtenir un token JWT

```bash
# Login pour obtenir le token
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Sauvegarder le token
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### 2. Créer une notification de test (admin)

```bash
curl -X POST http://localhost:4000/api/v1/notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Ceci est un test depuis curl"
  }'
```

### 3. Lister les notifications

```bash
# Toutes les notifications
curl -X GET "http://localhost:4000/api/v1/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Non lues uniquement
curl -X GET "http://localhost:4000/api/v1/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Compter les non lues

```bash
curl -X GET http://localhost:4000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"

# Réponse attendue:
# {"count": 5}
```

### 5. Marquer comme lue

```bash
# Une notification spécifique
curl -X PATCH http://localhost:4000/api/v1/notifications/clxxxxx/read \
  -H "Authorization: Bearer $TOKEN"

# Toutes
curl -X PATCH http://localhost:4000/api/v1/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Test de sécurité (user A ne peut pas lire user B)

```bash
# Login avec user B
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "userb@example.com", "password": "password123"}'

export TOKEN_B="..."

# Tenter de marquer la notification de user A comme lue
curl -X PATCH http://localhost:4000/api/v1/notifications/NOTIF_ID_USER_A/read \
  -H "Authorization: Bearer $TOKEN_B"

# Réponse attendue: 404 Not Found
# {"statusCode": 404, "message": "Notification non trouvée"}
```

### 7. S'abonner aux Push (WebPush)

```bash
curl -X POST http://localhost:4000/api/v1/notifications/push/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
    "keys": {
      "p256dh": "BNxk...",
      "auth": "dGVz..."
    },
    "userAgent": "Chrome/120"
  }'
```

---

## 🖥️ Test via l'interface

### 1. Vérifier le badge dans la navbar

1. Se connecter à l'application
2. Vérifier que l'icône 🔔 affiche un badge avec le nombre de non lues
3. Le badge doit se mettre à jour automatiquement (polling toutes les 30s)

### 2. Page /notifications

1. Cliquer sur l'icône 🔔 dans la navbar
2. Vérifier la liste des notifications avec :
   - Titre et description
   - Indicateur de non lu (point ou fond coloré)
   - Date de création
3. Cliquer sur une notification pour la marquer comme lue
4. Utiliser le bouton "Tout marquer comme lu"

### 3. Tester les triggers

| Action | Notification attendue |
|--------|----------------------|
| Envoyer un message dans un échange | Notif au destinataire |
| Créer une demande d'échange | Notif au propriétaire de l'objet |
| Accepter/Refuser un échange | Notif à l'autre partie |
| Ban un utilisateur (admin) | Notif à l'utilisateur banni |
| Publier un contenu éco (admin) | Notif aux admins |

---

## 🚀 Déploiement Production

### 1. Vercel (Frontend)

```bash
# Ajouter les variables d'environnement dans Vercel Dashboard
# Settings → Environment Variables

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxk...
NEXT_PUBLIC_API_URL=https://api.secondlife-exchange.com
```

### 2. VPS Hostinger (Backend)

```bash
# SSH sur le VPS
ssh user@your-vps.com

# Aller dans le dossier du backend
cd /var/www/secondlife-api

# Ajouter les variables VAPID dans .env
echo "VAPID_PUBLIC_KEY=BNxk..." >> .env
echo "VAPID_PRIVATE_KEY=dGVz..." >> .env
echo "VAPID_SUBJECT=mailto:contact@secondlife-exchange.com" >> .env

# Installer web-push
npm install web-push

# Appliquer les migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Redémarrer PM2
pm2 restart secondlife-api
```

### 3. Nginx (CORS)

Vérifier que les routes notifications sont accessibles :

```nginx
# /etc/nginx/sites-available/secondlife-api

location /api/v1/notifications {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # CORS headers
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials true always;
}
```

---

## 🔧 Troubleshooting

### Erreur: "VAPID keys not configured"

```bash
# Vérifier que les clés sont dans .env
cat .env | grep VAPID

# Régénérer si nécessaire
npx web-push generate-vapid-keys
```

### Erreur: "Notification non trouvée"

- Vérifier que l'utilisateur a le droit de voir cette notification
- Les notifications sont filtrées par `userId` du token JWT
- Un utilisateur ne peut JAMAIS voir les notifications d'un autre

### Push non reçu

1. Vérifier la console du navigateur pour les erreurs Service Worker
2. Vérifier que le site est en HTTPS (obligatoire pour Push)
3. Vérifier les permissions du navigateur
4. Tester avec `Notification.permission` dans la console

```javascript
// Dans la console du navigateur
console.log(Notification.permission); // "granted", "denied", ou "default"
```

### Badge non mis à jour

1. Vérifier que le polling est actif (toutes les 30s quand la page est visible)
2. Vérifier l'onglet Network pour les requêtes `/unread-count`
3. Vérifier le store Zustand : `useNotificationsStore.getState()`

---

## 📱 Service Worker (PWA)

### Fichiers créés

| Fichier | Rôle |
|---------|------|
| `public/sw-push.js` | Service Worker pour les push notifications |
| `src/hooks/usePushNotifications.ts` | Hook React pour s'abonner/désabonner |

### Comment ça marche

1. **Activation** : L'utilisateur clique sur "Activer les notifications" dans `/notifications`
2. **Permission** : Le navigateur demande la permission
3. **Subscription** : Le SW s'abonne au Push Manager avec la clé VAPID
4. **Enregistrement** : La subscription est envoyée au backend (`/push/subscribe`)
5. **Stockage** : Le backend stocke les clés dans `notification_tokens`

### Événements push

```javascript
// sw-push.js écoute l'événement 'push'
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    data: data.data // Contient l'URL de navigation
  });
});

// Au clic, ouvre l'URL appropriée
self.addEventListener('notificationclick', (event) => {
  clients.openWindow(event.notification.data.url);
});
```

### Test local

1. Lancer le frontend en HTTPS (requis pour les push) :
   ```bash
   # Utiliser ngrok ou un certificat local
   ngrok http 3000
   ```

2. Aller sur `/notifications` et cliquer "Activer"
3. Utiliser le bouton "Envoyer un test" pour tester localement

---

## 📊 Checklist de validation

- [ ] Migration DB appliquée
- [ ] Variables VAPID configurées (backend + frontend)
- [ ] Endpoint `/notifications` retourne une liste
- [ ] Endpoint `/unread-count` retourne un compteur
- [ ] `PATCH /:id/read` fonctionne
- [ ] `PATCH /read-all` fonctionne
- [ ] User A ne peut PAS voir les notifs de User B
- [ ] Badge dans la navbar se met à jour
- [ ] Page /notifications affiche la liste
- [ ] Push subscribe fonctionne (token enregistré en DB)
- [ ] Push notifications reçues sur le navigateur
- [ ] Service Worker actif sur Vercel

---

*Dernière mise à jour: 2026-01-14*

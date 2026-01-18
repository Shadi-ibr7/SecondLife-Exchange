# 🔐 Guide de Sécurité - SecondLife-Exchange Backend

Ce document décrit le système de sécurité du backend, incluant l'authentification par cookies httpOnly et le RBAC.

## 📋 Table des matières

1. [Variables d'environnement](#variables-denvironnement)
2. [Health Checks](#health-checks)
3. [Audit des secrets frontend](#audit-des-secrets-frontend)
4. [Authentification Cookies httpOnly](#authentification-cookies-httponly)
5. [CORS strict et CSRF Protection](#cors-strict-et-csrf-protection)
6. [Rate Limiting et Anti-Bruteforce](#rate-limiting-et-anti-bruteforce)
7. [Rôles utilisateurs](#rôles-utilisateurs)
8. [Architecture RBAC](#architecture-rbac)
9. [Routes protégées](#routes-protégées)
10. [Tests de sécurité](#tests-de-sécurité)
11. [Guide d'implémentation](#guide-dimplémentation)
12. [Déploiement PM2](#déploiement-pm2)

---

## 🔧 Variables d'environnement

### Validation au démarrage

Le backend valide **automatiquement** toutes les variables d'environnement au démarrage avec Zod.
Si une variable requise est manquante ou invalide, l'application **crash immédiatement** avec un message d'erreur clair.

### Variables requises (crash si manquantes)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL (format: `postgresql://user:password@host:port/database`) | `postgresql://postgres:pass@localhost:5432/secondlife` |
| `JWT_ACCESS_SECRET` | Secret pour signer les access tokens (min 32 caractères) | `your-secure-secret-min-32-chars...` |
| `JWT_REFRESH_SECRET` | Secret pour signer les refresh tokens (min 32 caractères) | `your-secure-secret-min-32-chars...` |
| `ADMIN_JWT_SECRET` | Secret pour signer les tokens admin (min 32 caractères) | `your-secure-secret-min-32-chars...` |

### Variables optionnelles (avec valeurs par défaut)

| Variable | Description | Défaut | Notes |
|----------|-------------|--------|-------|
| `NODE_ENV` | Environnement (`development`, `production`, `test`) | `development` | |
| `API_PORT` | Port du serveur HTTP | `4000` | |
| `JWT_ACCESS_EXPIRES_IN` | Durée de vie access tokens | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | Durée de vie refresh tokens | `7d` | |
| `BCRYPT_SALT_ROUNDS` | Rounds bcrypt (10-20) | `12` | |
| `FRONTEND_ORIGINS` | Origines CORS autorisées (séparées par virgules) | `http://localhost:3000` | |
| `ADMIN_ORIGIN` | Origine admin (optionnel) | - | |
| `COOKIE_DOMAIN` | Domaine des cookies (optionnel) | - | |
| `REDIS_URL` | URL Redis (optionnel, fallback PostgreSQL) | - | Format: `redis://localhost:6379` |
| `CLOUDINARY_CLOUD_NAME` | Nom compte Cloudinary | - | Requis si Cloudinary utilisé |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | - | Requis si Cloudinary utilisé |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | - | **NE JAMAIS exposer côté client** |
| `AI_GEMINI_API_KEY` | Clé API Gemini (optionnel) | - | Pour suggestions IA |
| `UNSPLASH_ACCESS_KEY` | Clé API Unsplash (optionnel) | - | **NE JAMAIS exposer côté client** |
| `VAPID_PUBLIC_KEY` | Clé publique VAPID (optionnel) | - | Pour notifications push |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID (optionnel) | - | **NE JAMAIS exposer côté client** |

### Fichier de référence

Consultez `apps/backend/env.example` pour la liste complète avec descriptions.

---

## 🏥 Health Checks

### Endpoints disponibles

| Endpoint | Méthode | Description | Utilisation |
|----------|---------|-------------|-------------|
| `/api/v1/health` | GET | Vérifie que le process tourne | PM2, load balancers |
| `/api/v1/health/ready` | GET | Vérifie que l'app est prête (DB, Redis, Cloudinary) | Kubernetes, Docker healthcheck |

### GET /health

**Réponse 200** si le serveur répond:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

**Utilisation:**
- PM2 health check
- Load balancers (vérification basique)
- Monitoring simple

### GET /ready

**Réponse 200** seulement si tous les services requis sont disponibles:

```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "ok"
    },
    "redis": {
      "status": "ok"
    },
    "cloudinary": {
      "status": "ok"
    }
  }
}
```

**Réponse 503** si un service requis est indisponible:

```json
{
  "status": "not_ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "error",
      "message": "Database connection failed: ..."
    }
  }
}
```

**Utilisation:**
- Kubernetes readiness probe
- Docker healthcheck
- Load balancers (vérification complète)

### Tests

```bash
# Health check simple
curl http://localhost:4000/api/v1/health

# Readiness check
curl http://localhost:4000/api/v1/health/ready
```

---

## 🔍 Audit des secrets frontend

### Checklist: Aucun secret exposé côté front

✅ **Variables NEXT_PUBLIC_* autorisées (non sensibles):**
- `NEXT_PUBLIC_API_URL` - URL publique du backend
- `NEXT_PUBLIC_APP_NAME` - Nom de l'application
- `NEXT_PUBLIC_APP_DESCRIPTION` - Description de l'application
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Nom du compte Cloudinary (public)
- `NEXT_PUBLIC_CLOUDINARY_API_KEY` - Clé API Cloudinary (⚠️ **Note**: Nécessaire pour upload direct, sécurité garantie par signature serveur)
- `NEXT_PUBLIC_ADMIN_BASE_PATH` - Chemin admin (non sensible)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Clé publique VAPID (publique par design)
- `NEXT_PUBLIC_FB_PIXEL_ID` - ID Facebook Pixel (non sensible)
- `NEXT_PUBLIC_GOOGLE_ADS_ID` - ID Google Ads (non sensible)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - ID Google Analytics (non sensible)
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Domaine Plausible (non sensible)

❌ **Variables retirées du frontend (proxy backend):**
- ~~`NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`~~ - Utilise maintenant `/api/v1/unsplash/search` (backend proxy)

### Cloudinary API Key

**Note importante**: `NEXT_PUBLIC_CLOUDINARY_API_KEY` est exposée côté client car nécessaire pour l'upload direct vers Cloudinary. La sécurité est garantie par:
- Signature cryptographique générée côté serveur
- Validation stricte des paramètres d'upload
- Limitation de la taille et du format des fichiers

La clé API seule ne permet pas d'uploader sans signature valide.

### Unsplash

L'API Unsplash est maintenant proxifiée via le backend:
- Frontend appelle `/api/v1/unsplash/search` (authentification requise)
- Backend utilise `UNSPLASH_ACCESS_KEY` (jamais exposée)
- Endpoint protégé par JWT

---

## 🚀 Déploiement PM2

### Configuration

Le fichier `ecosystem.config.js` est configuré pour charger automatiquement les variables d'environnement depuis `.env`.

### Commandes de base

```bash
# Se placer dans le répertoire backend
cd apps/backend

# Build de l'application
npm run build

# Démarrer en production
pm2 start ecosystem.config.js --env production

# Redémarrer
pm2 restart secondlife-backend

# Arrêter
pm2 stop secondlife-backend

# Voir les logs
pm2 logs secondlife-backend

# Status
pm2 status

# Monitoring
pm2 monit
```

### Variables d'environnement

PM2 charge automatiquement `.env` depuis le répertoire de travail (`apps/backend/.env`).

**Important**: Assurez-vous que `.env` contient toutes les variables requises (voir section [Variables d'environnement](#variables-denvironnement)).

### Health check PM2

PM2 peut utiliser `/api/v1/health` pour vérifier l'état de l'application:

```javascript
// Dans ecosystem.config.js (optionnel)
health_check: {
  url: 'http://localhost:4000/api/v1/health',
  interval: 30000, // 30 secondes
}
```

---

---

## 🍪 Authentification Cookies httpOnly

### Pourquoi cookies httpOnly ?

| Stockage | Vulnérable XSS | Vulnérable CSRF | Recommandé |
|----------|----------------|-----------------|------------|
| localStorage | ✅ OUI | ❌ NON | ❌ Non |
| Cookies classiques | ✅ OUI | ✅ OUI | ❌ Non |
| **Cookies httpOnly** | **❌ NON** | ✅ (mitigé) | **✅ OUI** |

Les tokens sont stockés dans des cookies `httpOnly`, ce qui empêche tout accès JavaScript (protection XSS).

### Configuration des cookies

```typescript
// Développement (localhost)
{
  httpOnly: true,      // Pas accessible en JS
  secure: false,       // HTTP autorisé
  sameSite: 'lax',     // Même domaine
  path: '/',
  maxAge: 15 * 60 * 1000  // 15 min pour access, 7 jours pour refresh
}

// Production (cross-origin: Vercel frontend + VPS backend)
{
  httpOnly: true,
  secure: true,        // HTTPS obligatoire
  sameSite: 'none',    // Cross-origin autorisé
  path: '/',
  domain: '.example.com'  // Optionnel: partager entre sous-domaines
}
```

### Endpoints d'authentification admin

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/auth/admin/login` | POST | Connexion → Set-Cookie |
| `/api/v1/auth/admin/refresh` | POST | Rotation tokens → nouveaux cookies |
| `/api/v1/auth/admin/logout` | POST | Révocation → Clear cookies |
| `/api/v1/auth/admin/me` | GET | Vérifier session (protégé JWT) |

### Refresh Token Rotation

```
1. Login → Access Token (15min) + Refresh Token (7j) avec familyId
2. Access expire → Appel /refresh avec cookie refreshToken
3. Backend: révoque ancien refresh + génère nouveau avec même familyId
4. Nouveau Set-Cookie avec les nouveaux tokens
```

### Détection Replay Attack

Si un refresh token **déjà révoqué** est présenté:
- → Attaque détectée (token volé/rejoué)
- → **TOUS les tokens de la famille sont révoqués**
- → L'utilisateur doit se reconnecter sur tous ses appareils

### Variables d'environnement

```bash
# Backend (.env)
JWT_ACCESS_SECRET=your-secure-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=your-admin-secret-if-different  # Optionnel

# Multi-origines CORS (séparées par virgules)
CORS_ORIGIN=http://localhost:3000,https://app.yoursite.com

# Cookie domain (optionnel, pour sous-domaines)
COOKIE_DOMAIN=.yoursite.com
```

### Tests curl - Authentification Cookies

#### 1. Login admin → Récupère les cookies

```bash
# Login et sauvegarde des cookies dans un fichier
curl -X POST "http://localhost:4000/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPassword123!"}' \
  -c cookies.txt \
  -v

# Vérifier les cookies reçus
cat cookies.txt
# Attendu: sl_access_token et sl_refresh_token
```

#### 2. Appel authentifié avec cookies

```bash
# Utiliser les cookies pour un appel authentifié
curl -X GET "http://localhost:4000/api/v1/auth/admin/me" \
  -b cookies.txt \
  -v

# Attendu: HTTP 200 + infos utilisateur
```

#### 3. Refresh tokens (rotation)

```bash
# Rafraîchir les tokens
curl -X POST "http://localhost:4000/api/v1/auth/admin/refresh" \
  -b cookies.txt \
  -c cookies.txt \
  -v

# Attendu: HTTP 200 + nouveaux cookies Set-Cookie
```

#### 4. Test replay attack (token réutilisé)

```bash
# Sauvegarder les anciens cookies
cp cookies.txt old_cookies.txt

# Faire un refresh (révoque l'ancien)
curl -X POST "http://localhost:4000/api/v1/auth/admin/refresh" \
  -b cookies.txt \
  -c cookies.txt

# Réutiliser les anciens cookies (attaque simulée)
curl -X POST "http://localhost:4000/api/v1/auth/admin/refresh" \
  -b old_cookies.txt \
  -v

# Attendu: HTTP 401 "Session invalide. Veuillez vous reconnecter."
# + Tous les tokens de la famille sont révoqués
```

#### 5. Logout

```bash
# Déconnexion (révoque le refresh token + clear cookies)
curl -X POST "http://localhost:4000/api/v1/auth/admin/logout" \
  -b cookies.txt \
  -c cookies.txt \
  -v

# Attendu: HTTP 204 + cookies expirés
```

#### 6. Vérifier que les cookies sont cleared

```bash
# Essayer d'accéder après logout
curl -X GET "http://localhost:4000/api/v1/auth/admin/me" \
  -b cookies.txt \
  -v

# Attendu: HTTP 401 (non authentifié)
```

### Frontend - Utilisation

```typescript
// L'API admin utilise axios avec withCredentials: true
// Les cookies sont envoyés automatiquement

// Login
const { data } = await adminApi.login(email, password);
// → Cookies définis automatiquement par le backend

// Vérifier session
const user = await adminApi.getMe();
if (!user) {
  // Non connecté → rediriger vers login
}

// Refresh automatique via intercepteur
// Si une requête retourne 401, l'intercepteur tente un refresh

// Logout
await adminApi.logout();
// → Cookies supprimés + redirection vers login
```

---

## 🔒 CORS strict et CSRF Protection

### Configuration CORS (Whitelist d'origins)

Le backend utilise une configuration CORS stricte avec whitelist d'origins autorisées.

#### Variables d'environnement

```bash
# Origines frontend autorisées (séparées par virgules)
FRONTEND_ORIGINS=https://second-life-exchange.vercel.app,https://secondelife-exchange.fr,https://www.secondelife-exchange.fr

# Origine admin optionnelle (si différente du frontend)
ADMIN_ORIGIN=https://admin.secondelife-exchange.fr
```

#### Sécurité CORS

- **Production** : Les requêtes sans `Origin` header sont **rejetées** (protection renforcée)
- **Développement** : Les requêtes sans `Origin` sont autorisées (Postman/curl)
- Seules les origines whitelisted sont autorisées
- `credentials: true` est activé (obligatoire pour cookies cross-origin)
- Headers autorisés : `Content-Type`, `Authorization`, `X-Requested-With`, `X-CSRF-Token`

#### Logs de sécurité

Les origines rejetées sont loggées (sans données sensibles) :
```
[CORS] Origine rejetée: https://malicious-site.com... (whitelist: 3 origin(s))
```

---

### Protection CSRF (Double Submit Cookie)

Le backend implémente une protection CSRF via le mécanisme **double submit cookie**.

#### Principe

1. Le backend génère un token CSRF aléatoire
2. Le token est stocké dans un cookie **non-httpOnly** (`XSRF-TOKEN`) et envoyé dans le header `X-CSRF-Token`
3. Le backend vérifie que `cookie === header` sur toutes les requêtes mutantes

#### Endpoint CSRF

```
GET /api/v1/security/csrf
```

**Réponse** :
```json
{
  "csrfToken": "a1b2c3d4e5f6...",
  "message": "CSRF token généré et défini dans le cookie XSRF-TOKEN"
}
```

Le token est aussi défini dans le cookie `XSRF-TOKEN` (non-httpOnly, 1h de validité).

#### Application du guard CSRF

Le guard `CsrfGuard` doit être appliqué sur les routes mutantes qui utilisent des cookies d'authentification.

**Méthodes protégées** : `POST`, `PATCH`, `DELETE`, `PUT`
**Méthodes exclues** : `GET` (lecture seule)

```typescript
import { UseGuards } from '@nestjs/common';
import { CsrfGuard } from '../../common/guards/csrf.guard';

@Controller('admin')
@UseGuards(AdminJwtGuard, CsrfGuard) // Ajouter CsrfGuard
export class AdminController {
  // Toutes les routes POST/PATCH/DELETE sont protégées CSRF
}
```

**Exclure une route de la vérification CSRF** :

```typescript
import { SkipCsrf } from '../../common/guards/csrf.guard';

@Post('webhook')
@SkipCsrf() // Webhook externe ne peut pas envoyer le header
webhookHandler() { ... }
```

#### Frontend - Intégration CSRF

Le client admin (`admin.api.ts`) gère automatiquement le token CSRF :

1. **Récupération automatique** : Le token est lu depuis le cookie `XSRF-TOKEN`
2. **Récupération si absent** : Si absent, appel automatique à `/security/csrf`
3. **Ajout du header** : Le header `X-CSRF-Token` est ajouté sur toutes les requêtes mutantes
4. **Retry automatique** : En cas d'erreur 403 CSRF, récupération d'un nouveau token et retry

#### Variables d'environnement

```bash
# Domaine des cookies (optionnel, pour partager entre sous-domaines)
COOKIE_DOMAIN=.secondelife-exchange.fr
```

---

### Tests curl - CORS et CSRF

#### 1. Test CORS - Origine autorisée

```bash
# Requête depuis une origine autorisée
curl -X GET "http://localhost:4000/api/v1/items" \
  -H "Origin: http://localhost:3000" \
  -v

# Attendu: HTTP 200 + headers CORS dans la réponse
```

#### 2. Test CORS - Origine non autorisée (production)

```bash
# En production, cette requête sera bloquée
curl -X GET "http://localhost:4000/api/v1/items" \
  -H "Origin: https://malicious-site.com" \
  -v

# Attendu: CORS error ou HTTP 403
```

#### 3. Récupérer un token CSRF

```bash
# Récupérer le token CSRF (cookie + JSON)
curl -X GET "http://localhost:4000/api/v1/security/csrf" \
  -c cookies.txt \
  -v

# Vérifier le cookie
cat cookies.txt
# Attendu: XSRF-TOKEN=<token> dans le fichier cookies.txt

# Le token est aussi dans la réponse JSON
# {"csrfToken": "...", "message": "..."}
```

#### 4. Requête mutante sans token CSRF → 403

```bash
# POST sans header X-CSRF-Token (mais avec cookie)
curl -X POST "http://localhost:4000/api/v1/admin/users/123/ban" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"reason": "test"}' \
  -v

# Attendu: HTTP 403 "Token CSRF invalide ou manquant"
```

#### 5. Requête mutante avec token CSRF → 200/201

```bash
# Extraire le token depuis le cookie
CSRF_TOKEN=$(grep XSRF-TOKEN cookies.txt | awk '{print $7}')

# POST avec header X-CSRF-Token
curl -X POST "http://localhost:4000/api/v1/admin/users/123/ban" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"reason": "test"}' \
  -v

# Attendu: HTTP 200/201 (succès)
```

#### 6. Requête mutante avec token CSRF incorrect → 403

```bash
# POST avec mauvais token CSRF
curl -X POST "http://localhost:4000/api/v1/admin/users/123/ban" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-CSRF-Token: wrong-token" \
  -d '{"reason": "test"}' \
  -v

# Attendu: HTTP 403 "Token CSRF invalide ou manquant"
```

#### 7. Requête GET (non mutante) → Pas de CSRF requis

```bash
# GET n'a pas besoin de CSRF
curl -X GET "http://localhost:4000/api/v1/items" \
  -v

# Attendu: HTTP 200 (pas de vérification CSRF pour GET)
```

---

## 🛡️ Rate Limiting et Anti-Bruteforce

### Vue d'ensemble

Le backend implémente un système de protection multi-niveaux contre les attaques par force brute et les abus:

1. **Rate Limiting par endpoint** (ThrottlerModule) - Limite le nombre de requêtes par IP
2. **Blocage anti-bruteforce** (LoginAttemptService) - Bloque temporairement après plusieurs échecs
3. **Logging sécurisé** - Enregistre les tentatives sans révéler d'informations sensibles

### Configuration Rate Limiting

Les limites sont configurées dans `app.module.ts` via `ThrottlerModule`:

| Endpoint | Limite | Fenêtre | Description |
|----------|--------|---------|-------------|
| `/auth/login` | 10/min | 1 minute | Login utilisateur |
| `/auth/admin/login` | 5/min | 1 minute | Login admin (strict) |
| `/auth/refresh` | 20/min | 1 minute | Rafraîchissement tokens |
| Endpoints IA | 10/min | 1 minute | Analyse IA, suggestions |
| Endpoints upload | 20/min | 1 minute | Upload photos, signatures |
| Default | 100/min | 1 minute | Toutes les autres routes |

### Système Anti-Bruteforce

Le système de blocage fonctionne en deux niveaux:

#### 1. Comptage des tentatives

- **Clé de comptage**: Email hashé (SHA-256, 16 premiers caractères)
- **Fenêtre**: 15 minutes
- **Seuil**: 10 échecs → blocage automatique
- **Durée du blocage**: 15 minutes

#### 2. Stockage

**Priorité 1: Redis** (si disponible)
- Clés avec TTL automatique
- Performance optimale
- Pas de nettoyage manuel nécessaire

**Fallback: PostgreSQL** (si Redis indisponible)
- Table `login_attempts`
- Nettoyage automatique via TTL (createdAt)
- Index optimisés pour les requêtes

#### 3. Sécurité

- ✅ **Pas d'enumeration**: Messages d'erreur génériques ("Email ou mot de passe incorrect")
- ✅ **Pas de fuite d'infos**: Ne révèle jamais si un email existe
- ✅ **Logging sécurisé**: Email hashé partiellement dans les logs
- ✅ **Réinitialisation**: Les tentatives sont réinitialisées après un login réussi

### Variables d'environnement

```bash
# Redis (optionnel mais recommandé)
REDIS_URL=redis://localhost:6379

# Si Redis non disponible, le système utilise PostgreSQL automatiquement
```

### Tests curl - Rate Limiting

#### 1. Test rate limit sur login (10/min)

```bash
# Faire 11 tentatives rapides
for i in {1..11}; do
  echo "Tentative $i..."
  curl -X POST "http://localhost:4000/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s
  sleep 0.1
done

# Attendu: Les 10 premières réussissent (401), la 11ème retourne 429 (Too Many Requests)
```

#### 2. Test blocage anti-bruteforce (10 échecs → blocage 15 min)

```bash
# Faire 10 tentatives avec mauvais mot de passe
for i in {1..10}; do
  echo "Tentative $i..."
  curl -X POST "http://localhost:4000/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "wrong"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s
  sleep 1
done

# La 11ème tentative devrait retourner 403 avec message de blocage
curl -X POST "http://localhost:4000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "wrong"}' \
  -v

# Attendu: HTTP 403 "Trop de tentatives de connexion. Veuillez réessayer dans X minutes."
```

#### 3. Test admin login strict (5/min)

```bash
# Faire 6 tentatives rapides sur admin login
for i in {1..6}; do
  echo "Tentative admin $i..."
  curl -X POST "http://localhost:4000/api/v1/auth/admin/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@example.com", "password": "wrong"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s
  sleep 0.1
done

# Attendu: La 6ème retourne 429 (rate limit atteint plus tôt que user login)
```

#### 4. Test réinitialisation après succès

```bash
# Faire 9 échecs
for i in {1..9}; do
  curl -X POST "http://localhost:4000/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "wrong"}' \
    -s -o /dev/null
done

# Login réussi → réinitialise les tentatives
curl -X POST "http://localhost:4000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "correct_password"}' \
  -v

# Attendu: HTTP 200 + les tentatives sont réinitialisées
# Les prochaines tentatives recommencent à zéro
```

#### 5. Test rate limit sur refresh token (20/min)

```bash
# Faire 21 tentatives de refresh
for i in {1..21}; do
  echo "Refresh $i..."
  curl -X POST "http://localhost:4000/api/v1/auth/refresh" \
    -H "Content-Type: application/json" \
    -d '{"refreshToken": "valid_token"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s
  sleep 0.1
done

# Attendu: La 21ème retourne 429
```

#### 6. Test rate limit sur upload (20/min)

```bash
# Faire 21 requêtes de signature upload
for i in {1..21}; do
  echo "Upload signature $i..."
  curl -X POST "http://localhost:4000/api/v1/items/uploads/signature" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"folder": "test"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s
  sleep 0.1
done

# Attendu: La 21ème retourne 429
```

### Logs de sécurité

Les blocages sont loggés avec des informations sécurisées:

```
[SECURITY] BLOCKED - Email: us***a1b2c3d4 | IP: 192.168.1.1 | UserAgent: Mozilla/5.0... | Attempts: 10
```

**Informations loggées**:
- Email: 2 premiers caractères + hash partiel (ex: `us***a1b2c3d4`)
- IP: Adresse IP complète
- UserAgent: 50 premiers caractères
- Attempts: Nombre de tentatives

**Informations jamais loggées**:
- ❌ Mot de passe (même hashé)
- ❌ Email complet
- ❌ Tokens JWT

### Script de test complet

```bash
#!/bin/bash
# test-rate-limiting.sh - Script de test rate limiting et anti-bruteforce

API_URL="${API_URL:-http://localhost:4000/api/v1}"

echo "🛡️ Test Rate Limiting et Anti-Bruteforce"
echo "=========================================="
echo ""

# Test 1: Rate limit login (10/min)
echo "📊 Test 1: Rate limit login (10/min)"
echo "Faire 11 tentatives rapides..."
for i in {1..11}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}')
  
  if [ "$i" -eq 11 ] && [ "$STATUS" == "429" ]; then
    echo "✅ PASS: Rate limit activé (HTTP 429)"
  elif [ "$i" -le 10 ] && [ "$STATUS" != "429" ]; then
    echo "✅ Tentative $i: HTTP $STATUS"
  fi
  sleep 0.1
done

# Test 2: Blocage anti-bruteforce (10 échecs)
echo ""
echo "🔒 Test 2: Blocage anti-bruteforce (10 échecs → blocage 15 min)"
echo "Faire 10 échecs puis vérifier le blocage..."
for i in {1..10}; do
  curl -s -o /dev/null \
    -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "wrong"}'
  sleep 0.5
done

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "wrong"}')

if [ "$STATUS" == "403" ]; then
  echo "✅ PASS: Blocage activé après 10 échecs (HTTP 403)"
else
  echo "❌ FAIL: Attendu HTTP 403, reçu HTTP $STATUS"
fi

# Test 3: Admin login strict (5/min)
echo ""
echo "🔒 Test 3: Admin login strict (5/min)"
echo "Faire 6 tentatives rapides..."
for i in {1..6}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/auth/admin/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@example.com", "password": "wrong"}')
  
  if [ "$i" -eq 6 ] && [ "$STATUS" == "429" ]; then
    echo "✅ PASS: Rate limit admin activé (HTTP 429)"
  elif [ "$i" -le 5 ] && [ "$STATUS" != "429" ]; then
    echo "✅ Tentative $i: HTTP $STATUS"
  fi
  sleep 0.1
done

echo ""
echo "=========================================="
echo "Tests terminés"
```

---

## 🎭 Rôles utilisateurs

L'application utilise 3 niveaux de rôles définis dans l'enum `UserRole` (Prisma):

| Rôle | Description | Accès |
|------|-------------|-------|
| `USER` | Utilisateur standard | Routes publiques + routes authentifiées |
| `MODERATOR` | Modérateur | Routes user + modération communauté |
| `ADMIN` | Administrateur | Accès complet à toutes les routes |

---

## 🏗️ Architecture RBAC

### Guards disponibles (unifiés)

| Guard | Usage | Status |
|-------|-------|--------|
| `JwtAccessGuard` | Vérifie le JWT utilisateur | ✅ Actif |
| `AdminJwtGuard` | JWT admin (secret séparé, pour `/admin/**`) | ✅ Actif |
| `RolesGuard` | RBAC flexible avec `@Roles()` | ✅ **RECOMMANDÉ** |
| `AdminGuard` | Vérifie `user.roles === 'ADMIN'` | ⚠️ **DEPRECATED** - Utiliser RolesGuard |
| `AdminRoleGuard` | Idem avec enum Prisma | ⚠️ Utilisé uniquement avec AdminJwtGuard |

### Décorateur @Roles()

```typescript
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Route accessible uniquement aux ADMIN
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Post('admin-only')
adminOnly() { ... }

// Route accessible aux ADMIN et MODERATOR
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Delete('moderate')
moderate() { ... }
```

---

## 🛡️ Routes protégées

### Routes ADMIN uniquement

| Endpoint | Méthode | Protection |
|----------|---------|------------|
| `/api/v1/admin/**` | ALL | `AdminJwtGuard + AdminRoleGuard` |
| `/api/v1/themes` | POST | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/themes/:id` | PATCH, DELETE | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/themes/:id/activate` | PATCH | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/ai/themes/:id/generate` | POST | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/eco` | POST | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/eco/:id` | PATCH, DELETE | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/eco/:id/enrich` | POST | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |
| `/api/v1/notifications/test` | POST | `JwtAccessGuard + RolesGuard (@Roles ADMIN)` |

### Routes authentifiées (tout rôle)

| Endpoint | Méthode | Protection |
|----------|---------|------------|
| `/api/v1/users/me` | GET, PATCH, DELETE | `JwtAccessGuard` |
| `/api/v1/items` | POST | `JwtAccessGuard` |
| `/api/v1/items/:id` | PATCH, DELETE | `JwtAccessGuard` (propriétaire) |
| `/api/v1/exchanges/**` | ALL | `JwtAccessGuard` |
| `/api/v1/matching/**` | ALL | `JwtAccessGuard` |
| `/api/v1/notifications/**` | ALL (sauf test) | `JwtAccessGuard` |
| `/api/v1/threads` | POST | `JwtAccessGuard` |
| `/api/v1/threads/:id` | DELETE | `JwtAccessGuard` (auteur/admin) |
| `/api/v1/threads/:threadId/posts` | POST, PATCH, DELETE | `JwtAccessGuard` |

### Routes publiques

| Endpoint | Méthode |
|----------|---------|
| `/api/v1/auth/login` | POST |
| `/api/v1/auth/register` | POST |
| `/api/v1/auth/admin/login` | POST |
| `/api/v1/items` | GET |
| `/api/v1/items/:id` | GET |
| `/api/v1/themes/**` | GET |
| `/api/v1/eco/**` | GET |
| `/api/v1/threads/**` | GET |
| `/api/v1/threads/:threadId/posts/**` | GET |

---

## 🧪 Tests de sécurité

### Variables d'environnement

```bash
# URL de base de l'API
export API_URL="http://localhost:3000/api/v1"

# Token utilisateur standard (à récupérer via login)
export USER_TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Token admin (à récupérer via admin login)
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Récupération des tokens

```bash
# 1. Login utilisateur standard
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123!"}' \
  | jq -r '.accessToken'

# 2. Login admin
curl -X POST "$API_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPassword123!"}' \
  | jq -r '.accessToken'
```

---

### Tests des routes THEMES (ADMIN only)

#### ❌ Test 1: Créer thème sans token → 401

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/themes" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "slug": "test", "startOfWeek": "2024-01-15T00:00:00Z"}'

# Attendu: HTTP Status: 401
```

#### ❌ Test 2: Créer thème avec USER → 403

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/themes" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"title": "Test", "slug": "test", "startOfWeek": "2024-01-15T00:00:00Z"}'

# Attendu: HTTP Status: 403
# Message: "Accès refusé. Rôle requis: ADMIN"
```

#### ✅ Test 3: Créer thème avec ADMIN → 201

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/themes" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title": "Test Theme", "slug": "test-theme-'$(date +%s)'", "startOfWeek": "2024-01-15T00:00:00Z"}'

# Attendu: HTTP Status: 201
```

---

### Tests des routes ECO CONTENT (ADMIN only)

#### ❌ Test 4: Créer eco content avec USER → 403

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/eco" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"kind": "ARTICLE", "title": "Test Article", "url": "https://example.com"}'

# Attendu: HTTP Status: 403
```

#### ✅ Test 5: Créer eco content avec ADMIN → 201

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/eco" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"kind": "ARTICLE", "title": "Test Article", "url": "https://example.com"}'

# Attendu: HTTP Status: 201
```

#### ✅ Test 6: Lire eco content (PUBLIC) → 200

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/eco"

# Attendu: HTTP Status: 200 (route publique)
```

---

### Tests des routes NOTIFICATIONS

#### ❌ Test 7: Test notification avec USER → 403

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/notifications/test" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{}'

# Attendu: HTTP Status: 403
```

#### ✅ Test 8: Test notification avec ADMIN → 200

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/notifications/test" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}'

# Attendu: HTTP Status: 200
```

---

### Tests des routes AI (ADMIN only)

#### ❌ Test 9: Générer suggestions avec USER → 403

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/ai/themes/some-theme-id/generate" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN"

# Attendu: HTTP Status: 403
```

---

### Tests des routes USER (authentifié)

#### ❌ Test 10: Profil sans token → 401

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/users/me"

# Attendu: HTTP Status: 401
```

#### ✅ Test 11: Profil avec token USER → 200

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "$API_URL/users/me" \
  -H "Authorization: Bearer $USER_TOKEN"

# Attendu: HTTP Status: 200
```

---

### Tests des routes PUBLIQUES

#### ✅ Test 12: Liste items → 200

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/items"
# Attendu: HTTP Status: 200
```

#### ✅ Test 13: Liste thèmes → 200

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/themes"
# Attendu: HTTP Status: 200
```

#### ✅ Test 14: Thème actif → 200

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/themes/active"
# Attendu: HTTP Status: 200 ou 404 (si aucun thème actif)
```

---

### Script de test complet

```bash
#!/bin/bash
# test-rbac.sh - Script de test RBAC complet

API_URL="${API_URL:-http://localhost:3000/api/v1}"

echo "🔐 Test RBAC - SecondLife-Exchange"
echo "=================================="
echo ""

PASS=0
FAIL=0

test_route() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  
  if [ "$actual" == "$expected" ]; then
    echo "✅ PASS: $description (HTTP $actual)"
    ((PASS++))
  else
    echo "❌ FAIL: $description (HTTP $actual, attendu: $expected)"
    ((FAIL++))
  fi
}

# Routes publiques
echo "📖 Routes publiques"
test_route "GET /items" "200" $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/items")
test_route "GET /themes" "200" $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/themes")
test_route "GET /eco" "200" $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/eco")

# Routes sans token (401)
echo ""
echo "🔒 Routes sans token (attendu: 401)"
test_route "POST /themes (no token)" "401" $(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/themes" -H "Content-Type: application/json" -d '{}')
test_route "GET /users/me (no token)" "401" $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/me")
test_route "POST /eco (no token)" "401" $(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/eco" -H "Content-Type: application/json" -d '{}')

# Tests avec tokens (nécessite USER_TOKEN et ADMIN_TOKEN)
if [ -n "$USER_TOKEN" ]; then
  echo ""
  echo "🔒 Routes admin avec USER_TOKEN (attendu: 403)"
  test_route "POST /themes (user)" "403" $(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/themes" -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d '{"title":"test","slug":"test","startOfWeek":"2024-01-15T00:00:00Z"}')
  test_route "POST /eco (user)" "403" $(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/eco" -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d '{"kind":"ARTICLE","title":"test","url":"https://test.com"}')
  test_route "POST /notifications/test (user)" "403" $(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/notifications/test" -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d '{}')
  
  echo ""
  echo "✅ Routes user avec USER_TOKEN (attendu: 200)"
  test_route "GET /users/me (user)" "200" $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/me" -H "Authorization: Bearer $USER_TOKEN")
fi

if [ -n "$ADMIN_TOKEN" ]; then
  echo ""
  echo "✅ Routes admin avec ADMIN_TOKEN (attendu: 2xx)"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/themes" -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d "{\"title\":\"test\",\"slug\":\"test-$(date +%s)\",\"startOfWeek\":\"2024-01-15T00:00:00Z\"}")
  test_route "POST /themes (admin)" "201" "$STATUS"
fi

echo ""
echo "=================================="
echo "Résultats: $PASS passés, $FAIL échoués"
echo ""

if [ -z "$USER_TOKEN" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "⚠️  Pour des tests complets, exportez:"
  echo "   export USER_TOKEN='...'"
  echo "   export ADMIN_TOKEN='...'"
fi
```

---

## 📝 Guide d'implémentation

### Ajouter une nouvelle route ADMIN

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('example')
export class ExampleController {
  
  @Post('admin-action')
  @UseGuards(JwtAccessGuard, RolesGuard)  // 1. Appliquer les guards
  @Roles(UserRole.ADMIN)                   // 2. Définir les rôles requis
  async adminAction() {
    // Cette route est accessible uniquement aux ADMIN
  }
  
  @Post('mod-action')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)  // Plusieurs rôles autorisés
  async modAction() {
    // Cette route est accessible aux ADMIN et MODERATOR
  }
}
```

### Protéger un contrôleur entier

```typescript
@Controller('admin-section')
@UseGuards(JwtAccessGuard, RolesGuard)  // Guard au niveau du contrôleur
@Roles(UserRole.ADMIN)                   // Rôle requis pour toutes les routes
export class AdminSectionController {
  
  @Get()
  list() { ... }  // ADMIN only
  
  @Post()
  create() { ... }  // ADMIN only
  
  @Delete(':id')
  delete() { ... }  // ADMIN only
}
```

### Structure de `req.user`

Après authentification JWT, `req.user` contient:

```typescript
interface User {
  id: string;           // ID unique de l'utilisateur
  email: string;        // Email
  displayName: string;  // Nom affiché
  avatarUrl?: string;   // URL de l'avatar
  roles: UserRole;      // USER | MODERATOR | ADMIN
  createdAt: Date;      // Date de création
}
```

---

## 🚨 Logs de sécurité

Les refus d'accès sont loggés avec les informations suivantes (sans données sensibles):

```
[RolesGuard] Accès refusé (403): Rôle insuffisant - User: clx123... (user@example.com), Rôle: USER, Requis: [ADMIN] - POST /api/v1/themes
```

Les logs sont visibles dans la console du serveur et peuvent être redirigés vers un système de monitoring.

---

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers

- `src/common/decorators/roles.decorator.ts` - Décorateur @Roles()
- `src/common/guards/roles.guard.ts` - Guard RBAC flexible

### Fichiers modifiés

- `prisma/schema.prisma` - Ajout de `MODERATOR` à l'enum `UserRole`
- `src/modules/themes/themes.controller.ts` - Migration vers RolesGuard
- `src/modules/scheduler/ai.controller.ts` - Migration vers RolesGuard
- `src/modules/eco/eco.controller.ts` - Migration vers RolesGuard
- `src/modules/notifications/notifications.controller.ts` - Migration vers RolesGuard
- `src/common/guards/admin.guard.ts` - Marqué comme DEPRECATED

---

## ✅ Checklist de sécurité

- [x] Enum `UserRole` contient `USER`, `MODERATOR`, `ADMIN`
- [x] Décorateur `@Roles()` créé pour définir les rôles requis
- [x] `RolesGuard` implémenté pour vérifier les rôles
- [x] Routes `/api/v1/themes` (POST/PATCH/DELETE) protégées avec RolesGuard
- [x] Route `/api/v1/ai/themes/:id/generate` protégée avec RolesGuard
- [x] Routes `/api/v1/eco` (POST/PATCH/DELETE) migrées vers RolesGuard
- [x] Route `/api/v1/notifications/test` migrée vers RolesGuard
- [x] `AdminGuard` marqué comme deprecated
- [x] Logging des refus 401/403 sans données sensibles
- [x] Guards unifiés (JwtAccessGuard + RolesGuard recommandé)

---

## 📊 Tableau récapitulatif des routes

| Contrôleur | Route | Méthode | Accès |
|------------|-------|---------|-------|
| **Auth** | `/auth/login` | POST | PUBLIC |
| **Auth** | `/auth/register` | POST | PUBLIC |
| **Auth** | `/auth/admin/login` | POST | PUBLIC |
| **Admin** | `/admin/**` | ALL | ADMIN (AdminJwtGuard) |
| **Themes** | `/themes` | GET | PUBLIC |
| **Themes** | `/themes` | POST | ADMIN |
| **Themes** | `/themes/:id` | PATCH/DELETE | ADMIN |
| **AI** | `/ai/themes/:id/generate` | POST | ADMIN |
| **Eco** | `/eco` | GET | PUBLIC |
| **Eco** | `/eco` | POST | ADMIN |
| **Eco** | `/eco/:id` | PATCH/DELETE | ADMIN |
| **Notifications** | `/notifications/**` | ALL | USER |
| **Notifications** | `/notifications/test` | POST | ADMIN |
| **Users** | `/users/me` | ALL | USER |
| **Items** | `/items` | GET | PUBLIC |
| **Items** | `/items` | POST | USER |
| **Items** | `/items/:id` | PATCH/DELETE | USER (owner) |
| **Exchanges** | `/exchanges/**` | ALL | USER |
| **Matching** | `/matching/**` | ALL | USER |
| **Threads** | `/threads` | GET | PUBLIC |
| **Threads** | `/threads` | POST | USER |
| **Threads** | `/threads/:id` | DELETE | USER (author/admin) |
| **Posts** | `/threads/:id/posts` | GET | PUBLIC |
| **Posts** | `/threads/:id/posts` | POST/PATCH/DELETE | USER |

---

## 🔐 Authentification à deux facteurs (2FA) TOTP

### Vue d'ensemble

Le backend implémente l'authentification à deux facteurs (2FA) TOTP (Time-based One-Time Password) pour les comptes ADMIN et MODERATOR, conformément à la RFC 6238.

**Fonctionnalités:**
- Génération de secrets TOTP chiffrés avec AES-256-GCM
- QR codes pour configuration facile (otpauth://)
- Support des applications d'authentification standards (Google Authenticator, Authy, 1Password, etc.)
- Chiffrement des secrets en base de données
- Flow de login sécurisé avec étape de vérification 2FA

**Sécurité:**
- Secrets chiffrés avec `APP_ENCRYPTION_KEY` (AES-256-GCM)
- 2FA désactivé par défaut (pas d'impact sur les comptes existants)
- Codes TOTP valides dans une fenêtre de ±2 périodes (60 secondes chacune)
- Validation stricte des codes à 6 chiffres

### Variables d'environnement

```bash
# Clé de chiffrement pour secrets 2FA (32 bytes hex = 64 caractères)
# Générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
APP_ENCRYPTION_KEY=your_32_bytes_hex_encryption_key_here_generate_with_crypto_randomBytes
```

**Important:** `APP_ENCRYPTION_KEY` doit faire au moins 32 caractères (64 caractères hex recommandé).

### Endpoints 2FA

| Endpoint | Méthode | Description | Authentification |
|----------|---------|-------------|------------------|
| `/api/v1/auth/admin/2fa/setup` | POST | Génère QR code et secret temporaire | ✅ Admin JWT |
| `/api/v1/auth/admin/2fa/enable` | POST | Active le 2FA après vérification | ✅ Admin JWT |
| `/api/v1/auth/admin/2fa/verify` | POST | Vérifie code après login | ❌ Public (après login email+password) |
| `/api/v1/auth/admin/2fa/disable` | POST | Désactive le 2FA | ✅ Admin JWT |

### Flow d'activation du 2FA

1. **Setup** : Admin connecté appelle `/2fa/setup` → reçoit QR code + secret temporaire
2. **Scan QR** : Admin scanne le QR code avec son authenticator
3. **Vérification** : Admin entre le code TOTP actuel → `/2fa/enable` → 2FA activé
4. **Confirmation** : Secret chiffré stocké en base, `twoFactorEnabled = true`

### Flow de connexion avec 2FA

1. **Login email+password** : `POST /auth/admin/login` avec email + mot de passe
   - Si 2FA activé → retourne `{"requiresTwoFactor": true, "message": "2FA_REQUIRED"}`
   - Si 2FA désactivé → retourne session complète (tokens dans cookies)

2. **Vérification 2FA** : `POST /auth/admin/2fa/verify` avec `userId` + `code` TOTP
   - Si code valide → crée session complète (tokens dans cookies)
   - Si code invalide → erreur 401

3. **Accès** : Session complète → accès au dashboard admin

### Tests curl - 2FA TOTP

#### 1. Login admin (sans 2FA activé)

```bash
# Login normal → session complète
curl -X POST "http://localhost:4000/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPassword123!"}' \
  -c cookies.txt \
  -v

# Attendu: HTTP 200 + cookies définis + {"user": {...}}
```

#### 2. Login admin (avec 2FA activé)

```bash
# Login avec 2FA activé → réponse "2FA_REQUIRED"
curl -X POST "http://localhost:4000/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPassword123!"}' \
  -v

# Attendu: HTTP 200 + {"requiresTwoFactor": true, "message": "2FA_REQUIRED", "user": {...}}
# Note: Pas de cookies définis (session incomplète)
```

#### 3. Setup 2FA (générer QR code)

```bash
# Récupérer le QR code et secret temporaire
curl -X POST "http://localhost:4000/api/v1/auth/admin/2fa/setup" \
  -b cookies.txt \
  -v

# Attendu: HTTP 200 + {
#   "qrCode": "data:image/png;base64,iVBORw0KG...",
#   "secret": "JBSWY3DPEHPK3PXP",
#   "otpAuthUrl": "otpauth://totp/..."
# }
```

#### 4. Activer 2FA (vérifier code et activer)

```bash
# Activer le 2FA avec un code TOTP valide
# Note: Remplacer "123456" par le code actuel de votre authenticator
curl -X POST "http://localhost:4000/api/v1/auth/admin/2fa/enable" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "code": "123456",
    "secret": "JBSWY3DPEHPK3PXP"
  }' \
  -v

# Attendu: HTTP 200 + {"enabled": true}
```

#### 5. Vérifier code 2FA après login

```bash
# Après login qui retourne "2FA_REQUIRED", vérifier le code
# Note: userId est obtenu depuis la réponse du login précédent
# Note: Remplacer "123456" par le code actuel de votre authenticator
curl -X POST "http://localhost:4000/api/v1/auth/admin/2fa/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "clx1234567890abcdef",
    "code": "123456"
  }' \
  -c cookies.txt \
  -v

# Attendu: HTTP 200 + cookies définis + {"user": {...}}
```

#### 6. Désactiver 2FA

```bash
# Désactiver le 2FA (nécessite authentification admin)
curl -X POST "http://localhost:4000/api/v1/auth/admin/2fa/disable" \
  -b cookies.txt \
  -v

# Attendu: HTTP 200 + {"disabled": true}
```

#### 7. Test complet du flow 2FA

```bash
#!/bin/bash
# Script de test complet du flow 2FA

API_URL="http://localhost:4000/api/v1"

# Étape 1: Login pour obtenir les cookies
echo "🔐 Étape 1: Login admin"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPassword123!"}' \
  -c cookies.txt)

echo "Réponse login: $LOGIN_RESPONSE"

# Vérifier si 2FA est requis
REQUIRES_2FA=$(echo $LOGIN_RESPONSE | jq -r '.requiresTwoFactor // false')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ "$REQUIRES_2FA" == "true" ]; then
  echo "⚠️  2FA requis pour ce compte"
  echo "📱 Entrez le code TOTP depuis votre authenticator:"
  read -r CODE
  
  # Étape 2: Vérifier le code 2FA
  echo "🔐 Étape 2: Vérification code 2FA"
  VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/2fa/verify" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$USER_ID\", \"code\": \"$CODE\"}" \
    -c cookies.txt)
  
  echo "Réponse vérification: $VERIFY_RESPONSE"
  
  # Vérifier la session
  echo "✅ Vérification de la session"
  curl -s -X GET "$API_URL/auth/admin/me" \
    -b cookies.txt | jq
  
else
  echo "✅ 2FA non activé, session complète créée"
  
  # Étape 2: Setup 2FA
  echo "🔐 Étape 2: Setup 2FA"
  SETUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/2fa/setup" \
    -b cookies.txt)
  
  QR_CODE=$(echo $SETUP_RESPONSE | jq -r '.qrCode')
  SECRET=$(echo $SETUP_RESPONSE | jq -r '.secret')
  
  echo "📱 QR Code reçu (base64)"
  echo "🔑 Secret: $SECRET"
  echo "💡 Scannez le QR code avec votre authenticator"
  echo ""
  echo "📱 Entrez le code TOTP pour activer:"
  read -r CODE
  
  # Étape 3: Activer 2FA
  echo "🔐 Étape 3: Activation 2FA"
  ENABLE_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/2fa/enable" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "{\"code\": \"$CODE\", \"secret\": \"$SECRET\"}")
  
  echo "Réponse activation: $ENABLE_RESPONSE"
  
  echo "✅ 2FA activé ! Essayez de vous reconnecter pour tester le flow complet."
fi
```

### Structure de la base de données

Le modèle `User` contient les champs suivants pour le 2FA:

```prisma
model User {
  // ... autres champs
  
  // 2FA TOTP fields (for ADMIN/MODERATOR)
  twoFactorEnabled   Boolean             @default(false)
  twoFactorSecret    String? // Secret chiffré avec APP_ENCRYPTION_KEY
  twoFactorVerifiedAt DateTime? // Date de vérification du setup 2FA
}
```

**Migration:** Les champs sont ajoutés avec des valeurs par défaut (`twoFactorEnabled = false`), donc les comptes existants ne sont pas affectés.

### Sécurité du chiffrement

Les secrets TOTP sont chiffrés avec **AES-256-GCM** (authenticated encryption):

- **Algorithme**: AES-256-GCM
- **Clé de dérivation**: PBKDF2 (100,000 iterations, SHA-256)
- **IV aléatoire**: 16 bytes (128 bits) généré pour chaque chiffrement
- **Salt aléatoire**: 64 bytes (512 bits) généré pour chaque chiffrement
- **Tag d'authentification**: 16 bytes (128 bits) pour détecter la manipulation

**Format du secret chiffré:** `salt:iv:tag:encryptedData` (tous en hex)

### Applications d'authentification compatibles

Le 2FA utilise le standard **TOTP** (RFC 6238), compatible avec:
- ✅ Google Authenticator
- ✅ Authy
- ✅ Microsoft Authenticator
- ✅ 1Password
- ✅ LastPass Authenticator
- ✅ Aegis Authenticator (Android)
- ✅ Tous les authenticators TOTP standards

### Notes de sécurité

1. **Backup codes (optionnel):** Non implémentés actuellement, mais recommandés pour la production
2. **Récupération:** Si un admin perd son authenticator, contactez un autre admin pour désactiver le 2FA
3. **Rate limiting:** Les endpoints 2FA sont protégés par rate limiting (5-10 tentatives/minute)
4. **Logging:** Les activations/désactivations de 2FA sont loggées dans `AdminLog` avec `AdminActionType.ENABLE_2FA` / `DISABLE_2FA`

---

*Document mis à jour - SecondLife-Exchange Backend RBAC v2 + 2FA TOTP*

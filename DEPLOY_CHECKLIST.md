# Checklist de déploiement VPS - SecondLife Exchange API

## ✅ A) CORRECTION TYPESCRIPT GEMINI

**Fichier modifié:** `apps/backend/src/modules/ai/gemini.service.ts`

**Modifications apportées:**
- Ajout des types minimaux pour l'API Gemini (lignes 33-47)
- Cast de `data` avec `as GeminiResponse` après `response.json()` (ligne 349)

**Types ajoutés:**
```typescript
type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };
```

**Build vérifié:** ✅ `pnpm build` passe sans erreur

---

## 📋 B) CHECKLIST D'EXÉCUTION SUR LE VPS

### 1. Se connecter au VPS et aller dans le répertoire du projet

```bash
cd /var/www/SecondLife-Exchange
```

### 2. Récupérer les dernières modifications (si nécessaire)

```bash
git pull origin main  # ou votre branche
```

### 3. Aller dans le répertoire backend

```bash
cd apps/backend
```

### 4. Installer les dépendances (si nécessaire)

```bash
pnpm install
```

### 5. Rebuild le backend NestJS

```bash
pnpm build
```

**Vérification:** Le build doit passer sans erreur TypeScript.

### 6. Arrêter et supprimer l'ancien process PM2 (si présent)

```bash
pm2 stop secondlife-api
pm2 delete secondlife-api
```

### 7. Démarrer l'API avec PM2

```bash
pm2 start dist/main.js --name secondlife-api
```

### 8. Sauvegarder la configuration PM2

```bash
pm2 save
pm2 update
```

### 9. Vérifier le statut PM2

```bash
pm2 status
pm2 logs secondlife-api --lines 50
```

### 10. Tester l'API localement

```bash
curl http://127.0.0.1:4000/api/v1/health
# ou
curl http://127.0.0.1:4000/
```

**Résultat attendu:** Réponse HTTP 200 avec du JSON.

---

## 🔧 C) CONFIGURATION NGINX

### 1. Créer le fichier de configuration NGINX

```bash
sudo nano /etc/nginx/sites-available/secondlife-api
```

### 2. Copier-coller la configuration suivante

```nginx
server {
    listen 80;
    server_name api.secondelife-exchange.fr;

    # Logs
    access_log /var/log/nginx/secondlife-api-access.log;
    error_log /var/log/nginx/secondlife-api-error.log;

    # Taille maximale des uploads (ajustez selon vos besoins)
    client_max_body_size 10M;

    # Proxy vers l'API NestJS
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        
        # Headers pour le reverse proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support (pour Socket.io)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint (optionnel, pour monitoring)
    location /health {
        proxy_pass http://127.0.0.1:4000/api/v1/health;
        access_log off;
    }
}
```

### 3. Activer le site NGINX

```bash
sudo ln -s /etc/nginx/sites-available/secondlife-api /etc/nginx/sites-enabled/
```

### 4. Tester la configuration NGINX

```bash
sudo nginx -t
```

**Résultat attendu:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### 5. Recharger NGINX

```bash
sudo systemctl reload nginx
```

### 6. Vérifier le statut NGINX

```bash
sudo systemctl status nginx
```

---

## 🔒 D) CONFIGURATION SSL (CERTBOT)

### 1. Installer Certbot (si pas déjà installé)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtenir le certificat SSL

```bash
sudo certbot --nginx -d api.secondelife-exchange.fr
```

**Suivre les instructions:**
- Entrer votre email
- Accepter les termes
- Choisir de rediriger HTTP vers HTTPS (option 2)

### 3. Vérifier le renouvellement automatique

```bash
sudo certbot renew --dry-run
```

---

## 🧪 E) TESTS FINAUX

### 1. Test HTTP (avant SSL)

```bash
curl http://api.secondelife-exchange.fr/api/v1/health
```

### 2. Test HTTPS (après SSL)

```bash
curl https://api.secondelife-exchange.fr/api/v1/health
```

### 3. Vérifier les logs PM2

```bash
pm2 logs secondlife-api --lines 100
```

### 4. Vérifier les logs NGINX

```bash
sudo tail -f /var/log/nginx/secondlife-api-access.log
sudo tail -f /var/log/nginx/secondlife-api-error.log
```

---

## 📝 NOTES IMPORTANTES

1. **Port backend:** Par défaut `4000`, configurable via `API_PORT` dans `.env`
2. **CORS:** Vérifier que `CORS_ORIGIN` dans `.env` inclut le domaine frontend
3. **Variables d'environnement:** S'assurer que `.env` est correctement configuré dans `/var/www/SecondLife-Exchange/apps/backend/`
4. **Base de données:** Vérifier que PostgreSQL est accessible et que `DATABASE_URL` est correcte
5. **PM2:** Le process `secondlife-api` redémarre automatiquement en cas de crash si `pm2 save` a été exécuté

---

## 🚨 EN CAS DE PROBLÈME

### PM2 ne démarre pas
```bash
pm2 logs secondlife-api --err
cd /var/www/SecondLife-Exchange/apps/backend
node dist/main.js  # Tester directement
```

### NGINX erreur 502
```bash
# Vérifier que l'API tourne
pm2 status
curl http://127.0.0.1:4000/api/v1/health

# Vérifier les logs NGINX
sudo tail -50 /var/log/nginx/secondlife-api-error.log
```

### Erreur TypeScript au build
```bash
cd /var/www/SecondLife-Exchange/apps/backend
pnpm build 2>&1 | tee build.log
```

---

## ✅ RÉSUMÉ DES COMMANDES (COPIE-COLLER RAPIDE)

```bash
# 1. Aller dans le projet
cd /var/www/SecondLife-Exchange/apps/backend

# 2. Build
pnpm build

# 3. PM2
pm2 stop secondlife-api 2>/dev/null || true
pm2 delete secondlife-api 2>/dev/null || true
pm2 start dist/main.js --name secondlife-api
pm2 save
pm2 update

# 4. Test local
curl http://127.0.0.1:4000/api/v1/health

# 5. NGINX (après avoir créé le fichier de config)
sudo ln -s /etc/nginx/sites-available/secondlife-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. SSL (après NGINX)
sudo certbot --nginx -d api.secondelife-exchange.fr
```


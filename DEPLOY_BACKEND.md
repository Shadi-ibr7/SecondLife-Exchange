# Guide de déploiement Backend sur VPS Hostinger

## Prérequis

1. Accès SSH au VPS Hostinger
2. Node.js 20+ et pnpm installés sur le VPS
3. Base de données PostgreSQL configurée
4. Variables d'environnement configurées

## Étapes de déploiement

### 1. Connexion SSH au VPS

```bash
ssh votre-utilisateur@votre-ip-hostinger
```

### 2. Cloner/Mettre à jour le repository

```bash
cd /chemin/vers/votre/projet
git pull origin main
```

### 3. Installer les dépendances

```bash
pnpm install
```

### 4. Configurer les variables d'environnement

```bash
cd apps/backend
cp env.example .env
nano .env  # Éditer avec vos vraies valeurs
```

Variables importantes:
- `DATABASE_URL` - URL de connexion PostgreSQL
- `JWT_SECRET` - Secret pour les tokens JWT
- `JWT_REFRESH_SECRET` - Secret pour les refresh tokens
- `CLOUDINARY_*` - Credentials Cloudinary
- `GEMINI_API_KEY` - Clé API Gemini
- `PORT` - Port d'écoute (par défaut 3000)

### 5. Générer Prisma Client

```bash
cd apps/backend
pnpm prisma:generate
```

### 6. Appliquer les migrations

```bash
pnpm prisma:deploy
```

### 7. Build du backend

```bash
cd apps/backend
pnpm build
```

### 8. Démarrer avec PM2 (recommandé)

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
cd apps/backend
pm2 start dist/main.js --name "secondlife-backend"

# Sauvegarder la configuration PM2
pm2 save
pm2 startup  # Suivre les instructions pour le démarrage automatique
```

### 9. Vérifier le statut

```bash
pm2 status
pm2 logs secondlife-backend
```

## Commandes PM2 utiles

```bash
pm2 restart secondlife-backend    # Redémarrer
pm2 stop secondlife-backend      # Arrêter
pm2 delete secondlife-backend    # Supprimer
pm2 logs secondlife-backend      # Voir les logs
pm2 monit                        # Monitoring en temps réel
```

## Mise à jour du backend

```bash
# 1. Se connecter au VPS
ssh votre-utilisateur@votre-ip

# 2. Aller dans le dossier du projet
cd /chemin/vers/votre/projet

# 3. Récupérer les dernières modifications
git pull origin main

# 4. Installer les nouvelles dépendances
pnpm install

# 5. Générer Prisma Client
cd apps/backend
pnpm prisma:generate

# 6. Appliquer les migrations si nécessaire
pnpm prisma:deploy

# 7. Rebuild
pnpm build

# 8. Redémarrer avec PM2
pm2 restart secondlife-backend
```

## Configuration Nginx (reverse proxy)

Si vous utilisez Nginx, ajoutez cette configuration:

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Vérification

```bash
# Tester l'API
curl http://localhost:3000/health

# Voir les logs en temps réel
pm2 logs secondlife-backend --lines 50
```

## Troubleshooting

1. **Port déjà utilisé**: Changer le PORT dans `.env`
2. **Erreur Prisma**: Vérifier `DATABASE_URL` et exécuter `pnpm prisma:generate`
3. **Erreur de build**: Vérifier Node.js version (`node -v` doit être >= 20)
4. **PM2 ne démarre pas**: Vérifier les logs avec `pm2 logs`


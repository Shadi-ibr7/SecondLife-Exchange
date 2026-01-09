# 🚀 Déploiement Rapide Backend - VPS Hostinger

## Commande rapide (après configuration initiale)

```bash
ssh votre-utilisateur@votre-ip
cd /chemin/vers/SecondLife-Exchange
git pull origin main
cd apps/backend
pnpm install && pnpm prisma:generate && pnpm prisma:deploy && pnpm build
pm2 restart secondlife-backend
```

## Configuration initiale (une seule fois)

### 1. Sur votre VPS Hostinger

```bash
# Installer Node.js 20+ et pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Installer PM2
npm install -g pm2

# Cloner le repository
git clone https://github.com/Shadi-ibr7/SecondLife-Exchange.git
cd SecondLife-Exchange
```

### 2. Configurer l'environnement

```bash
cd apps/backend
cp env.example .env
nano .env  # Éditer avec vos vraies valeurs
```

**Variables obligatoires à configurer:**
- `DATABASE_URL` - Votre URL PostgreSQL Hostinger
- `JWT_ACCESS_SECRET` - Générer avec: `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` - Générer avec: `openssl rand -hex 32`
- `ADMIN_JWT_SECRET` - Générer avec: `openssl rand -hex 32`
- `CLOUDINARY_*` - Vos credentials Cloudinary
- `AI_GEMINI_API_KEY` - Votre clé API Gemini
- `PORT` - Port d'écoute (ex: 4000)

### 3. Première installation

```bash
# Depuis la racine du projet
pnpm install
cd apps/backend
pnpm prisma:generate
pnpm prisma:deploy
pnpm build
pm2 start dist/main.js --name "secondlife-backend"
pm2 save
pm2 startup  # Suivre les instructions
```

## Mise à jour (après chaque push)

```bash
# Option 1: Script automatique
./scripts/deploy-backend.sh

# Option 2: Manuel
git pull origin main
cd apps/backend
pnpm install
pnpm prisma:generate
pnpm prisma:deploy
pnpm build
pm2 restart secondlife-backend
```

## Vérification

```bash
# Vérifier que le backend tourne
pm2 status

# Voir les logs
pm2 logs secondlife-backend

# Tester l'API
curl http://localhost:4000/health
```

## Configuration Nginx (optionnel)

Si vous avez un domaine, configurez Nginx:

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Puis redémarrer Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```


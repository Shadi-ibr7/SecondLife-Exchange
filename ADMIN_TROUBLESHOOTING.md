# Guide de dépannage - Espace Administrateur

## Problème : Aucune donnée ne s'affiche dans l'espace admin

### 1. Vérifier que le backend est démarré

```bash
# Dans le terminal, vérifier si le backend tourne
curl http://localhost:4000/api/v1/health

# Si ça ne répond pas, démarrer le backend
cd apps/backend
pnpm dev
```

### 2. Vérifier les variables d'environnement

#### Backend (`apps/backend/.env`)
Assurez-vous que ces variables sont définies :
```env
ADMIN_BASE_PATH=greenroom-core-qlf18scha7
ADMIN_JWT_SECRET=7fd1e36f7aabbd670a00e7669edabc154c618901d4be8a477f3140b0a60ba40efa616bb669856fd072922a3dbb3b9fb857a033ef65e77a70a07cf04ac57c98ef
API_PORT=4000
```

#### Frontend (`apps/frontend/.env.local`)
Créez ce fichier s'il n'existe pas :
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ADMIN_BASE_PATH=greenroom-core-qlf18scha7
```

### 3. Vérifier la console du navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Regardez les erreurs en rouge
4. Allez dans l'onglet "Network"
5. Vérifiez si les requêtes vers `/api/v1/greenroom-core-qlf18scha7/dashboard` échouent

### 4. Vérifier l'authentification

1. Allez sur `/greenroom-core-qlf18scha7/login`
2. Connectez-vous avec les identifiants admin
3. Vérifiez que le token est bien sauvegardé dans le localStorage

### 5. Tester l'API directement

```bash
# Récupérer le token depuis le localStorage du navigateur
# Puis tester l'endpoint
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  http://localhost:4000/api/v1/greenroom-core-qlf18scha7/dashboard
```

### 6. Vérifier les logs backend

Dans le terminal où tourne le backend, vous devriez voir :
- Les requêtes entrantes
- Les erreurs éventuelles
- Les logs de connexion

### 7. Redémarrer les serveurs

```bash
# Arrêter tous les serveurs (Ctrl+C)
# Puis redémarrer
pnpm dev
```

## Erreurs courantes

### "Network Error" ou "ECONNREFUSED"
- Le backend n'est pas démarré
- L'URL de l'API est incorrecte
- Le port 4000 est utilisé par un autre processus

### "401 Unauthorized"
- Le token admin a expiré
- Vous n'êtes pas connecté
- Le token n'est pas valide

### "403 Forbidden"
- Votre compte n'a pas les droits admin
- Le rôle utilisateur n'est pas ADMIN

### "404 Not Found"
- L'endpoint n'existe pas
- Le `ADMIN_BASE_PATH` ne correspond pas entre frontend et backend

## Solution rapide

1. **Créer le fichier `.env.local` dans `apps/frontend/`** :
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ADMIN_BASE_PATH=greenroom-core-qlf18scha7
```

2. **Redémarrer le frontend** :
```bash
cd apps/frontend
pnpm dev
```

3. **Vérifier que le backend tourne** :
```bash
cd apps/backend
pnpm dev
```

4. **Se connecter à nouveau** :
- Allez sur `http://localhost:3000/greenroom-core-qlf18scha7/login`
- Connectez-vous avec les identifiants admin


# Déploiement sur Vercel

Ce document explique comment déployer le frontend Next.js de SecondLife Exchange sur Vercel.

## Configuration du projet Vercel

### 1. Root Directory

**IMPORTANT** : Le Root Directory doit être configuré dans l'interface Vercel, **PAS** dans `vercel.json`.

1. Allez dans **Project Settings** → **General**
2. Dans la section **Root Directory**, sélectionnez : `apps/frontend`
3. Cliquez sur **Save**

⚠️ **Ne pas utiliser** la propriété `rootDirectory` dans `vercel.json` car elle n'est pas supportée par le schéma Vercel.

### 2. Framework Detection

Vercel détectera automatiquement Next.js grâce à :
- La présence de `next` dans `apps/frontend/package.json`
- Le script `build` dans `apps/frontend/package.json`
- La configuration `framework: "nextjs"` dans `vercel.json`

### 3. Build Settings

Le fichier `vercel.json` à la racine configure :
- **Build Command** : `cd apps/frontend && pnpm build`
- **Output Directory** : `apps/frontend/.next`
- **Install Command** : `pnpm install --frozen-lockfile`

Ces commandes sont nécessaires car le Root Directory est configuré dans l'UI, mais les commandes s'exécutent depuis la racine du monorepo.

### 4. Variables d'environnement

Configurez les variables d'environnement suivantes dans **Project Settings** → **Environment Variables** :

#### Variables requises

- `NEXT_PUBLIC_API_URL` : URL de l'API backend (ex: `https://api.example.com`)
- `NEXT_PUBLIC_WS_URL` : URL du WebSocket (ex: `wss://api.example.com`)

#### Variables optionnelles

- `NEXT_PUBLIC_FIREBASE_API_KEY` : Clé API Firebase (si utilisé)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` : Domaine d'authentification Firebase
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` : ID du projet Firebase
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` : Bucket de stockage Firebase
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` : ID de l'expéditeur Firebase
- `NEXT_PUBLIC_FIREBASE_APP_ID` : ID de l'application Firebase

### 5. Git Configuration

#### Commit ou Branch Reference

Dans **Project Settings** → **Git**, assurez-vous que :
- **Production Branch** : `main` (ou `master` selon votre repo)
- **Commit Reference** : Ne pas utiliser une URL GitHub, mais plutôt le nom de la branche

### 6. Déploiement

1. Connectez votre repository GitHub/GitLab/Bitbucket à Vercel
2. Configurez le Root Directory comme indiqué ci-dessus
3. Ajoutez les variables d'environnement
4. Vercel détectera automatiquement les changements et déploiera

## Structure du monorepo

```
SecondLife-Exchange/
├── apps/
│   ├── frontend/          ← Root Directory Vercel
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── ...
│   └── backend/           ← Non déployé sur Vercel
├── vercel.json            ← Configuration Vercel
└── ...
```

## Dépannage

### Erreur : "vercel.json schema validation failed"

Si vous voyez cette erreur avec `rootDirectory` :
- ✅ Supprimez `rootDirectory` de `vercel.json`
- ✅ Configurez le Root Directory dans l'UI Vercel (Project Settings → General)

### Build échoue

1. Vérifiez que `pnpm` est installé (ou changez `installCommand` pour `npm install`)
2. Vérifiez que toutes les variables d'environnement sont configurées
3. Consultez les logs de build dans l'interface Vercel

### Next.js non détecté

1. Vérifiez que le Root Directory est bien `apps/frontend`
2. Vérifiez que `apps/frontend/package.json` contient `next` dans les dépendances
3. Vérifiez que le script `build` existe dans `package.json`

## Références

- [Documentation Vercel - Monorepos](https://vercel.com/docs/monorepos)
- [Documentation Vercel - Root Directory](https://vercel.com/docs/projects/overview#root-directory)


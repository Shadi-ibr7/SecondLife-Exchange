# Déploiement sur Vercel - Monorepo pnpm

Ce document explique comment déployer le frontend Next.js de SecondLife Exchange sur Vercel dans un monorepo pnpm.

## 📍 Chemin du frontend Next.js

**Chemin exact** : `apps/frontend`

Le frontend Next.js se trouve dans le dossier `apps/frontend/` à la racine du monorepo.

## ⚙️ Configuration Vercel

### 1. Root Directory (OBLIGATOIRE)

**IMPORTANT** : Le Root Directory doit être configuré dans l'interface Vercel, **PAS** dans `vercel.json`.

1. Allez dans **Project Settings** → **General**
2. Dans la section **Root Directory**, entrez ou sélectionnez : `apps/frontend`
3. Cliquez sur **Save**

⚠️ **Ne pas utiliser** la propriété `rootDirectory` dans `vercel.json` car elle n'est pas supportée par le schéma Vercel et causera une erreur de validation.

### 2. Build Settings

Le fichier `vercel.json` à la racine du monorepo configure les commandes de build. **Important** : Ces commandes s'exécutent depuis le Root Directory (`apps/frontend`), donc elles sont relatives à ce dossier.

Configuration actuelle dans `vercel.json` :
- **Build Command** : `pnpm build` (s'exécute depuis `apps/frontend`)
- **Output Directory** : `.next` (relatif au Root Directory)
- **Install Command** : `pnpm install --frozen-lockfile` (installe depuis la racine du monorepo)

### 3. Framework Detection

Vercel détectera automatiquement Next.js grâce à :
- La présence de `next` dans `apps/frontend/package.json` (version `^15.0.0`)
- Le script `build` dans `apps/frontend/package.json`
- La configuration `framework: "nextjs"` dans `vercel.json`

### 4. Variables d'environnement

Configurez les variables d'environnement suivantes dans **Project Settings** → **Environment Variables** :

#### Variables requises

- `NEXT_PUBLIC_API_URL` : URL de l'API backend
  - Exemple : `https://api.votre-domaine.com`
  - Ou en développement : `http://localhost:3001`

- `NEXT_PUBLIC_WS_URL` : URL du WebSocket
  - Exemple : `wss://api.votre-domaine.com`
  - Ou en développement : `ws://localhost:3001`

#### Variables optionnelles (Firebase)

Si vous utilisez Firebase pour les notifications push :
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Variables optionnelles (Cloudinary)

Si vous utilisez Cloudinary pour les images :
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`

### 5. Git Configuration

#### Commit ou Branch Reference

Dans **Project Settings** → **Git**, assurez-vous que :
- **Production Branch** : `main` (ou `master` selon votre repo)
- **Commit Reference** : ⚠️ **Ne pas utiliser une URL GitHub** (ex: `https://github.com/user/repo/commit/abc123`)
  - Utilisez plutôt le nom de la branche : `main`
  - Ou laissez Vercel détecter automatiquement depuis la connexion Git

### 6. Déploiement

1. Connectez votre repository GitHub/GitLab/Bitbucket à Vercel
2. Configurez le **Root Directory** : `apps/frontend` (dans Project Settings → General)
3. Ajoutez les **variables d'environnement** requises
4. Vercel détectera automatiquement les changements et déploiera

## 📁 Structure du monorepo

```
SecondLife-Exchange/
├── apps/
│   ├── frontend/          ← Root Directory Vercel = "apps/frontend"
│   │   ├── package.json  ← Contient "next" et script "build"
│   │   ├── next.config.js
│   │   ├── src/
│   │   │   └── app/      ← Next.js App Router
│   │   └── ...
│   └── backend/          ← Non déployé sur Vercel
├── vercel.json           ← Configuration Vercel (à la racine)
├── pnpm-workspace.yaml   ← Configuration monorepo pnpm
└── ...
```

## 🔧 Scripts disponibles dans apps/frontend

Le `package.json` du frontend contient les scripts suivants :
- `dev` : Démarre le serveur de développement
- `build` : Build de production (utilisé par Vercel)
- `start` : Démarre le serveur de production
- `lint` : Lint du code
- `typecheck` : Vérification TypeScript
- `test` : Tests Jest

## 🐛 Dépannage

### Erreur : "cd apps/frontend: No such file or directory"

**Cause** : Le Root Directory est configuré dans Vercel UI comme `apps/frontend`, mais le `buildCommand` dans `vercel.json` essaie de faire `cd apps/frontend`.

**Solution** :
- ✅ Vérifiez que le Root Directory dans Vercel UI est bien `apps/frontend`
- ✅ Vérifiez que `vercel.json` utilise `pnpm build` (sans `cd apps/frontend`)
- ✅ Vérifiez que `outputDirectory` est `.next` (pas `apps/frontend/.next`)

### Erreur : "vercel.json schema validation failed"

Si vous voyez cette erreur avec `rootDirectory` :
- ✅ Supprimez `rootDirectory` de `vercel.json`
- ✅ Configurez le Root Directory dans l'UI Vercel (Project Settings → General)

### Build échoue

1. Vérifiez que `pnpm` est installé (Vercel le détecte automatiquement via `pnpm-lock.yaml`)
2. Vérifiez que toutes les variables d'environnement requises sont configurées
3. Consultez les logs de build dans l'interface Vercel (onglet "Deployments" → clic sur le déploiement → "Build Logs")

### Next.js non détecté

1. Vérifiez que le Root Directory est bien `apps/frontend` (exactement, sans slash final)
2. Vérifiez que `apps/frontend/package.json` contient `next` dans les dépendances
3. Vérifiez que le script `build` existe dans `apps/frontend/package.json`
4. Vérifiez que `apps/frontend/next.config.js` existe

### Erreur : "Cannot find module"

Si vous avez des erreurs de modules non trouvés :
1. Vérifiez que `pnpm install --frozen-lockfile` s'exécute correctement
2. Vérifiez que le `pnpm-lock.yaml` est à jour et commité
3. Vérifiez que toutes les dépendances sont bien listées dans `apps/frontend/package.json`

## 📚 Références

- [Documentation Vercel - Monorepos](https://vercel.com/docs/monorepos)
- [Documentation Vercel - Root Directory](https://vercel.com/docs/projects/overview#root-directory)
- [Documentation Vercel - Build Settings](https://vercel.com/docs/projects/overview#build-settings)

# Guide de déploiement Vercel - Espace Admin

## Problème : Les nouvelles pages admin ne s'affichent pas après déploiement

### Cause probable : Cache Vercel ou variables d'environnement

## Solution 1 : Vérifier les variables d'environnement sur Vercel

1. **Allez sur https://vercel.com/dashboard**
2. **Sélectionnez votre projet**
3. **Allez dans Settings > Environment Variables**
4. **Vérifiez que ces variables sont définies :**
   ```
   NEXT_PUBLIC_API_URL=https://votre-backend-url.com
   NEXT_PUBLIC_ADMIN_BASE_PATH=greenroom-core-qlf18scha7
   ```

## Solution 2 : Invalider le cache Vercel

1. **Sur Vercel Dashboard :**
   - Allez dans votre projet
   - Cliquez sur "Deployments"
   - Trouvez le dernier déploiement
   - Cliquez sur les 3 points (...) > "Redeploy"
   - Cochez "Use existing Build Cache" = **NON**

## Solution 3 : Désactiver temporairement le cache PWA

Le PWA peut cacher les anciennes versions. Pour tester :

1. **Modifier `next.config.js` :**
   ```js
   const withPWA = require('next-pwa')({
     dest: 'public',
     register: true,
     skipWaiting: true,
     disable: true, // Désactiver complètement pour tester
     // ou
     disable: process.env.NODE_ENV === 'production', // Désactiver seulement en production
   });
   ```

2. **Pousser les changements et redéployer**

## Solution 4 : Forcer un nouveau build

1. **Créer un commit vide :**
   ```bash
   git commit --allow-empty -m "chore: force rebuild"
   git push origin main
   ```

2. **Sur Vercel, supprimer le cache :**
   - Settings > General
   - Scroll down to "Build & Development Settings"
   - Cliquez sur "Clear Build Cache"

## Solution 5 : Configurer rootDirectory dans Vercel

**IMPORTANT** : Pour un monorepo, vous devez configurer `rootDirectory` dans l'interface Vercel :

1. **Allez sur Vercel Dashboard** → Votre projet → **Settings** → **General**
2. **Scroll down** jusqu'à "Build & Development Settings"
3. **Définissez "Root Directory"** à : `apps/frontend`
4. **Sauvegardez**

Cette configuration dans l'interface Vercel est nécessaire car `rootDirectory` ne peut pas être défini dans `vercel.json`.

## Solution 6 : Vérifier la configuration de build

Assurez-vous que `vercel.json` est correct :

```json
{
  "buildCommand": "pnpm --filter @secondlife/frontend build",
  "outputDirectory": "apps/frontend/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

**Note** : Si vous avez configuré `rootDirectory` dans l'interface Vercel, vous pouvez simplifier :
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

## Solution 6 : Vérifier les routes générées

Après le build, vérifiez que les routes admin sont bien générées :

```bash
# Localement, après le build
ls -la apps/frontend/.next/server/app/(admin)/\[adminSlug\]/
```

## Vérification après déploiement

1. **Ouvrir la console du navigateur (F12)**
2. **Aller dans l'onglet Network**
3. **Naviguer vers `/greenroom-core-qlf18scha7/settings`**
4. **Vérifier que la requête retourne 200 et non 404**

## Si le problème persiste

1. **Vérifier les logs de build Vercel :**
   - Allez dans Deployments > Cliquez sur le dernier déploiement
   - Vérifiez les logs pour voir s'il y a des erreurs

2. **Vérifier que le serveur backend est accessible :**
   - La variable `NEXT_PUBLIC_API_URL` doit pointer vers votre backend en production

3. **Tester localement en mode production :**
   ```bash
   cd apps/frontend
   pnpm build
   pnpm start
   ```
   - Vérifiez que les routes admin fonctionnent


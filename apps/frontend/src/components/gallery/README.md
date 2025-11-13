# Galerie Unsplash

Ce module intègre l'API Unsplash pour afficher des photos libres de droits dans l'application SecondLife Exchange.

## Configuration

1. **Variables d'environnement** (`.env.local`) :
```env
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key_here
NEXT_PUBLIC_UNSPLASH_API_URL=https://api.unsplash.com
```

2. **Clé API Unsplash** :
   - Créez un compte sur [Unsplash Developers](https://unsplash.com/developers)
   - Créez une nouvelle application
   - Copiez votre Access Key dans `.env.local`

## Composants

### `UnsplashGallery`
Composant principal qui affiche une galerie de photos avec recherche.

**Props :**
- `query` (string, optionnel) : Mot-clé de recherche initial
- `showSearch` (boolean, optionnel) : Afficher le champ de recherche (défaut: true)

**Exemple :**
```tsx
<UnsplashGallery query="vintage eco friendly crafts" showSearch={true} />
```

### `UnsplashSearch`
Composant de recherche pour changer les mots-clés.

**Props :**
- `onSearch` (function) : Callback appelé avec la nouvelle requête
- `initialQuery` (string, optionnel) : Requête initiale

### `UnsplashSkeleton`
Composant de chargement avec skeleton UI.

## Hook

### `useUnsplashImages`
Hook React Query pour récupérer les images.

**Paramètres :**
- `query` (string) : Mot-clé de recherche
- `page` (number, optionnel) : Page de résultats (défaut: 1)
- `perPage` (number, optionnel) : Nombre d'images par page (défaut: 12)

## API

### `fetchUnsplashPhotos`
Fonction pour récupérer les photos depuis l'API Unsplash.

### `triggerDownload`
Fonction pour déclencher le téléchargement (requis par Unsplash).

## Respect des guidelines Unsplash

✅ **Hotlinking** : Les images restent hébergées sur Unsplash  
✅ **Attribution** : Attribution "Photo by [nom] on Unsplash" incluse  
✅ **Trigger download** : Appelé automatiquement lors du clic  
✅ **Pas de rehosting** : Aucune sauvegarde locale des images  
✅ **Pas de logo Unsplash** : Utilisation conforme aux guidelines  

## Utilisation

```tsx
import UnsplashGallery from '@/components/gallery/UnsplashGallery';

export default function MyPage() {
  return (
    <div>
      <UnsplashGallery 
        query="sustainable living" 
        showSearch={true} 
      />
    </div>
  );
}
```

## Fonctionnalités

- 🔍 **Recherche en temps réel** avec suggestions
- 🎨 **Skeleton loading** pour une meilleure UX
- 📱 **Design responsive** (mobile-first)
- ⚡ **Cache intelligent** avec React Query
- 🎯 **Trigger download** automatique
- 🏷️ **Attribution complète** des photographes
- 🚫 **Gestion d'erreurs** avec fallbacks

# Sécurité Cloudinary - Documentation Complète

## Vue d'ensemble

Ce document décrit l'implémentation sécurisée des uploads Cloudinary dans l'application SecondLife-Exchange. Toutes les mesures de sécurité ont été mises en place pour garantir qu'aucun secret n'est exposé côté client et que tous les uploads sont strictement contrôlés et validés.

## Principes de Sécurité

### 1. Aucun Secret Exposé Côté Client
- ✅ **CLOUDINARY_API_SECRET** reste **JAMAIS** côté serveur
- ✅ **api_key** (publique) est fournie via la signature backend
- ✅ **cloud_name** (publique) est fournie via la signature backend
- ❌ **NEXT_PUBLIC_CLOUDINARY_API_KEY** a été retiré du frontend

### 2. Uploads Signés Obligatoires
- ✅ Tous les uploads nécessitent une signature générée côté backend
- ✅ La signature expire après **60 secondes** (sécurité renforcée)
- ✅ La signature est calculée avec HMAC SHA-1

### 3. Validations Strictes
- ✅ **Folder imposé**: uniquement `items/<itemId>` ou `profiles/<userId>`
- ✅ **Resource type limité**: `image` uniquement
- ✅ **Formats autorisés**: jpg, jpeg, png, webp uniquement
- ✅ **Taille maximale**: 3MB (configurable)
- ✅ **Transformations autorisées**: whitelist stricte (f_webp,q_auto,w_800,h_600,c_fill)
- ✅ **Nombre de fichiers**: limité par item/profil

### 4. Ownership Validation
- ✅ Pour `items/<itemId>`: vérifie que `item.ownerId === user.id`
- ✅ Pour `profiles/<userId>`: vérifie que `userId === user.id`
- ✅ Empêche les uploads dans les dossiers d'autres utilisateurs

## Architecture du Flux d'Upload

### Flux Sécurisé

```
┌─────────┐        1. POST /uploads/cloudinary/sign        ┌──────────┐
│         │  { folder: "items/<itemId>" }                  │          │
│ Frontend│ ────────────────────────────────────────────> │ Backend  │
│         │                                                │          │
│         │  ←─────────────────────────────────────────── │          │
│         │  { signature, timestamp, folder, public_id,   │          │
│         │    api_key, cloud_name, resource_type, ... }  │          │
│         │                                                │          │
└─────────┘                                                └──────────┘

┌─────────┐        2. POST vers Cloudinary                 ┌──────────────┐
│         │  FormData: {                                   │              │
│ Frontend│    file,                                       │  Cloudinary  │
│         │    api_key,                                    │              │
│         │    signature,                                  │              │
│         │    timestamp,                                  │              │
│         │    folder,                                     │              │
│         │    public_id,                                  │              │
│         │    resource_type: "image",                     │              │
│         │    transformation                              │              │
│         │  }                                             │              │
│         │ ────────────────────────────────────────────> │              │
│         │                                                │              │
│         │  ←─────────────────────────────────────────── │              │
│         │  { secure_url, public_id, width, height, ... }│              │
└─────────┘                                                └──────────────┘

┌─────────┐        3. POST /items/<itemId>/photos          ┌──────────┐
│         │  { photos: [{ url, publicId, width, height }] }│          │
│ Frontend│ ────────────────────────────────────────────> │ Backend  │
│         │                                                │          │
│         │  ←─────────────────────────────────────────── │          │
│         │  Validation + Enregistrement en DB            │          │
└─────────┘                                                └──────────┘
```

## Endpoints Backend

### POST /api/v1/uploads/cloudinary/sign

**Authentification**: JWT requise

**Body**:
```json
{
  "folder": "items/<itemId>" // ou "profiles" ou "profiles/<userId>"
}
```

**Réponse**:
```json
{
  "signature": "abc123...",
  "timestamp": 1234567890,
  "folder": "items/abc-123",
  "public_id": "items/abc-123/1234567890_xyz",
  "allowed_formats": ["jpg", "jpeg", "png", "webp"],
  "max_bytes": 3000000,
  "transformation": "f_webp,q_auto,w_800,h_600,c_fill",
  "resource_type": "image",
  "api_key": "1234567890",
  "cloud_name": "your-cloud-name"
}
```

**Validations**:
1. User authentifié (JWT)
2. Folder respecte les patterns autorisés
3. Pour `items/<itemId>`: vérifie ownership
4. Pour `profiles`: vérifie que le userId correspond à l'user authentifié
5. Rate limiting: 20 requêtes/minute

**Expiration**: La signature expire après **60 secondes**

### POST /api/v1/items/:id/photos

**Authentification**: JWT requise

**Body**:
```json
{
  "photos": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "items/abc-123/1234567890_xyz",
      "width": 800,
      "height": 600
    }
  ]
}
```

**Validations**:
1. User authentifié (JWT)
2. Item existe
3. User est propriétaire de l'item
4. URL provient de Cloudinary
5. URL correspond au folder attendu (`items/<itemId>`)
6. Nombre maximum de photos non atteint (5 par défaut)
7. Limite de batch: 5 photos maximum par requête

## Signature Cloudinary

### Paramètres Signés

Les paramètres suivants sont inclus dans la signature HMAC SHA-1:

```javascript
{
  timestamp: 1234567890,          // Timestamp Unix (expire après 60s)
  folder: "items/abc-123",        // Dossier imposé
  public_id: "items/abc-123/...", // ID public unique
  resource_type: "image",         // LIMITE STRICTE: images uniquement
  transformation: "f_webp,q_auto,w_800,h_600,c_fill" // Transformations autorisées
}
```

### Calcul de la Signature

```javascript
// 1. Trier les paramètres par clé (ordre alphabétique)
const sortedParams = Object.keys(params)
  .sort()
  .map(key => `${key}=${params[key]}`)
  .join('&');

// 2. Ajouter le secret API Cloudinary (jamais exposé)
const toSign = sortedParams + CLOUDINARY_API_SECRET;

// 3. Hash avec SHA-1
const signature = createHash('sha1').update(toSign).digest('hex');
```

## Validations Côté Backend

### 1. Validation du Folder

```typescript
// Whitelist stricte
const allowedBaseFolders = ['items', 'profiles', 'eco-content'];

// Pour items/<itemId>
if (baseFolder === 'items' && folderParts.length === 2) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (item.ownerId !== userId) {
    throw new ForbiddenException('Ownership invalide');
  }
}

// Pour profiles/<userId>
if (baseFolder === 'profiles') {
  if (folderParts.length === 2 && folderParts[1] !== userId) {
    throw new ForbiddenException('Vous ne pouvez uploader que dans votre propre profil');
  }
}
```

### 2. Validation de l'URL Cloudinary

```typescript
// Vérifier que l'URL correspond au folder attendu
validateCloudinaryUrl(url: string, expectedFolder: string): boolean {
  // 1. Vérifier que l'URL provient de Cloudinary
  const pattern = /^https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\//;
  
  // 2. Extraire le public_id de l'URL
  const publicId = extractPublicIdFromUrl(url);
  
  // 3. Vérifier que le public_id commence par le folder attendu
  if (!publicId.startsWith(expectedFolder + '/')) {
    throw new BadRequestException('URL ne correspond pas au folder attendu');
  }
  
  return true;
}
```

### 3. Validation des Formats

```typescript
// Whitelist stricte
const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
const invalidFormats = allowedFormats.filter(
  f => !validFormats.includes(f.toLowerCase())
);
if (invalidFormats.length > 0) {
  throw new BadRequestException(`Formats non autorisés: ${invalidFormats.join(', ')}`);
}
```

### 4. Validation de la Taille

```typescript
// Maximum 3MB (configurable via env)
const maxFileSize = parseInt(process.env.CLOUDINARY_MAX_FILE_SIZE || '3000000');
if (fileSize > maxFileSize) {
  throw new BadRequestException(`Taille maximale dépassée: ${maxFileSize} octets`);
}
```

## Variables d'Environnement

### Backend

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=1234567890
CLOUDINARY_API_SECRET=your-secret-key  # JAMAIS exposé côté client
CLOUDINARY_MAX_FILE_SIZE=3000000       # 3MB en octets
CLOUDINARY_MAX_PHOTOS_PER_ITEM=5       # Nombre max de photos par item
```

### Frontend

```bash
# Cloudinary Configuration (Publique uniquement)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
# NOTE: NEXT_PUBLIC_CLOUDINARY_API_KEY a été retiré
# L'api_key est maintenant fournie via la signature backend
```

## Mesures de Sécurité Implémentées

### ✅ 1. Signatures Cryptographiques
- Tous les uploads sont signés avec HMAC SHA-1
- Le secret API n'est jamais exposé côté client
- La signature expire après 60 secondes

### ✅ 2. Validation d'Ownership
- Pour `items/<itemId>`: vérifie que l'item appartient à l'utilisateur
- Pour `profiles/<userId>`: vérifie que le userId correspond à l'utilisateur authentifié
- Empêche les uploads dans les dossiers d'autres utilisateurs

### ✅ 3. Whitelists Strictes
- **Folders**: uniquement `items`, `profiles`, `eco-content`
- **Formats**: jpg, jpeg, png, webp uniquement
- **Resource type**: `image` uniquement
- **Transformations**: whitelist stricte (f_webp,q_auto,w_800,h_600,c_fill)

### ✅ 4. Validation d'URL
- Vérifie que l'URL provient de Cloudinary
- Vérifie que le public_id correspond au folder attendu
- Empêche les uploads détournés vers d'autres dossiers

### ✅ 5. Rate Limiting
- 20 requêtes de signature par minute
- 20 uploads par minute

### ✅ 6. Limites Strictes
- Taille maximale: 3MB (configurable)
- Nombre max de photos par item: 5 (configurable)
- Nombre max de photos par batch: 5

## Détection et Prévention des Attaques

### Attaque: Upload Non Signé
**Détection**: Cloudinary rejette l'upload sans signature valide
**Prévention**: Tous les uploads nécessitent une signature générée côté backend

### Attaque: Modification de la Signature
**Détection**: La signature est calculée avec le secret API (jamais exposé)
**Prévention**: Toute modification invalide la signature, Cloudinary rejette l'upload

### Attaque: Upload dans un Dossier Autre User
**Détection**: Validation d'ownership pour `items/<itemId>` et `profiles/<userId>`
**Prévention**: Le backend vérifie que l'utilisateur est propriétaire avant de générer la signature

### Attaque: Upload avec Transformation Non Autorisée
**Détection**: La transformation est incluse dans la signature (verrouillée)
**Prévention**: Toute modification de la transformation invalide la signature

### Attaque: Upload d'un Type Non Image
**Détection**: `resource_type: "image"` est inclus dans la signature
**Prévention**: Cloudinary rejette tout upload avec un resource_type différent

### Attaque: Réutilisation d'une Signature
**Détection**: La signature expire après 60 secondes
**Prévention**: Timestamp court + validation côté backend

## Tests de Sécurité

Voir `docs/CLOUDINARY_SECURITY_TESTS.md` pour les scripts curl de test.

## Configuration Cloudinary Dashboard

### Upload Preset (Optionnel)

Si vous utilisez un preset Cloudinary, configurez-le avec:

- **Mode**: Signed
- **Resource type**: Image
- **Allowed formats**: jpg, jpeg, png, webp
- **Max file size**: 3MB
- **Transformations**: f_webp,q_auto,w_800,h_600,c_fill
- **Folder**: Laissé vide (géré par la signature)

### Restrictions API

Dans le dashboard Cloudinary:

1. Allez dans **Settings > Security**
2. Configurez les restrictions:
   - **Allowed referrers**: Votre domaine (optionnel)
   - **IP whitelist**: Vide (pas nécessaire avec signatures)
   - **Signed uploads**: Activé

## Troubleshooting

### Erreur: "Signature invalide"
**Cause**: La signature ne correspond pas aux paramètres envoyés
**Solution**: Vérifier que tous les paramètres signés sont envoyés exactement comme dans la signature

### Erreur: "Signature expirée"
**Cause**: La signature a expiré (> 60 secondes)
**Solution**: Générer une nouvelle signature côté backend

### Erreur: "Dossier non autorisé"
**Cause**: Le folder ne respecte pas les patterns autorisés
**Solution**: Utiliser uniquement `items/<itemId>` ou `profiles/<userId>`

### Erreur: "Ownership invalide"
**Cause**: L'utilisateur essaie d'uploader dans un dossier qui ne lui appartient pas
**Solution**: Vérifier que l'utilisateur est propriétaire de l'item/profil

### Erreur: "URL ne correspond pas au folder attendu"
**Cause**: L'URL Cloudinary ne correspond pas au folder attendu
**Solution**: Vérifier que l'upload a été fait dans le bon folder

## Migration depuis l'Ancienne Version

Si vous migrez depuis une version où `NEXT_PUBLIC_CLOUDINARY_API_KEY` était utilisé:

1. **Retirer** `NEXT_PUBLIC_CLOUDINARY_API_KEY` de `.env.local`
2. **Retirer** `NEXT_PUBLIC_CLOUDINARY_API_KEY` de `next.config.js`
3. **Mettre à jour** le code frontend pour utiliser `api_key` depuis la signature
4. **Vérifier** que le backend retourne `api_key` et `cloud_name` dans la signature

## Références

- [Cloudinary Signed Uploads Documentation](https://cloudinary.com/documentation/upload_images#signed_uploads)
- [Cloudinary Security Best Practices](https://cloudinary.com/documentation/security)
- [HMAC SHA-1 Signature Generation](https://cloudinary.com/documentation/upload_images#generating_authentication_signatures)

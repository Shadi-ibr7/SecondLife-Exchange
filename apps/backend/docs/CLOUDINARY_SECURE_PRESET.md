# Configuration Cloudinary Preset Sécurisé

## Vue d'ensemble

Ce document décrit la configuration du preset Cloudinary pour les uploads sécurisés via signatures. Le preset doit être configuré dans le dashboard Cloudinary pour garantir que seuls les uploads signés sont acceptés.

## Objectif de sécurité

- **Aucun upload non autorisé depuis le client** : Tous les uploads doivent passer par notre backend pour obtenir une signature
- **Upload SIGNÉ uniquement** : Le preset doit être configuré en mode "signed only" (unsigned OFF)
- **Preset verrouillé** : Folder, formats, transformations sont définis et non modifiables côté client
- **Limitations strictes** : Taille max, type de fichiers, nombre d'images sont limités

## Configuration du Preset dans Cloudinary Dashboard

### Étape 1: Accéder aux Upload Presets

1. Connectez-vous au [Dashboard Cloudinary](https://cloudinary.com/console)
2. Allez dans **Settings** → **Upload** → **Upload presets**
3. Cliquez sur **Add upload preset** ou éditez le preset existant (si `ml_default`)

### Étape 2: Configuration du Preset

**Nom du preset**: `secondlife_secure` (ou garder `ml_default` si existant)

#### Paramètres essentiels:

**1. Signing Mode (Mode de signature)**
- ✅ **Signed** (ON) - **OBLIGATOIRE**
- ❌ Uncheck "Unsigned" / "Allow unsigned uploads"

> ⚠️ **CRITIQUE**: Le preset doit être en mode "Signed" uniquement pour garantir que seuls les uploads avec signature HMAC SHA-1 sont acceptés.

**2. Folder (Dossier)**
- Laisser **vide** (sera défini dynamiquement dans la signature)
- Le folder est validé et signé par le backend pour chaque upload

**3. Allowed Formats (Formats autorisés)**
- ✅ **jpg** / **jpeg**
- ✅ **png**
- ✅ **webp**
- ❌ Tous les autres formats doivent être désactivés

**4. Max File Size (Taille maximale)**
- **5 MB** (5,242,880 octets)
- Format: `5242880` bytes

**5. Transformations automatiques**
- **Format**: `f_webp` (convertir en WebP pour optimiser)
- **Quality**: `q_auto` (qualité automatique selon le contenu)
- **Width**: `w_800` (largeur max 800px)
- **Height**: `h_600` (hauteur max 600px)
- **Crop**: `c_fill` (remplir le cadre)

**Transformation complète**: `f_webp,q_auto,w_800,h_600,c_fill`

**6. Resource Type**
- **Image** uniquement

**7. Auto-detection (Optionnel)**
- ✅ **Auto-format** (pour conversion WebP automatique)

**8. Eager Transformations (Optionnel)**
- Peut être laissé vide (transformations dans l'URL de la signature)

### Étape 3: Sauvegarder

Cliquez sur **Save** pour enregistrer le preset.

## Structure des Folders

Les folders sont validés côté backend avec les patterns suivants:

- **`items/<itemId>`** : Photos d'items spécifiques
  - Vérification que l'item appartient à l'utilisateur authentifié
  - Pattern: `items/{uuid}`

- **`profiles`** : Avatars et photos de profil
  - Accessible à tous les utilisateurs authentifiés

- **`eco-content`** : Contenu écologique/éducatif
  - Accessible selon les permissions définies

## Validation Backend

Le backend valide les paramètres suivants avant de générer la signature:

1. **Folder**: Doit respecter les patterns autorisés (`items/<itemId>`, `profiles`, `eco-content`)
2. **Ownership**: Pour `items/<itemId>`, vérifie que l'item appartient à l'utilisateur
3. **Taille max**: 5MB (5,242,880 octets)
4. **Formats**: jpg, jpeg, png, webp uniquement
5. **Authentification**: JWT requis (utilisateur authentifié)

## Génération de Signature

Le backend génère une signature HMAC SHA-1 avec les paramètres suivants:

```typescript
const paramsToSign = {
  timestamp: number,           // Timestamp Unix (expire après 5 minutes)
  folder: string,              // Dossier validé (ex: "items/<itemId>")
  public_id: string,           // ID unique généré automatiquement
  transformation: string,      // "f_webp,q_auto,w_800,h_600,c_fill"
};

const signature = SHA1(sortedParams + CLOUDINARY_API_SECRET);
```

## Variables d'environnement

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret  # JAMAIS exposé côté client
CLOUDINARY_UPLOAD_PRESET=secondlife_secure        # Nom du preset (optionnel, non utilisé en signed mode)
CLOUDINARY_MAX_FILE_SIZE=5242880                   # 5MB en octets
CLOUDINARY_MAX_PHOTOS_PER_ITEM=5                   # Nombre max de photos par item
```

## Test de Sécurité

### Test 1: Upload sans signature → doit échouer

```bash
# Tenter un upload direct sans signature
curl -X POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload \
  -F "file=@test.jpg" \
  -F "folder=items/test"
```

**Résultat attendu**: Erreur `401 Unauthorized` ou rejet par Cloudinary

### Test 2: Signature valide → doit réussir

1. Obtenir une signature depuis `/api/v1/uploads/cloudinary/sign`
2. Utiliser cette signature pour uploader

**Résultat attendu**: Upload réussi avec les transformations appliquées

### Test 3: Upload pour un item qui n'appartient pas à l'user → doit échouer

1. Tenter d'obtenir une signature pour `items/{itemId}` d'un autre utilisateur

**Résultat attendu**: Erreur `403 Forbidden` du backend

## Notes importantes

1. **CLOUDINARY_API_SECRET** ne doit JAMAIS être exposé côté client
2. Le preset doit être en mode **"Signed" uniquement** (unsigned désactivé)
3. Les transformations sont incluses dans la signature pour éviter la modification
4. Le timestamp expire après 5 minutes pour éviter la réutilisation
5. Chaque upload génère un nouveau `public_id` unique

## Support

Pour toute question sur la configuration Cloudinary:
- Documentation Cloudinary: https://cloudinary.com/documentation/upload_presets
- Dashboard: https://cloudinary.com/console

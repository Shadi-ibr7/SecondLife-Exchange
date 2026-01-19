# Scripts de Test Cloudinary - Sécurité

Ce document contient des scripts curl pour tester la sécurité des uploads Cloudinary.

## Prérequis

```bash
# Variables d'environnement requises
export API_URL="http://localhost:3000/api/v1"
export JWT_TOKEN="your-jwt-token-here"
export ITEM_ID="existing-item-id"
export USER_ID="your-user-id"
```

## 1. Test: Génération de Signature Valide

### Test 1.1: Signature pour Item (Valide)

```bash
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"items/${ITEM_ID}\"
  }"
```

**Résultat attendu**: Signature générée avec succès (200 OK)

**Vérifier**:
- `signature` présent
- `timestamp` présent
- `api_key` présent (pas le secret)
- `cloud_name` présent
- `resource_type: "image"`
- `folder: "items/<itemId>"`

### Test 1.2: Signature pour Profil (Valide)

```bash
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"profiles/${USER_ID}\"
  }"
```

**Résultat attendu**: Signature générée avec succès (200 OK)

### Test 1.3: Signature pour Profil Auto (Valide)

```bash
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"profiles\"
  }"
```

**Résultat attendu**: Signature générée avec `folder: "profiles/<userId>"` (200 OK)

## 2. Tests de Sécurité: Attaques Prévenues

### Test 2.1: Upload dans Item d'un Autre User (403 Forbidden)

```bash
# Remplacer ITEM_ID par un item qui n'appartient pas à l'utilisateur
export OTHER_ITEM_ID="other-user-item-id"

curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"items/${OTHER_ITEM_ID}\"
  }"
```

**Résultat attendu**: 403 Forbidden - "Vous ne pouvez uploader des photos que pour vos propres items"

### Test 2.2: Upload dans Profil d'un Autre User (403 Forbidden)

```bash
export OTHER_USER_ID="other-user-id"

curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"profiles/${OTHER_USER_ID}\"
  }"
```

**Résultat attendu**: 403 Forbidden - "Vous ne pouvez uploader des photos que pour votre propre profil"

### Test 2.3: Folder Non Autorisé (400 Bad Request)

```bash
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"malicious/folder\"
  }"
```

**Résultat attendu**: 400 Bad Request - "Dossier de base non autorisé"

### Test 2.4: Signature Sans Authentification (401 Unauthorized)

```bash
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -d "{
    \"folder\": \"items/${ITEM_ID}\"
  }"
```

**Résultat attendu**: 401 Unauthorized

### Test 2.5: Item Inexistant (404 Not Found)

```bash
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"items/non-existent-id\"
  }"
```

**Résultat attendu**: 404 Not Found - "Item non trouvé"

## 3. Test: Upload Complet vers Cloudinary

### Test 3.1: Upload Valide

```bash
# 1. Obtenir la signature
SIGNATURE_RESPONSE=$(curl -s -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"items/${ITEM_ID}\"
  }")

# Extraire les valeurs
SIGNATURE=$(echo $SIGNATURE_RESPONSE | jq -r '.signature')
TIMESTAMP=$(echo $SIGNATURE_RESPONSE | jq -r '.timestamp')
FOLDER=$(echo $SIGNATURE_RESPONSE | jq -r '.folder')
PUBLIC_ID=$(echo $SIGNATURE_RESPONSE | jq -r '.public_id')
API_KEY=$(echo $SIGNATURE_RESPONSE | jq -r '.api_key')
CLOUD_NAME=$(echo $SIGNATURE_RESPONSE | jq -r '.cloud_name')
RESOURCE_TYPE=$(echo $SIGNATURE_RESPONSE | jq -r '.resource_type')
TRANSFORMATION=$(echo $SIGNATURE_RESPONSE | jq -r '.transformation')

# 2. Upload vers Cloudinary (remplacer image.jpg par votre fichier de test)
curl -X POST "https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${RESOURCE_TYPE}/upload" \
  -F "file=@/path/to/image.jpg" \
  -F "api_key=${API_KEY}" \
  -F "timestamp=${TIMESTAMP}" \
  -F "signature=${SIGNATURE}" \
  -F "folder=${FOLDER}" \
  -F "public_id=${PUBLIC_ID}" \
  -F "resource_type=${RESOURCE_TYPE}" \
  -F "transformation=${TRANSFORMATION}"
```

**Résultat attendu**: Upload réussi avec `secure_url`, `public_id`, etc.

### Test 3.2: Upload avec Signature Modifiée (Erreur Cloudinary)

```bash
# Générer une signature valide puis modifier un paramètre
SIGNATURE_RESPONSE=$(curl -s -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"folder\": \"items/${ITEM_ID}\"
  }")

SIGNATURE=$(echo $SIGNATURE_RESPONSE | jq -r '.signature')
TIMESTAMP=$(echo $SIGNATURE_RESPONSE | jq -r '.timestamp')
FOLDER=$(echo $SIGNATURE_RESPONSE | jq -r '.folder')
PUBLIC_ID=$(echo $SIGNATURE_RESPONSE | jq -r '.public_id')
API_KEY=$(echo $SIGNATURE_RESPONSE | jq -r '.api_key')
CLOUD_NAME=$(echo $SIGNATURE_RESPONSE | jq -r '.cloud_name')
RESOURCE_TYPE=$(echo $SIGNATURE_RESPONSE | jq -r '.resource_type')

# Modifier le folder pour tenter un détournement
MALICIOUS_FOLDER="items/other-item-id"

# Upload avec folder modifié (devrait échouer)
curl -X POST "https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${RESOURCE_TYPE}/upload" \
  -F "file=@/path/to/image.jpg" \
  -F "api_key=${API_KEY}" \
  -F "timestamp=${TIMESTAMP}" \
  -F "signature=${SIGNATURE}" \
  -F "folder=${MALICIOUS_FOLDER}" \
  -F "public_id=${PUBLIC_ID}" \
  -F "resource_type=${RESOURCE_TYPE}"
```

**Résultat attendu**: 400 Bad Request - "Invalid signature" (Cloudinary rejette)

### Test 3.3: Upload avec Signature Expirée (Erreur Cloudinary)

```bash
# Utiliser un timestamp très ancien
OLD_TIMESTAMP=1000000000

# Générer la signature (normalement, mais avec timestamp forcé)
# Note: Ce test nécessite de modifier temporairement le backend pour forcer un timestamp

# Cloudinary rejetera la signature si le timestamp est trop ancien
```

**Résultat attendu**: 400 Bad Request - "Invalid signature" (Cloudinary rejette)

## 4. Test: Finalisation Upload (Attacher Photo)

### Test 4.1: Attacher Photo Valide

```bash
# Après un upload réussi vers Cloudinary, enregistrer la photo en DB
curl -X POST "${API_URL}/items/${ITEM_ID}/photos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"photos\": [{
      \"url\": \"https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v123/items/${ITEM_ID}/photo.jpg\",
      \"publicId\": \"items/${ITEM_ID}/photo\",
      \"width\": 800,
      \"height\": 600
    }]
  }"
```

**Résultat attendu**: 201 Created

### Test 4.2: URL Ne Correspond Pas au Folder (400 Bad Request)

```bash
# Tenter d'attacher une photo avec une URL qui ne correspond pas au folder attendu
curl -X POST "${API_URL}/items/${ITEM_ID}/photos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"photos\": [{
      \"url\": \"https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v123/items/other-item-id/photo.jpg\",
      \"publicId\": \"items/other-item-id/photo\",
      \"width\": 800,
      \"height\": 600
    }]
  }"
```

**Résultat attendu**: 400 Bad Request - "URL ne correspond pas au folder attendu"

### Test 4.3: URL Non Cloudinary (400 Bad Request)

```bash
# Tenter d'attacher une photo avec une URL non Cloudinary
curl -X POST "${API_URL}/items/${ITEM_ID}/photos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"photos\": [{
      \"url\": \"https://malicious-site.com/image.jpg\",
      \"publicId\": \"items/${ITEM_ID}/photo\",
      \"width\": 800,
      \"height\": 600
    }]
  }"
```

**Résultat attendu**: 400 Bad Request - "URL invalide: doit provenir de Cloudinary"

### Test 4.4: Nombre Maximum de Photos Atteint (400 Bad Request)

```bash
# Après avoir uploadé 5 photos, tenter d'en uploader une 6ème
# (Assurez-vous que l'item a déjà 5 photos)
curl -X POST "${API_URL}/items/${ITEM_ID}/photos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"photos\": [{
      \"url\": \"https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v123/items/${ITEM_ID}/photo6.jpg\",
      \"publicId\": \"items/${ITEM_ID}/photo6\",
      \"width\": 800,
      \"height\": 600
    }]
  }"
```

**Résultat attendu**: 400 Bad Request - "Nombre maximum de photos atteint (5)"

### Test 4.5: Batch Trop Grand (400 Bad Request)

```bash
# Tenter d'uploader plus de 5 photos en une fois
curl -X POST "${API_URL}/items/${ITEM_ID}/photos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"photos\": [
      {\"url\": \"...\", \"publicId\": \"...\", \"width\": 800, \"height\": 600},
      {\"url\": \"...\", \"publicId\": \"...\", \"width\": 800, \"height\": 600},
      {\"url\": \"...\", \"publicId\": \"...\", \"width\": 800, \"height\": 600},
      {\"url\": \"...\", \"publicId\": \"...\", \"width\": 800, \"height\": 600},
      {\"url\": \"...\", \"publicId\": \"...\", \"width\": 800, \"height\": 600},
      {\"url\": \"...\", \"publicId\": \"...\", \"width\": 800, \"height\": 600}
    ]
  }"
```

**Résultat attendu**: 400 Bad Request - "Nombre maximum de photos par requête: 5"

## 5. Test: Rate Limiting

### Test 5.1: Rate Limiting de Signature (429 Too Many Requests)

```bash
# Envoyer plus de 20 requêtes en une minute
for i in {1..25}; do
  curl -X POST "${API_URL}/uploads/cloudinary/sign" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -d "{
      \"folder\": \"items/${ITEM_ID}\"
    }"
  echo "Requête $i"
  sleep 2
done
```

**Résultat attendu**: Après 20 requêtes, 429 Too Many Requests

## 6. Script de Test Complet

Créer un fichier `test-cloudinary-security.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/v1}"
JWT_TOKEN="${JWT_TOKEN}"
ITEM_ID="${ITEM_ID}"
USER_ID="${USER_ID}"

if [ -z "$JWT_TOKEN" ] || [ -z "$ITEM_ID" ] || [ -z "$USER_ID" ]; then
  echo "Erreur: JWT_TOKEN, ITEM_ID et USER_ID doivent être définis"
  exit 1
fi

echo "=== Test 1: Signature Valide ==="
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{\"folder\": \"items/${ITEM_ID}\"}" \
  -w "\nStatus: %{http_code}\n\n"

echo "=== Test 2: Folder Non Autorisé ==="
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{\"folder\": \"malicious/folder\"}" \
  -w "\nStatus: %{http_code}\n\n"

echo "=== Test 3: Sans Authentification ==="
curl -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -d "{\"folder\": \"items/${ITEM_ID}\"}" \
  -w "\nStatus: %{http_code}\n\n"

echo "Tests terminés!"
```

## Résultats Attendus

| Test | Status Attendu | Message |
|------|----------------|---------|
| 1.1 - Signature valide item | 200 OK | Signature générée |
| 1.2 - Signature valide profil | 200 OK | Signature générée |
| 2.1 - Item autre user | 403 Forbidden | Ownership invalide |
| 2.2 - Profil autre user | 403 Forbidden | Ownership invalide |
| 2.3 - Folder non autorisé | 400 Bad Request | Dossier non autorisé |
| 2.4 - Sans auth | 401 Unauthorized | Non authentifié |
| 2.5 - Item inexistant | 404 Not Found | Item non trouvé |
| 3.1 - Upload valide | 200 OK | Upload réussi |
| 3.2 - Signature modifiée | 400 Bad Request | Invalid signature |
| 4.1 - Attacher photo valide | 201 Created | Photo attachée |
| 4.2 - URL ne correspond pas | 400 Bad Request | URL invalide |
| 4.3 - URL non Cloudinary | 400 Bad Request | URL invalide |
| 4.4 - Limite atteinte | 400 Bad Request | Nombre max atteint |
| 4.5 - Batch trop grand | 400 Bad Request | Nombre max par requête |
| 5.1 - Rate limiting | 429 Too Many Requests | Trop de requêtes |

## Notes

1. **Remplacez les variables**: Assurez-vous de définir `JWT_TOKEN`, `ITEM_ID`, `USER_ID` avant d'exécuter les tests
2. **Fichier de test**: Créez un fichier image de test (`test-image.jpg`) pour les tests d'upload
3. **Timing**: Pour le test de signature expirée, attendez plus de 60 secondes entre la génération et l'utilisation
4. **Rate Limiting**: Les tests de rate limiting peuvent prendre du temps (plusieurs minutes)

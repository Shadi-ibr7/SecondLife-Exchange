# Tests de Gestion d'Erreurs Standardisées

## Vue d'ensemble

Ce document décrit les tests à effectuer pour vérifier que la gestion d'erreurs est correctement implémentée avec le format standardisé et le `requestId`.

## Format d'Erreur Standardisé

Toutes les erreurs retournées par l'API suivent ce format :

```json
{
  "statusCode": number,
  "error": string,
  "message": string,
  "path": string,
  "timestamp": string,
  "requestId": string
}
```

**Caractéristiques :**
- `statusCode` : Code HTTP standard (400, 401, 404, 409, 500, etc.)
- `error` : Nom de l'erreur standardisé (BadRequest, Unauthorized, NotFound, Conflict, etc.)
- `message` : Message utilisateur-friendly (jamais de stacktrace ou détails techniques en prod)
- `path` : Chemin de la requête qui a causé l'erreur
- `timestamp` : Date ISO 8601 de l'erreur
- `requestId` : UUID unique pour tracer la requête dans les logs (présent aussi dans le header `X-Request-Id`)

**Sécurité :**
- En production : **jamais de stacktrace** dans la réponse
- En développement : stacktrace optionnelle (uniquement si `NODE_ENV !== 'production'`)
- Messages utilisateur-friendly : jamais d'exposition de détails techniques

## Tests à Effectuer

### 1. Test 401 Unauthorized

**Objectif :** Vérifier que les erreurs 401 sont correctement formatées avec `requestId`.

**Requête :**
```bash
curl -X GET http://localhost:4000/api/v1/users/me \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/users/me",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Vérifications :**
- [ ] `statusCode` = 401
- [ ] `error` = "Unauthorized"
- [ ] `requestId` est présent (UUID valide)
- [ ] `requestId` correspond au header `X-Request-Id` de la réponse
- [ ] `path` correspond au chemin de la requête
- [ ] `timestamp` est au format ISO 8601
- [ ] Pas de stacktrace dans la réponse (même en dev, car HttpException)
- [ ] Header `X-Request-Id` présent dans la réponse

**Exemple avec curl :**
```bash
RESPONSE=$(curl -i -X GET http://localhost:4000/api/v1/users/me \
  -H "Content-Type: application/json" 2>/dev/null)

# Extraire le requestId du header
REQUEST_ID_HEADER=$(echo "$RESPONSE" | grep -i "X-Request-Id:" | cut -d' ' -f2 | tr -d '\r')

# Extraire le requestId du body JSON
REQUEST_ID_BODY=$(echo "$RESPONSE" | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)

# Vérifier qu'ils correspondent
if [ "$REQUEST_ID_HEADER" = "$REQUEST_ID_BODY" ]; then
  echo "✓ requestId correspond entre header et body"
else
  echo "✗ requestId ne correspond pas"
fi
```

---

### 2. Test 403 Forbidden

**Objectif :** Vérifier que les erreurs 403 sont correctement formatées avec `requestId`.

**Requête :** Accéder à une ressource protégée sans les permissions nécessaires

```bash
# Se connecter comme utilisateur normal
LOGIN_RESPONSE=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Essayer d'accéder à une route admin (403 attendu)
curl -X GET http://localhost:4000/api/v1/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/admin/users",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Vérifications :**
- [ ] `statusCode` = 403
- [ ] `error` = "Forbidden"
- [ ] `requestId` est présent (UUID valide)
- [ ] `requestId` correspond au header `X-Request-Id`
- [ ] Message utilisateur-friendly (pas de détails techniques)
- [ ] Pas de stacktrace

---

### 3. Test 404 Not Found

**Objectif :** Vérifier que les erreurs 404 sont correctement formatées avec `requestId`, y compris les erreurs Prisma P2025.

**Cas A : Route non existante**

**Requête :**
```bash
curl -X GET http://localhost:4000/api/v1/items/99999999 \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "statusCode": 404,
  "error": "NotFound",
  "message": "Item not found",
  "path": "/api/v1/items/99999999",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Cas B : Erreur Prisma P2025 (Record not found)**

**Objectif :** Vérifier que les erreurs Prisma P2025 sont mappées vers 404.

**Contexte :** Cette erreur se produit quand Prisma essaie de mettre à jour/supprimer un enregistrement qui n'existe pas.

**Vérifications :**
- [ ] `statusCode` = 404
- [ ] `error` = "NotFound"
- [ ] `message` = "Ressource introuvable" (pour Prisma P2025)
- [ ] `requestId` est présent (UUID valide)
- [ ] `requestId` correspond au header `X-Request-Id`
- [ ] Pas de stacktrace

---

### 4. Test 409 Conflict (Erreur Prisma P2002)

**Objectif :** Vérifier que les erreurs Prisma P2002 (Unique constraint violation) sont mappées vers 409.

**Requête :** Créer un utilisateur avec un email déjà existant

```bash
# Première inscription (succès)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'

# Deuxième inscription avec le même email (409 attendu)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User 2"}'
```

**Réponse attendue :**
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Cette email est déjà utilisée",
  "path": "/api/v1/auth/register",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Vérifications :**
- [ ] `statusCode` = 409
- [ ] `error` = "Conflict"
- [ ] `message` contient le champ en conflit (ex: "Cette email est déjà utilisée")
- [ ] `requestId` est présent (UUID valide)
- [ ] `requestId` correspond au header `X-Request-Id`
- [ ] Pas de stacktrace

---

### 5. Test 500 Internal Server Error

**Objectif :** Vérifier que les erreurs 500 sont correctement formatées avec `requestId` et **jamais de stacktrace en production**.

**Cas A : Erreur serveur générique**

**Requête :** Créer une situation qui provoque une erreur serveur (ex: division par zéro dans un contrôleur de test)

**Réponse attendue en production :**
```json
{
  "statusCode": 500,
  "error": "InternalServerError",
  "message": "Une erreur serveur est survenue",
  "path": "/api/v1/test-error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440004"
}
```

**Réponse attendue en développement :**
```json
{
  "statusCode": 500,
  "error": "InternalServerError",
  "message": "Division by zero",  // Message technique en dev
  "path": "/api/v1/test-error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440004",
  "stack": "Error: Division by zero\n    at ..."  // Stacktrace uniquement en dev
}
```

**Vérifications :**
- [ ] `statusCode` = 500
- [ ] `error` = "InternalServerError"
- [ ] `requestId` est présent (UUID valide)
- [ ] `requestId` correspond au header `X-Request-Id`
- [ ] **En production :** `message` = "Une erreur serveur est survenue" (générique)
- [ ] **En production :** Pas de champ `stack` dans la réponse
- [ ] **En développement :** `stack` peut être présent (optionnel)
- [ ] Les détails complets sont dans les logs du serveur (mais jamais exposés)

**Vérification de la production :**
```bash
# S'assurer que NODE_ENV=production
NODE_ENV=production npm run start:prod

# Tester une erreur 500
curl -X GET http://localhost:4000/api/v1/test-error

# Vérifier qu'il n'y a pas de "stack" dans la réponse
curl -s http://localhost:4000/api/v1/test-error | grep -q "stack" && echo "✗ Stacktrace exposée!" || echo "✓ Pas de stacktrace"
```

---

## Script de Test Automatisé

Voici un script bash pour tester tous les cas automatiquement :

```bash
#!/bin/bash

API_URL="http://localhost:4000/api/v1"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🧪 Tests de gestion d'erreurs standardisées"
echo "=========================================="

test_error() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_status=$4
  local headers=$5
  local data=$6

  echo ""
  echo "Test: $name"
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "$headers" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "$headers")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  # Vérifier le status code
  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Status code: $http_code${NC}"
  else
    echo -e "${RED}✗ Status code attendu: $expected_status, reçu: $http_code${NC}"
    return 1
  fi

  # Vérifier la présence du requestId
  if echo "$body" | grep -q '"requestId"'; then
    request_id=$(echo "$body" | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$request_id" ]; then
      echo -e "${GREEN}✓ requestId présent: $request_id${NC}"
    else
      echo -e "${RED}✗ requestId vide${NC}"
      return 1
    fi
  else
    echo -e "${RED}✗ requestId manquant${NC}"
    return 1
  fi

  # Vérifier le format JSON
  if echo "$body" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Format JSON valide${NC}"
    
    # Vérifier les champs requis
    required_fields=("statusCode" "error" "message" "path" "timestamp" "requestId")
    for field in "${required_fields[@]}"; do
      if echo "$body" | jq -e ".$field" >/dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Champ '$field' présent${NC}"
      else
        echo -e "${RED}  ✗ Champ '$field' manquant${NC}"
        return 1
      fi
    done
  else
    echo -e "${RED}✗ Format JSON invalide${NC}"
    return 1
  fi

  # Vérifier l'absence de stacktrace en production
  if [ "$NODE_ENV" = "production" ]; then
    if echo "$body" | grep -q '"stack"'; then
      echo -e "${RED}✗ Stacktrace exposée en production!${NC}"
      return 1
    else
      echo -e "${GREEN}✓ Pas de stacktrace (production)${NC}"
    fi
  fi

  return 0
}

# Tests
test_error "401 Unauthorized" "GET" "/users/me" 401 ""
test_error "404 Not Found" "GET" "/items/99999999" 404 ""

echo ""
echo "✅ Tests terminés"
```

---

## Vérification dans les Logs

Le `requestId` permet de tracer toutes les opérations liées à une requête dans les logs :

```bash
# Rechercher tous les logs d'une requête spécifique
grep "550e8400-e29b-41d4-a716-446655440000" /var/log/app.log

# Résultat attendu :
# {"type":"http_request_start","requestId":"550e8400-...","method":"GET","path":"/api/v1/users/me",...}
# {"type":"http_request_error","requestId":"550e8400-...","statusCode":401,"error":"Unauthorized",...}
```

---

## Notes Importantes

1. **Production vs Développement :**
   - En production : messages génériques, jamais de stacktrace
   - En développement : messages techniques optionnels, stacktrace optionnelle

2. **Mapping Prisma :**
   - P2002 (Unique constraint) → 409 Conflict
   - P2025 (Not found) → 404 Not Found
   - P2003 (Foreign key) → 400 Bad Request
   - P2014 (Invalid ID) → 400 Bad Request
   - P1001/P1008/P1010 (DB connection) → 503 Service Unavailable

3. **Frontend :**
   - Le frontend extrait toujours `error.response.data.message` pour afficher à l'utilisateur
   - Erreurs réseau (pas de response) → "API inaccessible"
   - Jamais de stacktrace affichée à l'utilisateur

4. **Sécurité :**
   - Tous les détails techniques sont dans les logs serveur uniquement
   - Les messages d'erreur sont utilisateur-friendly
   - Le `requestId` permet de corréler logs et requêtes client

#!/bin/bash

# Script de test pour les endpoints d'upload Cloudinary sécurisés
# Usage: ./scripts/test-upload-endpoints.sh [API_URL] [USER_EMAIL] [USER_PASSWORD]

API_URL="${1:-http://localhost:4000/api/v1}"
USER_EMAIL="${2:-test@example.com}"
USER_PASSWORD="${3:-Test1234!}"

echo "🧪 Tests des endpoints d'upload Cloudinary sécurisés"
echo "===================================================="
echo "API URL: $API_URL"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

# Fonction utilitaire pour tester
test_result() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  
  if [ "$actual" == "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $description (HTTP $actual)"
    ((PASS++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}: $description (HTTP $actual, attendu: $expected)"
    ((FAIL++))
    return 1
  fi
}

# ============================================
# Test 1: Vérifier que le serveur répond
# ============================================
echo -e "${BLUE}📡 Test 1: Vérification du serveur${NC}"
echo "-----------------------------------"
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Serveur accessible${NC}"
else
  echo -e "${RED}❌ Serveur non accessible sur ${API_URL}${NC}"
  echo ""
  echo "💡 Pour démarrer le serveur:"
  echo "   cd apps/backend"
  echo "   npm run start:dev"
  exit 1
fi
echo ""

# ============================================
# Test 2: S'inscrire / Se connecter pour obtenir un token
# ============================================
echo -e "${BLUE}🔐 Test 2: Authentification${NC}"
echo "----------------------------"

# Essayer de s'inscrire
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASSWORD}\",\"displayName\":\"Test User\"}" 2>&1)

REGISTER_HTTP=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$REGISTER_HTTP" == "201" ] || [ "$REGISTER_HTTP" == "409" ]; then
  echo -e "${GREEN}✅ Utilisateur disponible${NC}"
else
  echo -e "${YELLOW}⚠️  Inscription échouée (HTTP $REGISTER_HTTP)${NC}"
fi

# Se connecter
LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASSWORD}\"}" 2>&1)

LOGIN_HTTP=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$LOGIN_HTTP" != "200" ]; then
  echo -e "${RED}❌ Échec de la connexion (HTTP $LOGIN_HTTP)${NC}"
  echo "Réponse: $LOGIN_BODY"
  exit 1
fi

# Extraire le token
if command -v jq &> /dev/null; then
  ACCESS_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.accessToken' 2>/dev/null)
  USER_ID=$(echo "$LOGIN_BODY" | jq -r '.user.id' 2>/dev/null)
else
  # Fallback si jq n'est pas disponible
  ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
  echo -e "${RED}❌ Token d'accès non trouvé dans la réponse${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtenu${NC}"
echo ""

# ============================================
# Test 3: Nouvel endpoint - Signature avec auth valide (profiles)
# ============================================
echo -e "${BLUE}📤 Test 3: POST /uploads/cloudinary/sign (profiles)${NC}"
echo "--------------------------------------------------------"

SIGN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{"folder":"profiles"}' 2>&1)

SIGN_HTTP=$(echo "$SIGN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
SIGN_BODY=$(echo "$SIGN_RESPONSE" | sed '/HTTP_STATUS/d')

test_result "POST /uploads/cloudinary/sign (profiles)" "200" "$SIGN_HTTP"

if [ "$SIGN_HTTP" == "200" ]; then
  if command -v jq &> /dev/null; then
    echo "Réponse:"
    echo "$SIGN_BODY" | jq '.' 2>/dev/null || echo "$SIGN_BODY"
    
    # Vérifier les champs requis
    SIGNATURE=$(echo "$SIGN_BODY" | jq -r '.signature' 2>/dev/null)
    TIMESTAMP=$(echo "$SIGN_BODY" | jq -r '.timestamp' 2>/dev/null)
    FOLDER=$(echo "$SIGN_BODY" | jq -r '.folder' 2>/dev/null)
    
    if [ -n "$SIGNATURE" ] && [ "$SIGNATURE" != "null" ]; then
      echo -e "${GREEN}   ✅ Signature présente${NC}"
    else
      echo -e "${RED}   ❌ Signature manquante${NC}"
    fi
    
    if [ -n "$TIMESTAMP" ] && [ "$TIMESTAMP" != "null" ]; then
      echo -e "${GREEN}   ✅ Timestamp présent${NC}"
    else
      echo -e "${RED}   ❌ Timestamp manquant${NC}"
    fi
  else
    echo "Réponse: $SIGN_BODY"
  fi
fi
echo ""

# ============================================
# Test 4: Nouvel endpoint - Sans authentification (401)
# ============================================
echo -e "${BLUE}🔒 Test 4: POST /uploads/cloudinary/sign (sans auth)${NC}"
echo "------------------------------------------------------"

NO_AUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -d '{"folder":"profiles"}' 2>&1)

NO_AUTH_HTTP=$(echo "$NO_AUTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

test_result "POST /uploads/cloudinary/sign (sans auth) → 401" "401" "$NO_AUTH_HTTP"
echo ""

# ============================================
# Test 5: Nouvel endpoint - Folder invalide (400)
# ============================================
echo -e "${BLUE}⚠️  Test 5: POST /uploads/cloudinary/sign (folder invalide)${NC}"
echo "----------------------------------------------------------"

INVALID_FOLDER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/uploads/cloudinary/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{"folder":"invalid-folder"}' 2>&1)

INVALID_FOLDER_HTTP=$(echo "$INVALID_FOLDER_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

test_result "POST /uploads/cloudinary/sign (folder invalide) → 400" "400" "$INVALID_FOLDER_HTTP"
echo ""

# ============================================
# Test 6: Ancien endpoint - Toujours fonctionnel (profiles)
# ============================================
echo -e "${BLUE}🔄 Test 6: POST /items/uploads/signature (ancien endpoint)${NC}"
echo "------------------------------------------------------------"

OLD_ENDPOINT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/items/uploads/signature" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{"folder":"profiles"}' 2>&1)

OLD_ENDPOINT_HTTP=$(echo "$OLD_ENDPOINT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

test_result "POST /items/uploads/signature (ancien endpoint) → 200" "200" "$OLD_ENDPOINT_HTTP"

if [ "$OLD_ENDPOINT_HTTP" == "200" ]; then
  echo -e "${GREEN}   ✅ L'ancien endpoint fonctionne toujours avec la nouvelle validation${NC}"
fi
echo ""

# ============================================
# Test 7: Test avec items/<itemId> (nécessite un item existant)
# ============================================
echo -e "${BLUE}📦 Test 7: POST /uploads/cloudinary/sign (items/<itemId>)${NC}"
echo "--------------------------------------------------------"

# Créer un item pour le test
CREATE_ITEM_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_URL}/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{"title":"Test Item","description":"Test description","condition":"GOOD"}' 2>&1)

CREATE_ITEM_HTTP=$(echo "$CREATE_ITEM_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
CREATE_ITEM_BODY=$(echo "$CREATE_ITEM_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$CREATE_ITEM_HTTP" == "201" ]; then
  if command -v jq &> /dev/null; then
    ITEM_ID=$(echo "$CREATE_ITEM_BODY" | jq -r '.id' 2>/dev/null)
  else
    ITEM_ID=$(echo "$CREATE_ITEM_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
  fi
  
  if [ -n "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ]; then
    # Tester la signature pour cet item
    ITEM_SIGN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X POST "${API_URL}/uploads/cloudinary/sign" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -d "{\"folder\":\"items/${ITEM_ID}\"}" 2>&1)
    
    ITEM_SIGN_HTTP=$(echo "$ITEM_SIGN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    
    test_result "POST /uploads/cloudinary/sign (items/${ITEM_ID}) → 200" "200" "$ITEM_SIGN_HTTP"
    
    if [ "$ITEM_SIGN_HTTP" == "200" ]; then
      echo -e "${GREEN}   ✅ Signature générée pour l'item de l'utilisateur${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Impossible d'extraire l'ID de l'item${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Impossible de créer un item pour le test (HTTP $CREATE_ITEM_HTTP)${NC}"
fi
echo ""

# ============================================
# Résumé
# ============================================
echo "===================================================="
echo "📊 Résumé des tests"
echo "===================================================="
echo -e "${GREEN}✅ Tests réussis: $PASS${NC}"
echo -e "${RED}❌ Tests échoués: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Certains tests ont échoué${NC}"
  exit 1
fi

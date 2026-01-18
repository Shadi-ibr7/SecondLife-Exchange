#!/bin/bash

# Script de test pour vérifier la gestion d'erreurs standardisées
# Usage: ./scripts/test-error-handling.sh

API_URL="${API_URL:-http://localhost:4000/api/v1}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

echo "🧪 Tests de gestion d'erreurs standardisées"
echo "=========================================="
echo "API URL: $API_URL"
echo ""

# Fonction pour tester une erreur
test_error() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_status=$4
  local headers=$5
  local data=$6

  echo -n "Test: $name ... "

  # Faire la requête
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "$headers" \
      -d "$data" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "$headers" 2>&1)
  fi

  # Extraire le code HTTP et le body
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  # Vérifier le status code
  if [ "$http_code" != "$expected_status" ]; then
    echo -e "${RED}✗${NC}"
    echo "  Status attendu: $expected_status, reçu: $http_code"
    FAILED=$((FAILED + 1))
    return 1
  fi

  # Vérifier que c'est du JSON valide
  if ! echo "$body" | jq . >/dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo "  Format JSON invalide"
    echo "  Response: $body"
    FAILED=$((FAILED + 1))
    return 1
  fi

  # Vérifier les champs requis
  required_fields=("statusCode" "error" "message" "path" "timestamp" "requestId")
  for field in "${required_fields[@]}"; do
    if ! echo "$body" | jq -e ".$field" >/dev/null 2>&1; then
      echo -e "${RED}✗${NC}"
      echo "  Champ '$field' manquant"
      FAILED=$((FAILED + 1))
      return 1
    fi
  done

  # Vérifier que requestId est un UUID valide (format basique)
  request_id=$(echo "$body" | jq -r '.requestId')
  if [ -z "$request_id" ] || [ "$request_id" = "null" ] || [ "$request_id" = "unknown" ]; then
    echo -e "${RED}✗${NC}"
    echo "  requestId invalide ou manquant: $request_id"
    FAILED=$((FAILED + 1))
    return 1
  fi

  # Vérifier que statusCode correspond
  status_code=$(echo "$body" | jq -r '.statusCode')
  if [ "$status_code" != "$expected_status" ]; then
    echo -e "${RED}✗${NC}"
    echo "  statusCode dans le body ($status_code) ne correspond pas au code HTTP ($expected_status)"
    FAILED=$((FAILED + 1))
    return 1
  fi

  # Vérifier que le message existe et n'est pas vide
  message=$(echo "$body" | jq -r '.message')
  if [ -z "$message" ] || [ "$message" = "null" ]; then
    echo -e "${RED}✗${NC}"
    echo "  message manquant ou vide"
    FAILED=$((FAILED + 1))
    return 1
  fi

  echo -e "${GREEN}✓${NC}"
  PASSED=$((PASSED + 1))
  return 0
}

# Test 1: 401 Unauthorized
test_error "401 Unauthorized" "GET" "/users/me" 401 ""

# Test 2: 404 Not Found (route non existante)
test_error "404 Not Found - Route inexistante" "GET" "/items/99999999-not-exists" 404 ""

# Test 3: Vérifier qu'il n'y a pas de stacktrace en production (si NODE_ENV=production)
if [ "$NODE_ENV" = "production" ]; then
  echo -n "Test: Pas de stacktrace en production ... "
  response=$(curl -s -X GET "$API_URL/users/me" 2>&1)
  if echo "$response" | jq -e '.stack' >/dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo "  Stacktrace exposée en production!"
    FAILED=$((FAILED + 1))
  else
    echo -e "${GREEN}✓${NC}"
    PASSED=$((PASSED + 1))
  fi
fi

# Test 4: Vérifier le format de l'erreur complète
echo -n "Test: Format d'erreur complet ... "
response=$(curl -s -X GET "$API_URL/users/me" 2>&1)
if echo "$response" | jq -e '.statusCode, .error, .message, .path, .timestamp, .requestId' >/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
  PASSED=$((PASSED + 1))
  
  # Afficher un exemple de réponse formatée
  echo ""
  echo -e "${YELLOW}Exemple de réponse formatée:${NC}"
  echo "$response" | jq '.' | head -10
else
  echo -e "${RED}✗${NC}"
  echo "  Format invalide"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================="
echo "Résultats: ${GREEN}$PASSED réussis${NC}, ${RED}$FAILED échoués${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les tests sont passés!${NC}"
  exit 0
else
  echo -e "${RED}❌ Certains tests ont échoué${NC}"
  exit 1
fi

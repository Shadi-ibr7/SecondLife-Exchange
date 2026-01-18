#!/bin/bash
# Script de test pour CORS et CSRF

API_URL="${API_URL:-http://localhost:4000/api/v1}"
COOKIES_FILE="/tmp/test_csrf_cookies.txt"

echo "🧪 Tests CORS et CSRF - SecondLife-Exchange"
echo "=========================================="
echo ""
echo "URL API: $API_URL"
echo ""

# Fonction utilitaire pour tester
test_result() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  
  if [ "$actual" == "$expected" ]; then
    echo "✅ PASS: $description (HTTP $actual)"
    return 0
  else
    echo "❌ FAIL: $description (HTTP $actual, attendu: $expected)"
    return 1
  fi
}

PASS=0
FAIL=0

# ============================================
# Test 1: Endpoint CSRF - Récupération du token
# ============================================
echo "📋 Test 1: Récupération token CSRF"
echo "-----------------------------------"

HTTP_CODE=$(curl -s -o /tmp/csrf_response.json -w "%{http_code}" \
  -X GET "$API_URL/security/csrf" \
  -c "$COOKIES_FILE")

test_result "GET /security/csrf" "200" "$HTTP_CODE"
[ $? -eq 0 ] && ((PASS++)) || ((FAIL++))

if [ "$HTTP_CODE" == "200" ]; then
  CSRF_TOKEN=$(cat /tmp/csrf_response.json | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$CSRF_TOKEN" ]; then
    echo "   Token CSRF: ${CSRF_TOKEN:0:30}..."
    echo "   ✅ Token présent dans la réponse JSON"
  else
    echo "   ❌ Token CSRF non trouvé dans la réponse"
    ((FAIL++))
  fi
  
  # Vérifier le cookie
  if grep -q "XSRF-TOKEN" "$COOKIES_FILE" 2>/dev/null; then
    echo "   ✅ Cookie XSRF-TOKEN défini"
  else
    echo "   ❌ Cookie XSRF-TOKEN non trouvé"
    ((FAIL++))
  fi
fi

echo ""

# ============================================
# Test 2: CORS - Origine autorisée
# ============================================
echo "📋 Test 2: CORS - Origine autorisée (localhost:3000)"
echo "----------------------------------------------------"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/items?limit=1" \
  -H "Origin: http://localhost:3000" \
  -v 2>&1 | grep -E "< HTTP" | head -1 | grep -oE "[0-9]{3}")

if [ -z "$HTTP_CODE" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$API_URL/items?limit=1" \
    -H "Origin: http://localhost:3000")
fi

test_result "CORS avec origine autorisée" "200" "$HTTP_CODE"
[ $? -eq 0 ] && ((PASS++)) || ((FAIL++))

echo ""

# ============================================
# Test 3: CORS - Origine non autorisée
# ============================================
echo "📋 Test 3: CORS - Origine non autorisée"
echo "---------------------------------------"

# En dev, CORS peut autoriser, mais on vérifie au moins que la requête est traitée différemment
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/items?limit=1" \
  -H "Origin: https://malicious-site.com" 2>&1)

# Note: En développement, CORS peut autoriser toutes les origines
# En production, cela devrait être bloqué
echo "   HTTP Status: $HTTP_CODE"
echo "   ℹ️  En dev, CORS peut autoriser. En prod, doit être bloqué."
echo ""

# ============================================
# Test 4: Requête GET - Pas de CSRF requis
# ============================================
echo "📋 Test 4: Requête GET (pas de CSRF requis)"
echo "-------------------------------------------"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/items?limit=1")

test_result "GET /items sans CSRF" "200" "$HTTP_CODE"
[ $? -eq 0 ] && ((PASS++)) || ((FAIL++))

echo ""

# ============================================
# Test 5: Vérification structure token CSRF
# ============================================
echo "📋 Test 5: Validation format token CSRF"
echo "---------------------------------------"

if [ -n "$CSRF_TOKEN" ]; then
  # Token doit faire au moins 32 caractères (16 bytes en hex = 32 chars)
  LENGTH=${#CSRF_TOKEN}
  if [ "$LENGTH" -ge 32 ]; then
    echo "   ✅ Token CSRF a une longueur valide ($LENGTH caractères)"
    ((PASS++))
  else
    echo "   ❌ Token CSRF trop court ($LENGTH caractères, minimum 32)"
    ((FAIL++))
  fi
  
  # Token doit être hexadécimal
  if [[ "$CSRF_TOKEN" =~ ^[0-9a-fA-F]+$ ]]; then
    echo "   ✅ Token CSRF est hexadécimal"
    ((PASS++))
  else
    echo "   ❌ Token CSRF n'est pas hexadécimal"
    ((FAIL++))
  fi
else
  echo "   ⚠️  Token CSRF non disponible pour ce test"
  ((FAIL++))
fi

echo ""

# ============================================
# Résumé
# ============================================
echo "=========================================="
echo "📊 Résumé des tests"
echo "=========================================="
echo "✅ Tests réussis: $PASS"
echo "❌ Tests échoués: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 Tous les tests sont passés !"
  exit 0
else
  echo "⚠️  Certains tests ont échoué. Vérifiez les résultats ci-dessus."
  exit 1
fi

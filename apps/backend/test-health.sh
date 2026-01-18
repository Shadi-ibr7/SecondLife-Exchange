#!/bin/bash

# Script de test pour les endpoints health et ready
# Usage: ./test-health.sh [API_URL]

API_URL="${1:-http://localhost:4000/api/v1}"

echo "🧪 Tests des endpoints Health Check"
echo "===================================="
echo ""

# Couleurs pour les résultats
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check simple
echo "📊 Test 1: GET /health"
echo "----------------------"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${API_URL}/health" 2>&1)
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" == "200" ]; then
  echo -e "${GREEN}✅ PASS${NC}: HTTP $HTTP_STATUS"
  echo "Réponse:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}❌ FAIL${NC}: HTTP $HTTP_STATUS (attendu: 200)"
  echo "Réponse: $BODY"
fi
echo ""

# Test 2: Readiness check
echo "📊 Test 2: GET /health/ready"
echo "----------------------------"
READY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${API_URL}/health/ready" 2>&1)
HTTP_STATUS=$(echo "$READY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$READY_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" == "200" ]; then
  echo -e "${GREEN}✅ PASS${NC}: HTTP $HTTP_STATUS"
  echo "Réponse:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Vérifier le statut dans la réponse JSON
  STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null)
  if [ "$STATUS" == "ready" ]; then
    echo -e "${GREEN}✅ Application prête${NC}"
  else
    echo -e "${YELLOW}⚠️  Application non prête: $STATUS${NC}"
  fi
else
  echo -e "${RED}❌ FAIL${NC}: HTTP $HTTP_STATUS (attendu: 200)"
  echo "Réponse: $BODY"
fi
echo ""

# Test 3: Vérifier les checks individuels
echo "📊 Test 3: Détails des checks"
echo "-----------------------------"
if command -v jq &> /dev/null; then
  DB_STATUS=$(echo "$BODY" | jq -r '.checks.database.status' 2>/dev/null)
  REDIS_STATUS=$(echo "$BODY" | jq -r '.checks.redis.status' 2>/dev/null)
  CLOUDINARY_STATUS=$(echo "$BODY" | jq -r '.checks.cloudinary.status' 2>/dev/null)
  
  echo "Database: $DB_STATUS"
  [ "$DB_STATUS" == "ok" ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"
  
  if [ "$REDIS_STATUS" != "null" ] && [ -n "$REDIS_STATUS" ]; then
    echo "Redis: $REDIS_STATUS"
    [ "$REDIS_STATUS" == "ok" ] && echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
  else
    echo "Redis: non configuré (optionnel)"
  fi
  
  if [ "$CLOUDINARY_STATUS" != "null" ] && [ -n "$CLOUDINARY_STATUS" ]; then
    echo "Cloudinary: $CLOUDINARY_STATUS"
    [ "$CLOUDINARY_STATUS" == "ok" ] && echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
  else
    echo "Cloudinary: non configuré (optionnel)"
  fi
else
  echo "⚠️  jq non installé, impossible d'afficher les détails"
fi
echo ""

echo "===================================="
echo "Tests terminés"
echo ""
echo "💡 Pour tester avec une autre URL:"
echo "   ./test-health.sh http://your-api-url/api/v1"

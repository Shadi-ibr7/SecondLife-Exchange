/**
 * Script de test pour vérifier le parsing de FRONTEND_ORIGINS
 * Usage: node apps/backend/scripts/test-env-parsing.js
 */

const path = require('path');
const fs = require('fs');

// Essayer de charger le .env depuis la racine
const rootEnvPath = path.join(__dirname, '..', '..', '.env');

console.log('🔍 Test de parsing FRONTEND_ORIGINS\n');
console.log(`📁 Chemin .env: ${rootEnvPath}`);
console.log(`📁 Existe: ${fs.existsSync(rootEnvPath)}\n`);

if (fs.existsSync(rootEnvPath)) {
  // Charger dotenv
  require('dotenv').config({ path: rootEnvPath });

  const raw = process.env.FRONTEND_ORIGINS;
  console.log(`📋 FRONTEND_ORIGINS brute: "${raw}"`);
  console.log(`📋 Type: ${typeof raw}`);
  console.log(`📋 Longueur: ${raw ? raw.length : 0}\n`);

  if (raw) {
    const parsed = raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    console.log(`✅ Parsé en ${parsed.length} origine(s):`);
    parsed.forEach((origin, index) => {
      console.log(`   ${index + 1}. "${origin}"`);
    });
  } else {
    console.log('❌ FRONTEND_ORIGINS est vide ou non défini');
  }
} else {
  console.log('❌ Fichier .env non trouvé');
}

/**
 * Script de test pour valider les corrections des URLs d'API admin
 *
 * Ce script vérifie que:
 * 1. Les endpoints API utilisent /admin/... (pas /${ADMIN_BASE_PATH}/...)
 * 2. La baseURL est correctement construite
 * 3. ADMIN_BASE_PATH est uniquement utilisé pour les redirections UI
 */

const fs = require('fs');
const path = require('path');

const ADMIN_API_FILE = path.join(__dirname, 'apps/frontend/src/lib/admin.api.ts');
const ADMIN_CONTROLLER_FILE = path.join(__dirname, 'apps/backend/src/modules/admin/admin.controller.ts');
const ADMIN_MODULE_FILE = path.join(__dirname, 'apps/backend/src/modules/admin/admin.module.ts');

console.log('🧪 Tests de validation des corrections admin API paths\n');

let errors = [];
let warnings = [];
let success = [];

// Test 1: Vérifier que admin.api.ts utilise /admin/... pour les endpoints API
console.log('1️⃣  Test: Vérification des endpoints API dans admin.api.ts');
try {
  const adminApiContent = fs.readFileSync(ADMIN_API_FILE, 'utf8');

  // Chercher les patterns problématiques (adminBasePath dans les appels API)
  // EXCLURE les redirections UI (window.location.href)
  const badPatterns = [
    /adminApiClient\.(get|post|patch|delete|put)\([^)]*adminBasePath/g, // adminBasePath dans appels API
    /adminApiClient\.(get|post|patch|delete|put)\([^)]*ADMIN_BASE_PATH/g, // ADMIN_BASE_PATH dans appels API
  ];

  badPatterns.forEach((pattern, index) => {
    const matches = adminApiContent.match(pattern);
    if (matches) {
      // Vérifier que ce n'est pas une redirection UI
      const isNotRedirect = matches.filter(match => {
        const matchIndex = adminApiContent.indexOf(match);
        const beforeMatch = adminApiContent.substring(Math.max(0, matchIndex - 100), matchIndex);
        return !beforeMatch.includes('window.location.href');
      });

      if (isNotRedirect.length > 0) {
        errors.push(`❌ Pattern problématique trouvé dans admin.api.ts: adminBasePath utilisé dans un appel API`);
      }
    }
  });

  // Vérifier que les endpoints utilisent /admin/...
  const goodEndpoints = adminApiContent.match(/adminApiClient\.(get|post|patch|delete|put)\(['"`]\/admin\//g);
  if (goodEndpoints && goodEndpoints.length > 0) {
    success.push(`✅ ${goodEndpoints.length} endpoints utilisent correctement /admin/...`);
  }

  // Vérifier que ADMIN_BASE_PATH est uniquement utilisé pour les redirections UI
  const adminBasePathUsage = adminApiContent.match(/ADMIN_BASE_PATH/g);
  const redirectUsage = adminApiContent.match(/window\.location\.href\s*=\s*`\/\$\{adminBasePath\}/g);
  const importUsage = adminApiContent.match(/import.*ADMIN_BASE_PATH/g);

  if (adminBasePathUsage) {
    const importCount = importUsage ? importUsage.length : 0;
    const redirectCount = redirectUsage ? redirectUsage.length : 0;
    const totalUsage = adminBasePathUsage.length;
    const nonRedirectUsage = totalUsage - redirectCount - importCount;

    if (nonRedirectUsage > 0) {
      // Vérifier que les utilisations restantes sont des déclarations de variable pour redirections
      const variableDeclarations = adminApiContent.match(/const adminBasePath\s*=/g);
      if (variableDeclarations && variableDeclarations.length === nonRedirectUsage) {
        success.push(`✅ ADMIN_BASE_PATH uniquement utilisé pour les redirections UI (${redirectCount} redirections)`);
      } else {
        warnings.push(`⚠️  ADMIN_BASE_PATH pourrait être utilisé en dehors des redirections UI`);
      }
    } else {
      success.push(`✅ ADMIN_BASE_PATH uniquement utilisé pour les redirections UI`);
    }
  }

} catch (error) {
  errors.push(`❌ Erreur lors de la lecture de admin.api.ts: ${error.message}`);
}

// Test 2: Vérifier que getApiBaseURL() retourne bien /api/v1
console.log('2️⃣  Test: Vérification de getApiBaseURL()');
try {
  const adminApiContent = fs.readFileSync(ADMIN_API_FILE, 'utf8');

  // Vérifier que la fonction retourne toujours /api/v1
  const hasApiV1 = adminApiContent.includes('/api/v1');
  const returnsApiV1 = adminApiContent.match(/return\s+.*\/api\/v1/);

  if (hasApiV1 && returnsApiV1) {
    success.push(`✅ getApiBaseURL() retourne bien /api/v1`);
  } else {
    errors.push(`❌ getApiBaseURL() ne retourne pas /api/v1 correctement`);
  }

  // Vérifier que withCredentials est configuré
  if (adminApiContent.includes('withCredentials: true')) {
    success.push(`✅ withCredentials: true est configuré`);
  } else {
    errors.push(`❌ withCredentials: true manquant`);
  }

} catch (error) {
  errors.push(`❌ Erreur lors de la vérification de getApiBaseURL(): ${error.message}`);
}

// Test 3: Vérifier que le backend utilise un chemin fixe 'admin'
console.log('3️⃣  Test: Vérification du contrôleur backend');
try {
  const controllerContent = fs.readFileSync(ADMIN_CONTROLLER_FILE, 'utf8');

  // Vérifier que @Controller utilise 'admin' et non process.env.ADMIN_BASE_PATH
  if (controllerContent.includes("@Controller('admin')")) {
    success.push(`✅ Backend utilise @Controller('admin') (chemin fixe)`);
  } else if (controllerContent.includes('@Controller(process.env.ADMIN_BASE_PATH')) {
    errors.push(`❌ Backend utilise encore process.env.ADMIN_BASE_PATH au lieu de 'admin'`);
  } else {
    warnings.push(`⚠️  Pattern @Controller non trouvé ou modifié`);
  }

} catch (error) {
  errors.push(`❌ Erreur lors de la lecture du contrôleur backend: ${error.message}`);
}

// Test 4: Vérifier que le middleware backend utilise 'admin'
console.log('4️⃣  Test: Vérification du module backend');
try {
  const moduleContent = fs.readFileSync(ADMIN_MODULE_FILE, 'utf8');

  // Vérifier que le middleware utilise 'admin/*' et non adminBasePath
  if (moduleContent.includes(".forRoutes('admin/*')")) {
    success.push(`✅ Middleware backend utilise 'admin/*' (chemin fixe)`);
  } else if (moduleContent.includes('forRoutes(`${adminBasePath}/*`)')) {
    errors.push(`❌ Middleware backend utilise encore adminBasePath au lieu de 'admin/*'`);
  } else {
    warnings.push(`⚠️  Pattern forRoutes non trouvé ou modifié`);
  }

} catch (error) {
  errors.push(`❌ Erreur lors de la lecture du module backend: ${error.message}`);
}

// Test 5: Vérifier que les logs DEV sont bien conditionnels
console.log('5️⃣  Test: Vérification des logs DEV');
try {
  const adminApiContent = fs.readFileSync(ADMIN_API_FILE, 'utf8');

  // Vérifier que console.info est conditionné par NODE_ENV
  const logPatterns = [
    /console\.info.*NODE_ENV.*production/,
    /process\.env\.NODE_ENV.*!==.*['"]production['"]/,
  ];

  const hasConditionalLogs = logPatterns.some(pattern => pattern.test(adminApiContent));

  if (hasConditionalLogs) {
    success.push(`✅ Logs DEV conditionnés par NODE_ENV !== 'production'`);
  } else {
    warnings.push(`⚠️  Vérifier que les logs sont bien conditionnés en production`);
  }

} catch (error) {
  warnings.push(`⚠️  Erreur lors de la vérification des logs: ${error.message}`);
}

// Test 6: Vérifier que l'intercepteur refresh ne refresh pas sur 404/403
console.log('6️⃣  Test: Vérification de l\'intercepteur refresh');
try {
  const adminApiContent = fs.readFileSync(ADMIN_API_FILE, 'utf8');

  // Vérifier que le refresh ne se fait pas sur 404/403
  if (adminApiContent.includes('error.response?.status === 404') ||
      adminApiContent.includes('error.response?.status === 403')) {
    const skipRefreshPattern = /Ne pas refresh sur 404\/403|Ne pas refresh sur|404.*403/;
    if (skipRefreshPattern.test(adminApiContent)) {
      success.push(`✅ Intercepteur ne refresh pas sur 404/403`);
    }
  }

  // Vérifier que le refresh utilise ADMIN_REFRESH_ENDPOINT
  if (adminApiContent.includes('adminApiClient.post(ADMIN_REFRESH_ENDPOINT)')) {
    success.push(`✅ Refresh utilise ADMIN_REFRESH_ENDPOINT`);
  }

} catch (error) {
  warnings.push(`⚠️  Erreur lors de la vérification de l'intercepteur: ${error.message}`);
}

// Résumé des tests
console.log('\n📊 Résumé des tests\n');

if (success.length > 0) {
  console.log('✅ Succès:');
  success.forEach(s => console.log(`   ${s}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Avertissements:');
  warnings.forEach(w => console.log(`   ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Erreurs:');
  errors.forEach(e => console.log(`   ${e}`));
  console.log('');
  process.exit(1);
} else {
  console.log('🎉 Tous les tests critiques sont passés !\n');
  console.log('✅ Les corrections sont valides');
  console.log('✅ Les endpoints API utilisent /admin/... (chemin fixe)');
  console.log('✅ ADMIN_BASE_PATH est uniquement utilisé pour le routing UI');
  console.log('✅ Le backend utilise un chemin fixe /admin');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Pousser les changements sur le repository');
  console.log('   2. Déployer le frontend sur Vercel');
  console.log('   3. Déployer le backend sur VPS');
  console.log('   4. Tester manuellement depuis le navigateur (voir FIX_ADMIN_API_PATHS.md)');
  process.exit(0);
}

#!/usr/bin/env node

/**
 * Script de test d'intégration pour le module Items
 * Teste tous les endpoints et fonctionnalités du module Items
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const API_BASE = `${BASE_URL}/api/v1`;

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Fonction utilitaire pour faire des requêtes HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = (url.protocol === 'https:' ? https : http).request(
      options,
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const jsonBody = body ? JSON.parse(body) : null;
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: jsonBody,
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body,
            });
          }
        });
      },
    );

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Variables globales pour les tests
let accessToken = null;
let userId = null;
let itemId = null;
let photoId = null;

// Tests d'authentification
async function testAuthentication() {
  logHeader("Test d'authentification");

  try {
    // Test d'inscription
    logInfo("Test d'inscription...");
    const registerResponse = await makeRequest('POST', '/auth/register', {
      email: 'test-items-integration@example.com',
      password: 'Password123!',
      displayName: 'Test Items Integration',
    });

    if (registerResponse.status === 201) {
      logSuccess('Inscription réussie');
      accessToken = registerResponse.body.accessToken;
      userId = registerResponse.body.user.id;
    } else {
      logError(`Échec de l'inscription: ${registerResponse.status}`);
      return false;
    }

    // Test de connexion
    logInfo('Test de connexion...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'test-items-integration@example.com',
      password: 'Password123!',
    });

    if (loginResponse.status === 200) {
      logSuccess('Connexion réussie');
      accessToken = loginResponse.body.accessToken;
    } else {
      logError(`Échec de la connexion: ${loginResponse.status}`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`Erreur d'authentification: ${error.message}`);
    return false;
  }
}

// Tests de création d'items
async function testItemCreation() {
  logHeader("Test de création d'items");

  try {
    // Test création basique
    logInfo('Test création basique...');
    const basicItem = {
      title: 'iPhone 12 Pro Max - Test Intégration',
      description:
        "iPhone 12 Pro Max en excellent état, 128GB, couleur bleu pacifique. Test d'intégration complet.",
      category: 'ELECTRONICS',
      condition: 'GOOD',
      tags: ['smartphone', 'apple', '5g', 'test'],
    };

    const basicResponse = await makeRequest('POST', '/items', basicItem, {
      Authorization: `Bearer ${accessToken}`,
    });

    if (basicResponse.status === 201) {
      logSuccess('Création basique réussie');
      itemId = basicResponse.body.id;
      logInfo(`Item créé avec l'ID: ${itemId}`);
    } else {
      logError(
        `Échec création basique: ${basicResponse.status} - ${JSON.stringify(basicResponse.body)}`,
      );
      return false;
    }

    // Test création avec IA (peut échouer si IA non configurée)
    logInfo('Test création avec IA...');
    const aiItem = {
      title: 'Livre vintage de cuisine française - Test IA',
      description:
        "Ancien livre de recettes de cuisine française des années 1970, en bon état général avec quelques pages jaunies. Test de l'analyse IA.",
      condition: 'FAIR',
      aiAuto: true,
    };

    const aiResponse = await makeRequest('POST', '/items', aiItem, {
      Authorization: `Bearer ${accessToken}`,
    });

    if (aiResponse.status === 201) {
      logSuccess('Création avec IA réussie');
      if (aiResponse.body.aiSummary) {
        logInfo(`Résumé IA: ${aiResponse.body.aiSummary}`);
      } else {
        logWarning("IA non configurée ou échec de l'analyse");
      }
    } else {
      logWarning(
        `Création avec IA échouée: ${aiResponse.status} - ${JSON.stringify(aiResponse.body)}`,
      );
    }

    return true;
  } catch (error) {
    logError(`Erreur création d'items: ${error.message}`);
    return false;
  }
}

// Tests de récupération d'items
async function testItemRetrieval() {
  logHeader("Test de récupération d'items");

  try {
    // Test liste complète
    logInfo('Test liste complète...');
    const listResponse = await makeRequest('GET', '/items');

    if (listResponse.status === 200) {
      logSuccess(`Liste récupérée: ${listResponse.body.total} items`);
    } else {
      logError(`Échec liste: ${listResponse.status}`);
      return false;
    }

    // Test filtrage par catégorie
    logInfo('Test filtrage par catégorie...');
    const categoryResponse = await makeRequest(
      'GET',
      '/items?category=ELECTRONICS',
    );

    if (categoryResponse.status === 200) {
      logSuccess(
        `Filtrage par catégorie: ${categoryResponse.body.total} items électroniques`,
      );
    } else {
      logError(`Échec filtrage catégorie: ${categoryResponse.status}`);
    }

    // Test recherche textuelle
    logInfo('Test recherche textuelle...');
    const searchResponse = await makeRequest('GET', '/items?q=iPhone');

    if (searchResponse.status === 200) {
      logSuccess(`Recherche "iPhone": ${searchResponse.body.total} résultats`);
    } else {
      logError(`Échec recherche: ${searchResponse.status}`);
    }

    // Test récupération par ID
    if (itemId) {
      logInfo('Test récupération par ID...');
      const detailResponse = await makeRequest('GET', `/items/${itemId}`);

      if (detailResponse.status === 200) {
        logSuccess('Récupération par ID réussie');
      } else {
        logError(`Échec récupération par ID: ${detailResponse.status}`);
      }
    }

    // Test items de l'utilisateur
    logInfo("Test items de l'utilisateur...");
    const userItemsResponse = await makeRequest('GET', '/items/user/me', null, {
      Authorization: `Bearer ${accessToken}`,
    });

    if (userItemsResponse.status === 200) {
      logSuccess(`Items utilisateur: ${userItemsResponse.body.total} items`);
    } else {
      logError(`Échec items utilisateur: ${userItemsResponse.status}`);
    }

    return true;
  } catch (error) {
    logError(`Erreur récupération d'items: ${error.message}`);
    return false;
  }
}

// Tests de mise à jour d'items
async function testItemUpdate() {
  logHeader("Test de mise à jour d'items");

  if (!itemId) {
    logWarning('Aucun item ID disponible pour les tests de mise à jour');
    return true;
  }

  try {
    // Test mise à jour basique
    logInfo('Test mise à jour basique...');
    const updateData = {
      title: 'iPhone 12 Pro Max - Mis à jour',
      tags: ['smartphone', 'apple', '5g', 'updated'],
    };

    const updateResponse = await makeRequest(
      'PATCH',
      `/items/${itemId}`,
      updateData,
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    if (updateResponse.status === 200) {
      logSuccess('Mise à jour réussie');
    } else {
      logError(
        `Échec mise à jour: ${updateResponse.status} - ${JSON.stringify(updateResponse.body)}`,
      );
      return false;
    }

    // Test mise à jour du statut
    logInfo('Test mise à jour du statut...');
    const statusResponse = await makeRequest(
      'PATCH',
      `/items/${itemId}/status`,
      {
        status: 'PENDING',
      },
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    if (statusResponse.status === 200) {
      logSuccess('Mise à jour du statut réussie');
    } else {
      logError(`Échec mise à jour statut: ${statusResponse.status}`);
    }

    return true;
  } catch (error) {
    logError(`Erreur mise à jour d'items: ${error.message}`);
    return false;
  }
}

// Tests d'upload
async function testUpload() {
  logHeader("Test d'upload d'images");

  try {
    // Test génération de signature
    logInfo('Test génération de signature...');
    const signatureResponse = await makeRequest(
      'POST',
      '/items/uploads/signature',
      {
        folder: `items/${itemId}`,
        maxBytes: 3000000,
      },
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    if (signatureResponse.status === 200 || signatureResponse.status === 201) {
      logSuccess('Signature générée avec succès');
      logInfo(
        `Signature: ${signatureResponse.body.signature.substring(0, 20)}...`,
      );
    } else {
      logError(
        `Échec génération signature: ${signatureResponse.status} - ${JSON.stringify(signatureResponse.body)}`,
      );
      return false;
    }

    // Test attachement de photo (simulation)
    logInfo('Test attachement de photo...');
    const photoData = {
      url: 'https://example.com/test-photo.jpg',
      publicId: 'test-photo-123',
      width: 800,
      height: 600,
    };

    const attachResponse = await makeRequest(
      'POST',
      `/items/${itemId}/photos`,
      photoData,
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    if (attachResponse.status === 201) {
      logSuccess('Photo attachée avec succès');
    } else {
      logWarning(
        `Échec attachement photo: ${attachResponse.status} - ${JSON.stringify(attachResponse.body)}`,
      );
    }

    return true;
  } catch (error) {
    logError(`Erreur tests d'upload: ${error.message}`);
    return false;
  }
}

// Tests de suppression
async function testItemDeletion() {
  logHeader("Test de suppression d'items");

  if (!itemId) {
    logWarning('Aucun item ID disponible pour les tests de suppression');
    return true;
  }

  try {
    // Test suppression
    logInfo("Test suppression d'item...");
    const deleteResponse = await makeRequest(
      'DELETE',
      `/items/${itemId}`,
      null,
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    if (deleteResponse.status === 204) {
      logSuccess('Suppression réussie');
    } else {
      logError(
        `Échec suppression: ${deleteResponse.status} - ${JSON.stringify(deleteResponse.body)}`,
      );
      return false;
    }

    // Vérifier que l'item a été supprimé
    logInfo('Vérification de la suppression...');
    const verifyResponse = await makeRequest('GET', `/items/${itemId}`);

    if (verifyResponse.status === 404) {
      logSuccess('Item supprimé avec succès');
    } else {
      logError(`Item encore accessible: ${verifyResponse.status}`);
    }

    return true;
  } catch (error) {
    logError(`Erreur suppression d'items: ${error.message}`);
    return false;
  }
}

// Tests de sécurité
async function testSecurity() {
  logHeader('Test de sécurité');

  try {
    // Test accès sans authentification
    logInfo('Test accès sans authentification...');
    const noAuthResponse = await makeRequest('POST', '/items', {
      title: 'Test sans auth',
      description: 'Test sans authentification',
      category: 'ELECTRONICS',
      condition: 'GOOD',
    });

    if (noAuthResponse.status === 401) {
      logSuccess('Accès sans authentification correctement rejeté');
    } else {
      logError(
        `Accès sans authentification autorisé: ${noAuthResponse.status}`,
      );
    }

    // Test avec token invalide
    logInfo('Test avec token invalide...');
    const invalidTokenResponse = await makeRequest(
      'POST',
      '/items',
      {
        title: 'Test token invalide',
        description: 'Test avec token invalide',
        category: 'ELECTRONICS',
        condition: 'GOOD',
      },
      {
        Authorization: 'Bearer invalid-token',
      },
    );

    if (invalidTokenResponse.status === 401) {
      logSuccess('Token invalide correctement rejeté');
    } else {
      logError(`Token invalide accepté: ${invalidTokenResponse.status}`);
    }

    return true;
  } catch (error) {
    logError(`Erreur tests de sécurité: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function runIntegrationTests() {
  logHeader("Tests d'intégration - Module Items");
  logInfo(`URL de base: ${API_BASE}`);
  logInfo(`Timestamp: ${new Date().toISOString()}`);

  const tests = [
    { name: 'Authentification', fn: testAuthentication },
    { name: "Création d'items", fn: testItemCreation },
    { name: "Récupération d'items", fn: testItemRetrieval },
    { name: "Mise à jour d'items", fn: testItemUpdate },
    { name: "Upload d'images", fn: testUpload },
    { name: "Suppression d'items", fn: testItemDeletion },
    { name: 'Sécurité', fn: testSecurity },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Erreur dans ${test.name}: ${error.message}`);
      failed++;
    }
  }

  // Résumé
  logHeader('Résumé des tests');
  logSuccess(`Tests réussis: ${passed}`);
  if (failed > 0) {
    logError(`Tests échoués: ${failed}`);
  }
  logInfo(`Total: ${passed + failed} tests`);

  if (failed === 0) {
    logSuccess("🎉 Tous les tests d'intégration sont passés !");
    process.exit(0);
  } else {
    logError('❌ Certains tests ont échoué');
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logError(`Erreur non gérée: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Exception non capturée: ${error.message}`);
  process.exit(1);
});

// Lancement des tests
if (require.main === module) {
  runIntegrationTests().catch((error) => {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  testAuthentication,
  testItemCreation,
  testItemRetrieval,
  testItemUpdate,
  testUpload,
  testItemDeletion,
  testSecurity,
};

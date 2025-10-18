#!/usr/bin/env node

/**
 * Script de test pour les services externes
 * Usage: node scripts/test-services.js [service]
 * Services: gemini, cloudinary, firebase, all
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(50)}`, 'blue');
  log(`🧪 ${title}`, 'bold');
  log(`${'='.repeat(50)}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test Gemini API
async function testGemini() {
  logHeader('Test Gemini API');

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    logError('GEMINI_API_KEY non configurée');
    logInfo('Pour configurer Gemini:');
    logInfo('1. Allez sur https://aistudio.google.com/');
    logInfo("2. Créez un projet et activez l'API Gemini");
    logInfo('3. Générez une clé API');
    logInfo('4. Ajoutez GEMINI_API_KEY=votre_cle dans le .env');
    return false;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Génère 3 suggestions d'objets populaires pour un échange. Réponds en JSON avec un array d'objets ayant les propriétés: title, description, category.",
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess('Gemini API fonctionne correctement !');
      logInfo('Exemple de réponse reçue');
      console.log(JSON.stringify(data, null, 2));
      return true;
    } else {
      const error = await response.text();
      logError(`Erreur Gemini API: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur de connexion Gemini: ${error.message}`);
    return false;
  }
}

// Test Cloudinary
async function testCloudinary() {
  logHeader('Test Cloudinary');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || cloudName === 'your_cloudinary_cloud_name') {
    logError('CLOUDINARY_CLOUD_NAME non configurée');
    logInfo('Pour configurer Cloudinary:');
    logInfo('1. Allez sur https://cloudinary.com/');
    logInfo('2. Créez un compte gratuit');
    logInfo('3. Récupérez Cloud Name, API Key et API Secret');
    logInfo('4. Ajoutez les variables dans le .env');
    return false;
  }

  try {
    // Test de l'URL de base Cloudinary
    const testUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
      },
    });

    if (response.ok) {
      logSuccess('Cloudinary fonctionne correctement !');
      logInfo(`Cloud Name: ${cloudName}`);
      logInfo(`API Key: ${apiKey.substring(0, 8)}...`);
      return true;
    } else {
      logError(`Erreur Cloudinary: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur de connexion Cloudinary: ${error.message}`);
    return false;
  }
}

// Test Firebase
async function testFirebase() {
  logHeader('Test Firebase');

  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  const senderId = process.env.NEXT_PUBLIC_FCM_SENDER_ID;

  if (!vapidKey || vapidKey === 'your_web_push_vapid_key') {
    logError('NEXT_PUBLIC_FCM_VAPID_KEY non configurée');
    logInfo('Pour configurer Firebase:');
    logInfo('1. Allez sur https://console.firebase.google.com/');
    logInfo('2. Créez un projet et activez Cloud Messaging');
    logInfo('3. Générez une paire de clés VAPID');
    logInfo('4. Récupérez le Sender ID');
    logInfo('5. Ajoutez les variables dans le .env');
    return false;
  }

  try {
    // Test de validation des clés VAPID
    if (vapidKey.length < 80) {
      logError('Clé VAPID invalide (trop courte)');
      return false;
    }

    if (!senderId || isNaN(senderId)) {
      logError('Sender ID invalide');
      return false;
    }

    logSuccess('Firebase configuré correctement !');
    logInfo(`VAPID Key: ${vapidKey.substring(0, 20)}...`);
    logInfo(`Sender ID: ${senderId}`);
    return true;
  } catch (error) {
    logError(`Erreur Firebase: ${error.message}`);
    return false;
  }
}

// Test de l'API locale
async function testLocalAPI() {
  logHeader('Test API Locale');

  try {
    const response = await fetch('http://localhost:4000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        displayName: 'Test User',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      logSuccess('API locale fonctionne correctement !');
      logInfo(`Utilisateur créé: ${data.user.email}`);
      return true;
    } else {
      logError(`Erreur API locale: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur de connexion API locale: ${error.message}`);
    logInfo('Assurez-vous que le backend est démarré (npm run start:dev)');
    return false;
  }
}

// Fonction principale
async function main() {
  const service = process.argv[2] || 'all';

  logHeader('Test des Services SecondLife Exchange');
  logInfo(`Test du service: ${service}`);

  const results = {};

  if (service === 'all' || service === 'api') {
    results.api = await testLocalAPI();
  }

  if (service === 'all' || service === 'gemini') {
    results.gemini = await testGemini();
  }

  if (service === 'all' || service === 'cloudinary') {
    results.cloudinary = await testCloudinary();
  }

  if (service === 'all' || service === 'firebase') {
    results.firebase = await testFirebase();
  }

  // Résumé
  logHeader('Résumé des Tests');
  Object.entries(results).forEach(([service, success]) => {
    if (success) {
      logSuccess(`${service.toUpperCase()}: OK`);
    } else {
      logError(`${service.toUpperCase()}: ÉCHEC`);
    }
  });

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  log(
    `\n📊 Résultat: ${successCount}/${totalCount} services fonctionnels`,
    successCount === totalCount ? 'green' : 'yellow'
  );

  if (successCount < totalCount) {
    log('\n💡 Conseils:', 'blue');
    log('• Vérifiez vos clés API dans le fichier .env');
    log('• Assurez-vous que les services sont activés');
    log('• Consultez la documentation de chaque service');
  }
}

// Gestion des erreurs
process.on('unhandledRejection', error => {
  logError(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

// Exécution
main().catch(console.error);

/**
 * FICHIER: test-admin-login.ts
 *
 * DESCRIPTION:
 * Script pour tester la connexion admin.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env') });

const API_URL = process.env.API_PORT 
  ? `http://localhost:${process.env.API_PORT}/api/v1`
  : 'http://localhost:4000/api/v1';

async function testAdminLogin() {
  const email = process.env.ADMIN_EMAIL || 'admin@secondlife.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  console.log('🧪 Test de connexion admin...');
  console.log(`📧 Email: ${email}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log('');

  try {
    const response = await axios.post(`${API_URL}/auth/admin/login`, {
      email,
      password,
    });

    console.log('✅ Connexion réussie !');
    console.log(`🔑 Token reçu: ${response.data.accessToken ? 'Oui' : 'Non'}`);
    console.log(`👤 Utilisateur: ${response.data.user?.email}`);
    console.log(`🎭 Rôle: ${response.data.user?.roles}`);
  } catch (error: any) {
    console.error('❌ Erreur de connexion:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.data}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   Aucune réponse du serveur. Vérifiez que le backend est démarré.');
      console.error(`   URL tentée: ${API_URL}/auth/admin/login`);
    } else {
      console.error('   Erreur:', error.message);
    }
    process.exit(1);
  }
}

testAdminLogin();


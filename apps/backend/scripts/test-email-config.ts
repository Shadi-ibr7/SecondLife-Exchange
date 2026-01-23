/**
 * Script de test pour vérifier la configuration email
 * Usage: npx ts-node scripts/test-email-config.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis le root
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const FRONTEND_URL = process.env.FRONTEND_URL;

console.log('\n=== Vérification de la configuration email ===\n');

console.log('RESEND_API_KEY:', RESEND_API_KEY ? `✅ Configuré (${RESEND_API_KEY.substring(0, 10)}...)` : '❌ NON CONFIGURÉ');
console.log('EMAIL_FROM:', EMAIL_FROM ? `✅ ${EMAIL_FROM}` : '❌ NON CONFIGURÉ');
console.log('FRONTEND_URL:', FRONTEND_URL ? `✅ ${FRONTEND_URL}` : '❌ NON CONFIGURÉ');

if (!RESEND_API_KEY || !EMAIL_FROM) {
  console.log('\n❌ Configuration incomplète. Veuillez définir RESEND_API_KEY et EMAIL_FROM.');
  process.exit(1);
}

// Tester l'envoi d'un email
import { Resend } from 'resend';

const resend = new Resend(RESEND_API_KEY);

console.log('\n=== Test d\'envoi d\'email ===\n');

resend.emails
  .send({
    from: EMAIL_FROM,
    to: 'test@example.com', // Email de test (ne sera pas vraiment envoyé si le domaine n'est pas vérifié)
    subject: 'Test de configuration email',
    html: '<p>Ceci est un test de configuration email.</p>',
  })
  .then((result) => {
    if (result.error) {
      console.log('❌ Erreur:', result.error.message);
      if (result.error.message?.includes('domain is not verified')) {
        const domain = EMAIL_FROM.split('@')[1];
        console.log(`\n⚠️  Le domaine ${domain} n'est pas vérifié dans Resend.`);
        console.log(`   Solutions:`);
        console.log(`   1. Vérifier le domaine sur https://resend.com/domains`);
        console.log(`   2. Utiliser temporairement: EMAIL_FROM=onboarding@resend.dev`);
      }
      process.exit(1);
    } else {
      console.log('✅ Email envoyé avec succès!');
      console.log('   ID:', result.data?.id);
      process.exit(0);
    }
  })
  .catch((error) => {
    console.log('❌ Erreur:', error.message);
    process.exit(1);
  });

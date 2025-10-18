#!/usr/bin/env node

/**
 * Script pour lister les modèles Gemini disponibles
 */

require('dotenv').config();

async function listGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY non configurée');
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Modèles Gemini disponibles:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log(`❌ Erreur: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  }
}

listGeminiModels();

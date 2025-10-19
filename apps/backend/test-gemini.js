const { GeminiService } = require('./dist/modules/ai/gemini.service');

async function testGemini() {
  const geminiService = new GeminiService();

  console.log('🧪 Test direct du service Gemini...');

  try {
    const result = await geminiService.analyzeItem({
      title: 'Livre vintage de cuisine française',
      description:
        'Ancien livre de recettes de cuisine française des années 1970, en bon état général avec quelques pages jaunies. Contient de nombreuses recettes traditionnelles.',
    });

    console.log('✅ Résultat:', result);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testGemini();

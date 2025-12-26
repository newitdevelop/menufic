// Test translation of disclaimer
const { translateWithDeepL } = require('./src/utils/deepl');

async function test() {
  console.log('Testing DeepL translation of disclaimer...');
  
  const sourceText = "Imagem gerada por IA - o prato real pode variar";
  const targetLang = "EN";
  
  try {
    const result = await translateWithDeepL(sourceText, targetLang, "PT");
    console.log('Source (PT):', sourceText);
    console.log('Translation (EN):', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();

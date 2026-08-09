import translationsHi from "../data/translations_hi";
import translationsMr from "../data/translations_mr";

const cache = new Map();

/**
 * Mocks translating text to a target language.
 * @param {string} text - The text to translate.
 * @param {string} targetLang - The target language code (e.g., 'hi', 'mr').
 * @returns {Promise<string>} - The translated text.
 */
export default async function translateText(text, targetLang) {
  if (targetLang === 'en' || !text) return text;

  const cacheKey = `${targetLang}:${text}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  let translatedText = text;
  
  if (targetLang === 'hi') {
    // Lookup exact Hindi translation or fallback to original if not found
    translatedText = translationsHi[text] || text;
  } else if (targetLang === 'mr') {
    // Lookup exact Marathi translation or fallback to original if not found
    translatedText = translationsMr[text] || text;
  }

  cache.set(cacheKey, translatedText);
  return translatedText;
}
